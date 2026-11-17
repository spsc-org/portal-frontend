import { reaction } from 'mobx'
import { makeViewModel } from '../../shared/mvvm/makeViewModel.js'
import { resolveMenuItems } from '../../entities/menu/menuCache.js'
import { listenPrivate, userNotificationsChannel } from '../../shared/realtime/echoChannels.js'
import { NOTIFICATION_KEYS, fetchNotificationSections } from '../../entities/notification/notificationApi.js'
import {
  persistOnlineUsersOpen,
  persistSidebarOpen,
  readOnlineUsersOpen,
  readSidebarOpen,
} from './sidebarStorage.js'

export const SIDEBAR_UI = {
  collapse: 'Згорнути',
  expand: 'Розгорнути',
  onlineUsers: 'Користувачі онлайн',
  feedback: 'Залишити відгук',
}

/** Глобальний сайдбар: згортання, меню з /api/me, бейджі розділів (realtime). */
export class SidebarViewModel {
  open = readSidebarOpen(true)
  onlineUsersOpen = readOnlineUsersOpen(true)

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.sectionsQuery = scope.query({
      queryKey: NOTIFICATION_KEYS.sections,
      queryFn: fetchNotificationSections,
      // Каркас може рендеритись з кешу меню ще до підтвердження сесії.
      options: () => ({ enabled: this.stores.session.isAuthenticated }),
    })
  }

  mount() {
    // Підписка — коли відомий userId (сайдбар може змонтуватись з кешу меню
    // до відповіді /api/me) і заново при зміні користувача.
    let offs = []
    const unsubscribe = () => {
      offs.forEach((off) => off())
      offs = []
    }
    const stopReaction = reaction(
      () => this.stores.session.userId,
      (userId) => {
        unsubscribe()
        const channel = userNotificationsChannel(userId)
        if (!channel) return
        // Події з того ж приватного каналу, що й дзвіночок, несуть актуальні sections.
        offs = [
          listenPrivate(
            channel,
            ['.notification.created', '.notification.read', '.notifications.read_for_entity'],
            this.applySections,
          ),
          listenPrivate(channel, ['.notifications.read_all'], this.clearSections),
        ]
      },
      { fireImmediately: true },
    )
    return () => {
      stopReaction()
      unsubscribe()
    }
  }

  // ---- derived ------------------------------------------------------------

  get session() {
    return this.stores.session
  }

  /** Меню ще невідоме: немає ні кешу в localStorage, ні відповіді /api/me. */
  get isMenuLoading() {
    return !this.session.menu
  }

  /** Дані, що потребують підтвердженої сесії (користувач, онлайн, бейджі). */
  get isAuthenticated() {
    return this.session.isAuthenticated
  }

  /** Пункти — з menu.catalog (/api/me або кеш), видимість — access.pages. */
  get items() {
    return resolveMenuItems(this.session.menu)
  }

  get version() {
    return this.session.menu?.version ?? null
  }

  badgeCount(key) {
    return this.sectionsQuery.data?.[key] ?? 0
  }

  badgeLabel(key) {
    const count = this.badgeCount(key)
    return count > 99 ? '99+' : String(count)
  }

  // ---- actions ------------------------------------------------------------

  toggleOpen() {
    this.open = !this.open
    persistSidebarOpen(this.open)
  }

  toggleOnlineUsers() {
    this.onlineUsersOpen = !this.onlineUsersOpen
    persistOnlineUsersOpen(this.onlineUsersOpen)
  }

  /** Подія несе лише змінені розділи — зливаємо з поточними. */
  applySections(event) {
    if (!event?.sections) return
    this.scope.queryClient.setQueryData(NOTIFICATION_KEYS.sections, (current) => ({
      ...(current ?? {}),
      ...event.sections,
    }))
  }

  clearSections() {
    this.scope.queryClient.setQueryData(NOTIFICATION_KEYS.sections, {})
  }
}
