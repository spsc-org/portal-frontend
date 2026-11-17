import { apiFetch } from '../../lib/api.js'
import { serializeParams } from '../../lib/utils.js'

/**
 * Документи (накази/переліки), /api/document. Заголовок `userId` — контракт
 * бекенду (DocumentController читає його поряд із сесією).
 */
export const DOCUMENT_KEYS = {
  all: ['documents'],
  list: (filters) => ['documents', filters],
  detail: (id) => ['document', id],
}

/** filters.typeId/unitId/performerId — масиви опцій { value } → значення. */
export function fetchDocuments(filters, userId) {
  const params = {
    ...filters,
    typeId: (filters.typeId ?? []).map((item) => item.value),
    unitId: (filters.unitId ?? []).map((item) => item.value),
    performerId: (filters.performerId ?? []).map((item) => item.value),
  }
  return apiFetch('/api/document', { params: serializeParams(params), headers: { userId } })
}

export const fetchDocument = (id, userId) =>
  apiFetch(`/api/document/${id}`, { headers: { userId } }).then((payload) => payload?.data ?? null)

export const createDocument = (body, userId) => apiFetch('/api/document', { method: 'POST', body, headers: { userId } })

export const updateDocument = (id, body, userId) =>
  apiFetch(`/api/document/${id}`, { method: 'PATCH', body, headers: { userId } })

/** Підстановка словників у рядки таблиці (як showDocuments в Inertia-версії). */
export function decorateDocuments(rows = [], { types = [], units = [], users = [] } = {}) {
  if (!rows?.length) return rows
  return rows.map((row) => ({
    ...row,
    typeId: types.find((item) => item.id === row.typeId),
    unitId: units.find((item) => item.id === row.unitId)?.caption,
    createdUserId: users.find((item) => item.id === row.createdUserId)?.name,
    updatedUserId: users.find((item) => item.id === row.updatedUserId)?.name,
    performerId: users.find((item) => item.id === row.performerId)?.name,
  }))
}

/**
 * Перенесення фільтра "Документ" у налаштування legacy-сторінки /project
 * (localStorage `project-settings`, той самий формат, що читає project.js).
 */
export function openProjectsForDocument(regNum) {
  const settingsKey = 'project-settings'
  let settings
  try {
    settings = JSON.parse(localStorage.getItem(settingsKey)) || { filters: {}, build: 1.3 }
  } catch {
    settings = { filters: {}, build: 1.3 }
  }
  settings.filters ??= {}
  settings.filters.fDocument ??= {
    type: 'text',
    width: 'w-[150px]',
    caption: 'Документ',
    vocName: null,
    val: '',
    enabled: true,
  }
  settings.filters.fDocument.val = `${regNum || ''}`.trim()
  localStorage.setItem(settingsKey, JSON.stringify(settings))
  window.location.href = '/project'
}
