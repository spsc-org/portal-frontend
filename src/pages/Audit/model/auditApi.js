import { apiFetch } from '../../../lib/api.js'
import { serializeParams } from '../../../lib/utils.js'

export const AUDIT_ENTITIES = [
  { value: 'project', label: 'Проєкти' },
  { value: 'identifier', label: 'Ідентифікатори' },
  { value: 'user', label: 'Користувачі' },
  { value: 'inventory', label: 'Інвентар' },
]

export const AUDIT_KEYS = {
  options: ['audit-options'],
  list: (entity, filters) => ['audit', entity, filters],
  detail: (entity, id) => ['audit-detail', entity, id],
}

/** { users: [{ id, name }], actions: { [entity]: string[] } } */
export const fetchAuditOptions = () =>
  apiFetch('/api/audit/options').then((payload) => payload?.data ?? { users: [], actions: {} })

/** filters.page — 0-based, бекенд чекає 1-based; userId — [{ value, label }] → ids. */
export const fetchAuditPage = (entity, filters) => {
  const params = {
    ...filters,
    page: filters.page + 1,
    userId: (filters.userId ?? []).map((user) => user.value),
  }
  return apiFetch(`/api/audit/${entity}`, { params: serializeParams(params) })
}

/** { record, diff: { added, changed, removed }, previous } */
export const fetchAuditRecord = (entity, id) =>
  apiFetch(`/api/audit/${entity}/${id}`).then((payload) => payload?.data ?? null)
