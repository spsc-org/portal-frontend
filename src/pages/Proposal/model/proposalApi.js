import { apiFetch } from '../../../lib/api.js'
import { serializeParams } from '../../../lib/utils.js'

/** Подання (/api/proposal/new/*) і дії над пов'язаними проєктами. */
export const PROPOSAL_KEYS = {
  all: ['proposal'],
  list: (filters) => ['proposal', filters],
  detail: (id) => ['proposal-update', id],
  show: (id) => ['proposal-show', id],
  linkedProjects: (id) => ['proposal-show-lined-projects', id],
  linkedProjectsMinify: (id) => ['proposal-show-lined-projects-minify', id],
}

const h = (userId) => ({ userId })
const values = (options) => options?.map((option) => option.value)

export function fetchProposals(filters, userId) {
  const params = {
    ...filters,
    stateId: values(filters?.stateId),
    issuerId: values(filters?.issuerId),
    createdUserId: values(filters?.createdUserId),
    decreeId: values(filters?.decreeId),
    hideNonHistorical: filters?.hideNonHistorical?.value ? parseInt(filters.hideNonHistorical.value, 10) : undefined,
  }
  return apiFetch('/api/proposal/new/list', { params: serializeParams(params), headers: h(userId) })
}

export const fetchProposal = (id, userId) => apiFetch(`/api/proposal/new/${id}`, { headers: h(userId) })
export const fetchLinkedProjects = async (id, userId) =>
  (await apiFetch(`/api/proposal/new/${id}/linked-projects`, { headers: h(userId) }))?.data

export const createProposal = (body, userId) =>
  apiFetch('/api/proposal/new/create', { method: 'POST', body, headers: h(userId) })
export const updateProposal = (id, body, userId) =>
  apiFetch(`/api/proposal/new/${id}/update`, { method: 'PATCH', body, headers: h(userId) })
export const deleteProposal = (id, userId) =>
  apiFetch(`/api/proposal/new/${id}`, { method: 'DELETE', headers: h(userId) })
export const restoreProposal = (id, userId) =>
  apiFetch(`/api/proposal/new/${id}/restore`, { method: 'PATCH', headers: h(userId) })
export const revertProposalState = (id, stateId, userId) =>
  apiFetch(`/api/proposal/new/${id}/revert-state`, { method: 'PATCH', body: { stateId }, headers: h(userId) })
export const completeProposal = (id, body, isEdit, userId) =>
  apiFetch(`/api/proposal/new/${id}/complete`, { method: isEdit ? 'PATCH' : 'POST', body, headers: h(userId) })
export const updateProposalOrder = (id, order, userId) =>
  apiFetch(`/api/proposal/new/${id}/updateOrder`, { method: 'POST', body: order, headers: h(userId) })

export const bulkAttachDecree = (body, userId) =>
  apiFetch('/api/project/bulk-attach-decree', { method: 'POST', body, headers: h(userId) })

export const generateDossiers = (id, body, userId) =>
  apiFetch(`/api/proposal/${id}/generate-dossiers`, { method: 'POST', body, headers: h(userId) })

export const exportLinkedProjects = (id, params, userId) =>
  apiFetch(`/api/proposal/${id}/export`, {
    params,
    headers: { ...h(userId), 'Cache-Control': 'no-cache', Pragma: 'no-cache', Expires: '0' },
    responseType: 'blob',
    raw: true,
  })

/** Ім'я файлу експорту: filename*=UTF-8'' або filename="…" (як в Inertia-версії). */
export function exportFilename(contentDisposition = '') {
  const utf8 = /filename\*=UTF-8''([\w%\-.]+)(?:; ?|$)/i
  if (utf8.test(contentDisposition)) return decodeURIComponent(utf8.exec(contentDisposition)[1])
  const start = contentDisposition.toLowerCase().indexOf('filename=')
  if (start < 0) return ''
  const matches = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i.exec(contentDisposition.slice(start))
  return matches?.[2] ?? ''
}
