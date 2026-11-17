import { apiFetch } from '../../lib/api.js'

/**
 * Model-шар нотифікацій (спільний для сторінки /notifications, дзвіночка й
 * сайдбару). Усі ключі починаються з NOTIFICATION_KEYS.all — інвалідація
 * `['notifications']` оновлює всіх споживачів разом.
 */
export const NOTIFICATION_KEYS = {
  all: ['notifications'],
  options: ['notifications', 'options'],
  list: (params) => ['notifications', 'list', params],
  unreadCount: ['notifications', 'unread-count'],
  sections: ['notifications', 'sections'],
}

export const fetchNotificationOptions = () =>
  apiFetch('/api/notifications/options').then((payload) => payload?.data ?? { types: [] })

export const fetchNotifications = (params) =>
  apiFetch('/api/notifications', { params }).then((payload) => payload?.data ?? [])

export const fetchNotification = (id) =>
  apiFetch(`/api/notifications/${id}`).then((payload) => payload?.data ?? null)

/** Лічильники непрочитаних по розділах сайдбару: { [pageKey]: count }. */
export const fetchNotificationSections = () =>
  apiFetch('/api/notifications/sections').then((payload) => payload?.data ?? {})

export const fetchUnreadCount = () =>
  apiFetch('/api/notifications/unread-count').then((payload) => payload?.data?.count ?? 0)

export const markNotificationRead = (id) =>
  apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  apiFetch('/api/notifications/read-all', { method: 'POST' })
