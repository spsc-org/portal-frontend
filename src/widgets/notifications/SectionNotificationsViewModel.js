import { makeViewModel } from '../../shared/mvvm/makeViewModel.js'
import {
  NOTIFICATION_KEYS,
  fetchNotifications,
  markNotificationRead,
} from '../../entities/notification/notificationApi.js'
import { anchoredPosition } from './anchoredPosition.js'

/**
 * Спливний список непрочитаних нотифікацій розділу (бейдж пункту сайдбару).
 * Живе, лише поки панель відкрита (View монтується умовно), тож список
 * вантажиться заново при кожному відкритті.
 */
export class SectionNotificationsViewModel {
  constructor({ scope, stores, section, anchorRect, onClose }) {
    this.scope = scope
    this.stores = stores
    this.params = { unread: 1, per_page: 20, section }
    this.position = anchoredPosition(anchorRect)
    this.onClose = onClose
    makeViewModel(this, { params: false, position: false, onClose: false })

    this.listQuery = scope.query({
      queryKey: NOTIFICATION_KEYS.list(this.params),
      queryFn: () => fetchNotifications(this.params),
      staleTime: 0,
    })

    this.markReadMutation = scope.mutation({ mutationFn: markNotificationRead })
  }

  get items() {
    return this.listQuery.data ?? []
  }

  get isLoading() {
    return this.listQuery.isLoading
  }

  updateItems(updater) {
    this.scope.queryClient.setQueryData(NOTIFICATION_KEYS.list(this.params), (list) => updater(list ?? []))
  }

  /** Панель закривається сама, коли прочитано останній пункт. */
  markRead(id) {
    // Залишок рахуємо в updater: observer-и TanStack оновлюються батчем,
    // тож this.items одразу після setQueryData ще може бути старим.
    let remaining = 0
    this.updateItems((list) => {
      const next = list.filter((n) => n.id !== id)
      remaining = next.length
      return next
    })
    if (remaining === 0) this.onClose()

    return this.markReadMutation.mutate(id).catch(() => {})
  }

  markAllRead() {
    const ids = this.items.map((n) => n.id)
    this.updateItems(() => [])
    this.onClose()
    ids.forEach((id) => markNotificationRead(id).catch(() => {}))
  }

  openNotification(notification) {
    return notification.read_at ? undefined : this.markRead(notification.id)
  }
}
