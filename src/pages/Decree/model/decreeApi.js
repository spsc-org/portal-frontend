import { apiFetch } from '../../../lib/api.js'
import { BOOLEANS, SANC_DECREE_TYPES, serializeParams } from '../../../lib/utils.js'

/** Укази, /api/decree. Заголовок `userId` — контракт бекенду. */
export const DECREE_KEYS = {
  all: ['decree'],
  list: (filters) => ['decree', 'list', filters],
  detail: (id) => ['decree', id],
  edit: (id) => ['decree-update', id],
}

/** filters.typeId/isActive — опції { value, label }. */
export function fetchDecrees(filters, userId) {
  const params = {
    ...filters,
    typeId: filters.typeId?.value ? filters.typeId.value : undefined,
    isActive: filters.isActive?.value ? parseInt(filters.isActive.value, 10) : undefined,
  }
  return apiFetch('/api/decree', { params: serializeParams(params), headers: { userId } })
}

/** @returns {{ data: object|null, files: object[] }} */
export const fetchDecree = (id, userId) => apiFetch(`/api/decree/${id}`, { headers: { userId } })

export const createDecree = (formData, userId) =>
  apiFetch('/api/decree/create', { method: 'POST', body: formData, headers: { userId } })

export const updateDecree = (id, formData, userId) =>
  apiFetch(`/api/decree/${id}/update`, { method: 'POST', body: formData, headers: { userId } })

export const deleteDecree = (id, userId) => apiFetch(`/api/decree/${id}`, { method: 'DELETE', headers: { userId } })

export const deleteDecreeFile = ({ id, fileId }, userId) =>
  apiFetch(`/api/decree/${id}/delete`, { method: 'DELETE', params: { fileId }, headers: { userId } })

// file_type: 1 — сам указ, 2 — додатки.
export const decreeMainFile = (files = []) => files.find((file) => file?.file_type === 1) || null
export const decreeAttachments = (files = []) => files.filter((file) => file?.file_type === 2)

export const decreeTypeLabel = (typeId) => SANC_DECREE_TYPES.find((item) => item.value === typeId)?.label
export const booleanLabel = (value) => BOOLEANS.find((item) => item.value === value)?.label

/** multipart-тіло указу: опції select → value, додатки — лише нові File. */
export function buildDecreeFormData({ form, decreeFile, attachments, includeForm = true }) {
  const formData = new FormData()
  if (includeForm) {
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'isActive' || key === 'typeId') formData.append(key, value?.value || '')
      else formData.append(key, value || '')
    })
  }
  if (decreeFile instanceof File) formData.append('decreeFile', decreeFile)
  attachments
    .filter((attachment) => attachment?.file instanceof File)
    .forEach((attachment, index) => formData.append(`attachments[${index}]`, attachment.file))
  return formData
}
