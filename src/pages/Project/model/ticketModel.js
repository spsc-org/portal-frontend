/**
 * Тікети проєкту (порт legacy ticketManager): GET/POST/PATCH /api/ticket, тимчасове вкладення.
 * /api/ticket/* авторизує за заголовком userId (не сесією) — як legacy makeRequest.
 */
import axios from 'axios'
import { rootStore } from '../../../stores/RootStore.js'

const headers = () => ({ userId: rootStore.session.userId })

export async function fetchTicket(id) {
  const { data } = await axios.get(`/api/ticket/${id}`, { headers: headers() })
  if (!data?.success) throw new Error(data?.message || 'Не вдалося завантажити тікет')
  return data.data
}

/** Назва проєкту для шапки модалки (DTO: nameUk/nameRu/nameEn). */
export async function fetchProjectName(projectId) {
  const { data } = await axios.get(`/api/project/${projectId}/dto`, { headers: headers() })
  const dto = data?.data ?? {}
  return dto.nameUk || dto.nameRu || dto.nameEn || ''
}

/** Файл → тимчасове сховище; повертає { token, name } для поля attachment у POST/PATCH. */
export async function uploadTicketAttachment(file) {
  const body = new FormData()
  body.append('file', file)
  const { data } = await axios.post('/api/ticket/temp-attachment', body, { headers: { ...headers(), 'Content-Type': 'multipart/form-data' } })
  if (!data?.success) throw new Error(data?.message || 'Помилка завантаження файлу')
  return data.data
}

/** { ok, errors, message } — помилки валідації (422 {message, errors}) не кидаються. */
export async function saveTicket({ ticketId, projectId, text, attachment, removeAttachment }) {
  const payload = { projectId, text }
  if (ticketId) payload.remove_attachment = removeAttachment
  if (attachment) payload.attachment = attachment
  const response = await axios.request({
    url: ticketId ? `/api/ticket/${ticketId}` : '/api/ticket',
    method: ticketId ? 'PATCH' : 'POST',
    data: payload,
    headers: headers(),
    validateStatus: () => true,
  })
  const body = response.data ?? {}
  if (response.status < 300 && body.success !== false) return { ok: true }
  return { ok: false, errors: body.errors ?? {}, message: body.message || 'Невідома помилка' }
}

export const ticketAttachmentUrl = (ticketId) => `/api/ticket/${ticketId}/attachment`
