import { apiFetch } from '../../../lib/api.js'
import { serializeParams } from '../../../lib/utils.js'

export const SUBJECT_KEYS = {
  list: (filters) => ['subjects', filters],
  detail: (id) => ['subject', id],
}

/** filters.subjectType — опція { id, caption } → id. Заголовок userId — контракт бекенду. */
export const fetchSubjects = (filters, userId) =>
  apiFetch('/api/subject', {
    params: serializeParams({ ...filters, subjectType: filters?.subjectType?.id }),
    headers: { userId },
  })

export const fetchSubject = (id, userId) => apiFetch(`/api/subject/${id}`, { headers: { userId } })
