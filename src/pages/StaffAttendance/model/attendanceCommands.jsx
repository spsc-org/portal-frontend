import toast from 'react-hot-toast'
import CustomToast from '../../../components/CustomToast.jsx'
import { QUERY_KEYS } from '../constants/attendanceConfig.js'
import {
  addDocument,
  deleteAbsence,
  deleteDocument,
  fetchAbsence,
  fetchStatistics,
  fetchSummary,
  saveAbsence,
  updateDocument,
  updateUserZp,
} from './attendanceApi.js'

export const ATTENDANCE_KEYS = {
  calendar: [QUERY_KEYS.CALENDAR],
  statistics: [QUERY_KEYS.STATISTICS],
  summary: [QUERY_KEYS.SUMMARY],
  absence: (id) => [QUERY_KEYS.ABSENCE, id],
}

export const attendanceQueries = {
  statistics: (date) => ({ queryKey: [QUERY_KEYS.STATISTICS, date], queryFn: () => fetchStatistics(date), staleTime: 0 }),
  summary: (filters) => ({ queryKey: [QUERY_KEYS.SUMMARY, filters], queryFn: () => fetchSummary(filters), staleTime: 0 }),
  absence: (id) => ({ queryKey: ATTENDANCE_KEYS.absence(id), queryFn: () => fetchAbsence(id), staleTime: 60000 }),
}

/** Помилка як у Inertia-версії — CustomToast із заголовком. */
export function errorToast(title, error, fallback) {
  const message = error?.payload?.message || fallback
  toast.custom((t) => <CustomToast t={t} title={title} message={message} />)
}
export const validationToast = (message) => toast.custom((t) => <CustomToast t={t} title="Помилка" message={message} />)

const calendar = () => [ATTENDANCE_KEYS.calendar]

// error: false — тост помилки показує ViewModel (CustomToast / власний текст).
export const ATTENDANCE_COMMANDS = {
  saveAbsence: {
    mutationFn: saveAbsence,
    invalidate: calendar,
    success: (_, vars) => (vars.id ? 'Заявку успішно оновлено' : 'Заявку успішно створено'),
    error: false,
  },
  deleteAbsence: { mutationFn: deleteAbsence, invalidate: calendar, success: 'Заявку видалено', error: 'Не вдалося видалити заявку' },
  updateUserZp: {
    mutationFn: updateUserZp,
    invalidate: () => [ATTENDANCE_KEYS.calendar, ATTENDANCE_KEYS.statistics],
    error: false,
  },
  addDocument: { mutationFn: addDocument, invalidate: calendar, success: 'Документ додано', error: false },
  updateDocument: { mutationFn: updateDocument, invalidate: calendar, success: 'Документ оновлено', error: false },
  deleteDocument: { mutationFn: deleteDocument, invalidate: calendar, success: 'Документ видалено', error: false },
}
