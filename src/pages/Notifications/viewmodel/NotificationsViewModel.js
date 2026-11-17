import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  NOTIFICATION_EVENTS,
  listenPrivate,
  userNotificationsChannel,
} from '../../../shared/realtime/echoChannels.js'
import {
  NOTIFICATION_KEYS,
  fetchNotificationOptions,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../entities/notification/notificationApi.js'

export const STATUS_OPTIONS = [
  { value: 'unread', label: 'Непрочитані' },
  { value: 'read', label: 'Прочитані' },
  { value: 'all', label: 'Усі' },
]

/** Сторінка /notifications: фільтри, список, позначення прочитаним, realtime. */
export class NotificationsViewModel {
  statusFilter = 'unread' // all | unread | read
  typeFilter = ''

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.optionsQuery = scope.query({
      queryKey: NOTIFICATION_KEYS.options,
      queryFn: fetchNotificationOptions,
      staleTime: 5 * 60 * 1000,
    })

    this.listQuery = scope.query({
      queryKey: () => NOTIFICATION_KEYS.list(this.listParams),
      queryFn: ({ queryKey }) => fetchNotifications(queryKey[2]),
    })

    this.markReadMutation = scope.mutation({ mutationFn: markNotificationRead })
    this.markAllMutation = scope.mutation({
      mutationFn: markAllNotificationsRead,
      invalidateQueries: { queryKey: NOTIFICATION_KEYS.all },
    })
  }

  /** Realtime: будь-яка подія в персональному каналі → перезапит списків. */
  mount() {
    return listenPrivate(
      userNotificationsChannel(this.stores.session.userId),
      NOTIFICATION_EVENTS,
      this.refresh,
    )
  }

  // ---- derived ------------------------------------------------------------

  get listParams() {
    const params = {}
    if (this.statusFilter !== 'all') params.unread = this.statusFilter === 'unread' ? 1 : 0
    if (this.typeFilter) params.type = this.typeFilter
    return params
  }

  get notifications() {
    return this.listQuery.data ?? []
  }

  get isLoading() {
    return this.listQuery.isLoading
  }

  get isEmpty() {
    return !this.isLoading && this.notifications.length === 0
  }

  get typeOptions() {
    return this.optionsQuery.data?.types ?? []
  }

  typeLabel(value) {
    return this.typeOptions.find((option) => option.value === value)?.label ?? value
  }

  // ---- actions ------------------------------------------------------------

  setStatusFilter(value) {
    this.statusFilter = value
  }

  setTypeFilter(value) {
    this.typeFilter = value
  }

  refresh() {
    return this.scope.invalidate(NOTIFICATION_KEYS.all)
  }

  updateList(updater) {
    this.scope.queryClient.setQueryData(NOTIFICATION_KEYS.list(this.listParams), (list) =>
      list ? updater(list) : list,
    )
  }

  /** Оптимістично прибирає зі списку; при помилці — перезапит. */
  async markRead(id) {
    this.updateList((list) => list.filter((n) => n.id !== id))

    try {
      await this.markReadMutation.mutate(id)
    } catch {
      this.refresh()
    }
  }

  async markAllRead() {
    if (this.statusFilter === 'unread') {
      this.updateList(() => [])
    } else if (this.statusFilter === 'all') {
      const now = new Date().toISOString()
      this.updateList((list) => list.map((n) => ({ ...n, read_at: n.read_at ?? now })))
    }

    try {
      await this.markAllMutation.mutate()
    } catch {
      this.refresh()
    }
  }

  /** Перед переходом за посиланням позначає непрочитану нотифікацію прочитаною. */
  async open(notification) {
    if (!notification.read_at) {
      await this.markRead(notification.id)
    }
  }
}
