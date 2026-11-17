import { apiFetch } from '../../../lib/api.js'
import {
  assignResponsible,
  createResponsibleFunction,
  deleteResponsibleFunction,
  endResponsibleAssignment,
  fetchMyResponsibleAssignments,
  fetchResponsibleAssignments,
  fetchResponsibleFunctions,
  fetchResponsibleOptions,
  updateResponsibleAssignment,
  updateResponsibleFunction,
} from './responsibleApi.js'

export const STAFF_KEYS = {
  options: ['staff-options'],
  responsibleOptions: ['staff-responsible-options'],
  functions: ['staff-responsible-functions'],
  assignments: ['staff-responsible-assignments'],
  my: ['staff-responsible-my'],
  unassignedUsers: ['staff-responsible-unassigned-users'],
}

/**
 * Спільні довідники ВСЬОГО простору /staff (web-маршрут /staff/options через proxy):
 * absence_types, statuses, working_days, users, report_types.
 */
export const staffOptionsQuery = {
  queryKey: STAFF_KEYS.options,
  queryFn: () => apiFetch('/staff/options'),
  staleTime: Infinity,
}

export const responsibleQueries = {
  options: { queryKey: STAFF_KEYS.responsibleOptions, queryFn: fetchResponsibleOptions, staleTime: Infinity },
  functions: { queryKey: STAFF_KEYS.functions, queryFn: fetchResponsibleFunctions },
  assignments: { queryKey: STAFF_KEYS.assignments, queryFn: fetchResponsibleAssignments },
  my: { queryKey: STAFF_KEYS.my, queryFn: fetchMyResponsibleAssignments },
}

// Будь-яка зміна функцій/призначень зачіпає всі списки реєстру.
const allResponsible = () => [STAFF_KEYS.functions, STAFF_KEYS.assignments, STAFF_KEYS.my, STAFF_KEYS.unassignedUsers]

export const RESPONSIBLE_COMMANDS = {
  createFunction: { mutationFn: createResponsibleFunction, invalidate: allResponsible, success: 'Функцію створено', error: 'Не вдалося створити функцію' },
  updateFunction: {
    mutationFn: ({ functionId, ...data }) => updateResponsibleFunction(functionId, data),
    invalidate: allResponsible,
    success: 'Функцію збережено',
    error: 'Не вдалося зберегти функцію',
  },
  deleteFunction: { mutationFn: deleteResponsibleFunction, invalidate: allResponsible, success: 'Функцію видалено', error: 'Не вдалося видалити функцію' },
  assign: { mutationFn: assignResponsible, invalidate: allResponsible, success: 'Відповідального призначено', error: 'Не вдалося призначити відповідального' },
  endAssignment: {
    mutationFn: ({ assignmentId, endedAt }) => endResponsibleAssignment(assignmentId, endedAt),
    invalidate: allResponsible,
    success: 'Призначення скасовано',
    error: 'Не вдалося скасувати призначення',
  },
  updateAssignment: {
    mutationFn: ({ assignmentId, ...data }) => updateResponsibleAssignment(assignmentId, data),
    invalidate: allResponsible,
    success: 'Призначення збережено',
    error: 'Не вдалося зберегти призначення',
  },
}
