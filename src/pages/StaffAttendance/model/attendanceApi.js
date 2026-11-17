import { format } from 'date-fns'
import { apiFetch } from '../../../lib/api.js'
import { API_ENDPOINTS } from '../constants/attendanceConfig.js'

const ymd = (date) => format(date, 'yyyy-MM-dd')

/** Календар відсутностей за період + фільтри ({ types: [slug], users: [id], include_deleted }). */
export function fetchCalendar({ start, end, types, users, includeDeleted }) {
  const params = new URLSearchParams({ start_date: ymd(start), end_date: ymd(end) })
  types.forEach((t) => params.append('types[]', t))
  users.forEach((u) => params.append('users[]', u))
  if (includeDeleted) params.append('include_deleted', 'true')
  return apiFetch(`${API_ENDPOINTS.CALENDAR}?${params.toString()}`)
}

/** "Стройовка" на дату. */
export const fetchStatistics = (date) => apiFetch(`${API_ENDPOINTS.STATISTICS}?date=${date}`)

/** Зведена таблиця днів відсутності. */
export function summaryParams({ startDate, endDate, types, users, statuses }) {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
  types.forEach((t) => params.append('types[]', t))
  users.forEach((u) => params.append('users[]', u))
  statuses.forEach((s) => params.append('statuses[]', s))
  return params
}
export const fetchSummary = (filters) => apiFetch(`${API_ENDPOINTS.SUMMARY}?${summaryParams(filters).toString()}`)
/** Blade-сторінка друку (через proxy на бекенд). */
export const summaryPrintUrl = (filters) => `/staff/summary-print?${summaryParams(filters).toString()}`
export const VACATION_SCHEDULE_URL = '/staff/vacation-schedule'

export const fetchAbsence = (id) => apiFetch(`${API_ENDPOINTS.ABSENCE}/${id}`)

export const saveAbsence = ({ id, ...payload }) =>
  id
    ? apiFetch(`${API_ENDPOINTS.ABSENCE}/${id}`, { method: 'PATCH', body: { id, ...payload } })
    : apiFetch(API_ENDPOINTS.ABSENCE, { method: 'POST', body: payload })

export const deleteAbsence = (id) => apiFetch(`${API_ENDPOINTS.ABSENCE}/${id}`, { method: 'DELETE' })

export const updateUserZp = ({ userId, zpValue }) =>
  apiFetch(`${API_ENDPOINTS.USER_ZP}/${userId}/zp`, { method: 'PATCH', body: { zp: zpValue } })

export const addDocument = ({ absenceId, data }) =>
  apiFetch(`${API_ENDPOINTS.ABSENCE}/${absenceId}/documents`, { method: 'POST', body: data })
export const updateDocument = ({ docId, data }) =>
  apiFetch(`${API_ENDPOINTS.DOCUMENTS}/${docId}`, { method: 'PATCH', body: data })
export const deleteDocument = (docId) => apiFetch(`${API_ENDPOINTS.DOCUMENTS}/${docId}`, { method: 'DELETE' })
