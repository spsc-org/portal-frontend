import { apiFetch } from '../../lib/api.js'

/** Створення задачі-звернення (JSON). */
export const createIssue = (payload) => apiFetch('/api/task/issue/json', { method: 'POST', body: payload })

/** Вкладення до щойно створеної задачі. */
export function uploadIssueAttachments(taskId, files) {
  const formData = new FormData()
  files.forEach((file, index) => formData.append(`attachments[${index}]`, file))

  return apiFetch(`/api/task/issue/${taskId}/attach`, { method: 'POST', body: formData })
}
