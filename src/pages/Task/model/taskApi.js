import { apiFetch } from '../../../lib/api.js'
import { serializeParams } from '../../../lib/utils.js'

/** Задачі (/api/task/*). Заголовок `userId` — контракт бекенду. */

export const TASK_KEYS = {
  options: ['task-options'],
  all: ['tasks'],
  infinite: (params) => ['tasks', 'infinite', params],
  show: (id) => ['task-show', id],
  comments: (id) => ['task-comments', id],
  audit: (id, page) => ['task-audit', id, page],
  mergePreview: (id) => ['task-merge-preview', id],
  pickerVoc: ['project-picker-voc'],
  picker: (filters) => ['project-picker', filters],
}

const h = (userId) => ({ userId })

export const fetchTaskOptions = async (userId) => (await apiFetch('/api/task/options', { headers: h(userId) }))?.data

// Мультивибір панелі: масив опцій → масив id (порожній → фільтр не застосовується).
const toIdList = (options) => (options?.length ? options.map((option) => option.id) : undefined)

/** Фільтри панелі /task → query-параметри бекенду (спільне для списку й експорту). */
export const buildTaskFilterParams = (filters) => ({
  ...filters,
  page: undefined,
  statusId: toIdList(filters?.statusId),
  createdUserId: toIdList(filters?.createdUserId),
  assignedUserId: toIdList(filters?.assignedUserId),
  projectId: toIdList(filters?.projectId),
  priorityId: toIdList(filters?.priorityId),
  typeId: toIdList(filters?.typeId),
})

export const fetchTasksPage = (params, page, userId) =>
  apiFetch('/api/task', { params: serializeParams({ ...params, page }), headers: h(userId) })

/** Наступна сторінка — за фактично завантаженим, а не за meta.page. */
export const nextTasksPage = (lastPage, allPages) => {
  const meta = lastPage?.meta
  if (!meta) return undefined
  const loaded = allPages.reduce((sum, page) => sum + (page?.data?.length || 0), 0)
  return loaded < meta.total ? allPages.length : undefined
}

export const exportTasks = (filters, userId) =>
  apiFetch('/api/task/export', {
    params: serializeParams(buildTaskFilterParams(filters)),
    responseType: 'blob',
    raw: true,
    headers: h(userId),
  })

export const fetchTask = (id, userId) => apiFetch(`/api/task/${id}`, { headers: h(userId) })

export const deleteTask = ({ id, force }, userId) =>
  apiFetch(force ? `/api/task/${id}/force` : `/api/task/${id}`, { method: 'DELETE', headers: h(userId) })
export const restoreTask = (id, userId) => apiFetch(`/api/task/${id}/restore`, { method: 'POST', headers: h(userId) })
export const mergeTask = ({ baseId, donorId }, userId) =>
  apiFetch(`/api/task/${baseId}/merge`, { method: 'PATCH', body: { donorId }, headers: h(userId) })
export const toggleFavoriteTask = (id, userId) =>
  apiFetch(`/api/task/${id}/favorite`, { method: 'POST', headers: h(userId) })
export const changeTaskStatus = ({ id, statusId }, userId) =>
  apiFetch(`/api/task/${id}/status`, { method: 'PATCH', body: { statusId }, headers: h(userId) })

/** PATCH поля задачі: /api/task/{id}/{segment} з тілом { [bodyKey]: value }. */
export const patchTaskField = (id, segment, bodyKey, value, userId) =>
  apiFetch(`/api/task/${id}/${segment}`, { method: 'PATCH', body: { [bodyKey]: value }, headers: h(userId) })

export function attachTaskFiles(id, attachments = [], { isResult = false } = {}, userId) {
  const formData = new FormData()
  attachments
    .filter((attachment) => attachment?.file instanceof File)
    .forEach((attachment, index) => formData.append(`attachments[${index}]`, attachment.file))
  // isResult=1 — файли результату (TaskAttachmentService::attachFile)
  if (isResult) formData.append('isResult', '1')
  return apiFetch(`/api/task/${id}/attach-file`, { method: 'POST', body: formData, headers: h(userId) })
}
export const deleteTaskAttachment = (attachment, userId) =>
  apiFetch(`/api/task/delete-file/${attachment.id}`, { method: 'DELETE', headers: h(userId) })

// Чернетка (CreateTaskModal)
export const createTaskDraft = (typeId, userId) =>
  apiFetch('/api/task/draft', { method: 'POST', body: { typeId }, headers: h(userId) })
export const finalizeTaskDraft = (id, userId) =>
  apiFetch(`/api/task/${id}/finalize`, { method: 'PATCH', body: {}, headers: h(userId) })
export const discardTaskDraft = (id, userId) =>
  apiFetch(`/api/task/${id}/draft`, { method: 'DELETE', headers: h(userId) })

// Обговорення / аудит
export const fetchTaskComments = (id, userId) => apiFetch(`/api/task/${id}/comments`, { headers: h(userId) })
export const addTaskComment = (id, body, userId) =>
  apiFetch(`/api/task/${id}/comments`, { method: 'POST', body: { body }, headers: h(userId) })
export const fetchTaskAudit = (id, page, userId) =>
  apiFetch(`/api/task/${id}/audit`, { params: { page, limit: 50 }, headers: h(userId) })

// Набір проєктів задачі (пікер — той самий фільтр-движок, що й /project)
export const updateLinkedProjects = (id, projectIds, userId) =>
  apiFetch(`/api/task/${id}/projects`, { method: 'PATCH', body: { projectIds }, headers: h(userId) })
export const fetchProjectPickerVoc = async (userId) =>
  (await apiFetch('/api/project/options', { params: { only: 'subjectType,action,proposal' }, headers: h(userId) }))?.data
export const fetchProjectPicker = async (filters, userId) =>
  (
    await apiFetch('/api/project/picker', {
      params: {
        fText: filters.fText.trim() || undefined,
        fDocument: filters.fDocument.trim() || undefined,
        fType: filters.fType ? [filters.fType.id] : undefined,
        fAction: filters.fAction ? [filters.fAction.id] : undefined,
        fProposal: filters.fProposal ? [filters.fProposal.id] : undefined,
      },
      headers: h(userId),
    })
  )?.data
