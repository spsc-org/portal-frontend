import { makeViewModel } from '../../shared/mvvm/makeViewModel.js'
import { listenPublic } from '../../shared/realtime/echoChannels.js'
import { apiFetch } from '../../lib/api.js'

const PING_INTERVAL = 60 * 1000 // ping кожні 60 с
const AFK_TIMEOUT = 15 * 60 * 1000 // 15 хв без активності → AFK
const MIN_PING_GAP = 10 * 1000
const VISIBLE_LIMIT = 3
const PRESENCE_CHANNEL = 'user.presence'

function readShowAll() {
  return document.cookie.split('; ').find((row) => row.startsWith('showAllUsers='))?.split('=')[1] === 'true'
}

const isForeground = () => !document.hidden && document.hasFocus()

/**
 * "Користувачі онлайн" (порт UserActivityManager + ActiveUsers з Inertia-версії):
 *  - періодичний ping GET /api/helper/presence/ping?status=active|afk
 *    (відповідь — актуальний список онлайн);
 *  - AFK: 15 хв без активності, або вкладка у фоні 15 хв;
 *  - presence-канал user.presence (.UserPresenceUpdated) — push-оновлення списку;
 *  - публічний канал notify.users (.notify) — системні оголошення (alert).
 */
export class OnlineUsersViewModel {
  users = []
  showAll = readShowAll()

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    // Таймери/прапорці — службовий стан, не для рендера.
    this.timers = { interval: null, hiddenAfk: null }
    this.lastActivityTime = Date.now()
    this.lastPingAt = 0
    this.inFlight = false
    this.hiddenAfkSent = false
    makeViewModel(this, { timers: false, lastActivityTime: false, lastPingAt: false, inFlight: false, hiddenAfkSent: false })
  }

  mount() {
    const cleanups = [this.bindActivityEvents(), this.subscribePresence(), this.subscribeNotify()]
    this.startPinging()
    this.ping(true)

    return () => {
      this.stopPinging()
      this.clearHiddenAfk()
      cleanups.forEach((cleanup) => cleanup())
    }
  }

  // ---- derived ------------------------------------------------------------

  get otherUsers() {
    const me = this.stores.session.userId
    return this.users.filter((user) => user.id !== me)
  }

  get displayedUsers() {
    return this.showAll ? this.otherUsers : this.otherUsers.slice(0, VISIBLE_LIMIT)
  }

  get total() {
    return this.otherUsers.length
  }

  get canToggleShowAll() {
    return this.total > VISIBLE_LIMIT
  }

  // ---- actions ------------------------------------------------------------

  setUsers(users) {
    this.users = Array.isArray(users) ? users : []
    // Сторінки (напр. /project — бейдж 'Редагує') слухають список без власного presence-каналу
    window.__presenceUsers = this.users
    window.dispatchEvent(new CustomEvent('user-presence-changed', { detail: this.users }))
  }

  toggleShowAll() {
    this.showAll = !this.showAll
    document.cookie = `showAllUsers=${this.showAll}; path=/; max-age=31536000; samesite=Strict`
  }

  // ---- presence ping ----------------------------------------------------

  resolveStatus(override) {
    if (override === 'active' || override === 'afk') return override
    if (this.hiddenAfkSent || !isForeground()) return 'afk'
    return Date.now() - this.lastActivityTime < AFK_TIMEOUT ? 'active' : 'afk'
  }

  async ping(force = false, statusOverride = null) {
    if (!navigator.onLine) return
    if (!force && this.inFlight) return

    const now = Date.now()
    if (!force && this.lastPingAt > 0 && now - this.lastPingAt < MIN_PING_GAP) return

    this.inFlight = true
    this.lastPingAt = now

    try {
      const response = await apiFetch('/api/helper/presence/ping', {
        params: { status: this.resolveStatus(statusOverride) },
      })
      if (Array.isArray(response?.userData)) this.setUsers(response.userData)
    } catch {
      // ping не критичний — наступний інтервал повторить
    } finally {
      this.inFlight = false
    }
  }

  startPinging() {
    if (!this.timers.interval) this.timers.interval = setInterval(() => this.ping(), PING_INTERVAL)
  }

  stopPinging() {
    clearInterval(this.timers.interval)
    this.timers.interval = null
  }

  clearHiddenAfk() {
    clearTimeout(this.timers.hiddenAfk)
    this.timers.hiddenAfk = null
  }

  handleBackground() {
    this.hiddenAfkSent = false
    this.stopPinging()
    this.clearHiddenAfk()
    this.timers.hiddenAfk = setTimeout(() => {
      if (!document.hidden || !navigator.onLine) return
      this.hiddenAfkSent = true
      this.ping(true, 'afk')
    }, AFK_TIMEOUT)
  }

  handleForeground() {
    if (!isForeground()) return
    this.clearHiddenAfk()
    this.hiddenAfkSent = false
    this.lastActivityTime = Date.now()
    this.startPinging()
    this.ping(true, 'active')
  }

  bindActivityEvents() {
    const onActivity = () => {
      if (isForeground()) this.lastActivityTime = Date.now()
    }
    const onVisibility = () => (document.hidden ? this.handleBackground() : this.handleForeground())
    const onOnline = () => isForeground() && this.handleForeground()
    const onOffline = () => this.stopPinging()

    const listeners = [
      ...['keydown', 'click', 'pointerdown', 'touchstart'].map((event) => [window, event, onActivity]),
      [document, 'visibilitychange', onVisibility],
      [window, 'blur', this.handleBackground],
      [window, 'focus', this.handleForeground],
      [window, 'online', onOnline],
      [window, 'offline', onOffline],
    ]

    listeners.forEach(([target, event, handler]) => target.addEventListener(event, handler))
    return () => listeners.forEach(([target, event, handler]) => target.removeEventListener(event, handler))
  }

  subscribePresence() {
    const echo = window.Echo
    if (!echo) return () => {}

    echo
      .join(PRESENCE_CHANNEL)
      // Список з presence-членів не беремо: істинний список — з ping/UserPresenceUpdated.
      .here(() => this.setUsers([]))
      .listen('.UserPresenceUpdated', (event) => {
        if (event?.userData) this.setUsers(event.userData)
      })

    // Канал використовує лише цей віджет — можна покинути повністю.
    return () => echo.leave(PRESENCE_CHANNEL)
  }

  subscribeNotify() {
    return listenPublic('notify.users', ['.notify'], (event) => {
      if (event?.message) window.alert(event.message)
    })
  }
}
