import { apiFetch } from '../../../lib/api.js'

export const ADMIN_KEYS = {
  options: ['admin-options'],
  list: (filters) => ['admin-users', filters],
  user: (id) => ['user-edit', id],
}

// Заголовок userId — контракт бекенду (той самий, що слала Inertia-версія).
const withUser = (userId, extra = {}) => ({ ...extra, headers: { userId, ...(extra.headers ?? {}) } })

/** { units, isResponsible, trashed, ranks } — словники фільтрів і форми. */
export const fetchAdminOptions = (userId) =>
  apiFetch('/api/admin-users/options', withUser(userId)).then((payload) => payload?.data ?? {})

const isEmptyFilter = (value) => value === '' || value === null || value === undefined || value === 'all'

/** Порожні та 'all' фільтри не відправляємо. → { data, limit, total } */
export function fetchAdminUsers(filters, userId) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (!isEmptyFilter(value)) params.append(key, value)
  }
  return apiFetch('/api/admin-users', withUser(userId, { params }))
}

export const fetchAdminUser = (id, userId) =>
  apiFetch(`/api/admin-users/${id}`, withUser(userId)).then((payload) => payload?.data ?? null)

export const createAdminUser = (body, userId) => apiFetch('/api/admin-users', withUser(userId, { method: 'POST', body }))

export const updateAdminUser = (id, body, userId) =>
  apiFetch(`/api/admin-users/${id}`, withUser(userId, { method: 'PATCH', body }))

export const deleteAdminUser = (id, userId) => apiFetch(`/api/admin-users/${id}`, withUser(userId, { method: 'DELETE' }))

export const restoreAdminUser = (id, userId) =>
  apiFetch(`/api/admin-users/${id}/restore`, withUser(userId, { method: 'POST' }))

/** { userIds, sections: { [page]: { enabled, permissions? } } } → { data: { updated, skipped } } */
export const bulkUpdatePermissions = (body, userId) =>
  apiFetch('/api/admin-users/bulk-permissions', withUser(userId, { method: 'POST', body }))
