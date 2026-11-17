import { makeViewModel } from '../../shared/mvvm/makeViewModel.js'
import { listenPrivate, userNotificationsChannel } from '../../shared/realtime/echoChannels.js'
import { isGeneralNotification } from '../../lib/notificationTypes'
import {
  NOTIFICATION_KEYS,
  fetchNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../entities/notification/notificationApi.js'
import { anchoredPosition } from './anchoredPosition.js'

// general=1 — лише нотифікації без розділу сайдбару (system.message):
// предметні типи живуть у бейджах сайдбару, не в дзвіночку.
const BELL_LIST_PARAMS = { unread: 1, general: 1, per_page: 20 }
const BELL_LIST_KEY = NOTIFICATION_KEYS.list(BELL_LIST_PARAMS)

/** Дзвіночок у сайдбарі: лічильник непрочитаних + панель загальних нотифікацій. */
export class NotificationBellViewModel {
  open = false
  position = anchoredPosition(null)

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.countQuery = scope.query({
      queryKey: NOTIFICATION_KEYS.unreadCount,
      queryFn: fetchUnreadCount,
    })

    // Список вантажиться лише поки панель відкрита (і заново при кожному відкритті).
    this.listQuery = scope.query({
      queryKey: BELL_LIST_KEY,
      queryFn: () => fetchNotifications(BELL_LIST_PARAMS),
      staleTime: 0,
      options: () => ({ enabled: this.open }),
    })

    this.markReadMutation = scope.mutation({ mutationFn: markNotificationRead })
    this.markAllMutation = scope.mutation({ mutationFn: markAllNotificationsRead })
  }

  mount() {
    const channel = userNotificationsChannel(this.stores.session.userId)

    const offs = [
      listenPrivate(channel, ['.notification.created'], this.handleCreated),
      listenPrivate(channel, ['.notification.read'], this.handleRead),
      listenPrivate(channel, ['.notifications.read_all'], this.handleReadAll),
    ]

    return () => offs.forEach((off) => off())
  }

  // ---- derived ------------------------------------------------------------

  get unreadCount() {
    return this.countQuery.data ?? 0
  }

  get badgeLabel() {
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
  }

  get items() {
    return this.listQuery.data ?? []
  }

  // ---- кеш ----------------------------------------------------------------

  setCount(count) {
    this.scope.queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount, Math.max(0, count))
  }

  updateItems(updater) {
    this.scope.queryClient.setQueryData(BELL_LIST_KEY, (list) => updater(list ?? []))
  }

  // ---- realtime -----------------------------------------------------------

  async handleCreated(event) {
    if (typeof event.unread_count === 'number') {
      this.setCount(event.unread_count)
    } else {
      this.scope.invalidate(NOTIFICATION_KEYS.unreadCount)
    }

    // Подія приходить для будь-якого типу; у панель додаємо лише загальні.
    if (this.open && event.id) {
      const row = await fetchNotification(event.id)
      if (!row || row.read_at || !isGeneralNotification(row.type)) return

      this.updateItems((list) =>
        list.some((n) => n.id === row.id)
          ? list.map((n) => (n.id === row.id ? row : n))
          : [row, ...list].slice(0, 20),
      )
    }
  }

  handleRead(event) {
    if (typeof event.unread_count === 'number') this.setCount(event.unread_count)
    if (event.id) this.updateItems((list) => list.filter((n) => n.id !== event.id))
  }

  handleReadAll(event) {
    this.setCount(typeof event.unread_count === 'number' ? event.unread_count : 0)
    this.updateItems(() => [])
  }

  // ---- actions ------------------------------------------------------------

  /** Відкрити/закрити панель біля тригера (rect — getBoundingClientRect кнопки). */
  toggle(anchorRect) {
    if (!this.open) this.position = anchoredPosition(anchorRect)
    this.open = !this.open
  }

  close() {
    this.open = false
  }

  async markRead(id) {
    this.updateItems((list) => list.filter((n) => n.id !== id))
    this.setCount(this.unreadCount - 1)

    try {
      await this.markReadMutation.mutate(id)
    } catch {
      this.scope.invalidate(NOTIFICATION_KEYS.unreadCount)
      if (this.open) this.listQuery.refetch()
    }
  }

  async markAllRead() {
    this.updateItems(() => [])
    this.setCount(0)
    this.open = false

    try {
      await this.markAllMutation.mutate()
    } catch {
      this.scope.invalidate(NOTIFICATION_KEYS.unreadCount)
    }
  }

  openNotification(notification) {
    return notification.read_at ? undefined : this.markRead(notification.id)
  }
}
