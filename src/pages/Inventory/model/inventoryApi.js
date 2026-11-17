import { apiFetch } from '../../../lib/api.js'

/** Інвентар (/api/inventory*) і вузли-комплекти (/api/inventory-nodes*). */

export const INVENTORY_KEYS = {
  options: ['dictionary', 'inventory/options'],
  all: ['inventories'],
  list: (filters) => ['inventories', filters],
  edit: (id) => ['inventory-edit', id],
  details: (id) => ['inventory-deitals', id],
  audit: (id, page) => ['inventory-audit', id, page],
  nodes: (search) => ['inventory-nodes', search],
  nodesAll: ['inventory-nodes'],
  node: (id) => ['inventory-node', id],
  addToNode: (filters) => ['inventory-add-to-node', filters],
}

const h = (userId) => ({ userId })

/** Словники (location — об'єкт → масив, як у Inertia-версії сторінки інвентарю). */
export async function fetchInventoryOptions() {
  const data = (await apiFetch('/api/inventory/options'))?.data ?? {}
  const { location, ...rest } = data
  return { location: Object.values(location ?? {}), ...rest }
}

const values = (options) => options?.map((option) => option.value)

export function fetchInventories(filters, userId) {
  const { page, limit, sort = 'id', direction = 'desc', hideDeleted = false, hideNonInventory = false, from, to } = filters
  return apiFetch('/api/inventory', {
    params: {
      page,
      limit,
      sort,
      hideDeleted,
      hideNonInventory,
      direction,
      from,
      to,
      filters: JSON.stringify({
        fBaileeUser: values(filters.fBaileeUser),
        fLocation: values(filters.fLocation),
        fResponsibleUser: values(filters.fResponsibleUser),
        fText: filters.fText,
        fType: values(filters.fType),
        fNode: values(filters.fNode),
      }),
    },
    headers: h(userId),
  })
}

export const fetchInventory = (id, userId) => apiFetch(`/api/inventory/${id}`, { headers: h(userId) })
export const createInventory = (body, userId) => apiFetch('/api/inventory', { method: 'POST', body, headers: h(userId) })
export const updateInventory = (id, body, userId) =>
  apiFetch(`/api/inventory/${id}`, { method: 'PATCH', body, headers: h(userId) })
export const cloneInventory = (sourceId, body, userId) =>
  apiFetch(`/api/inventory/${sourceId}/clone`, { method: 'POST', body, headers: h(userId) })
export const deleteInventory = (id, userId) => apiFetch(`/api/inventory/${id}`, { method: 'DELETE', headers: h(userId) })
export const restoreInventory = (id, userId) =>
  apiFetch(`/api/inventory/${id}/restore`, { method: 'PATCH', headers: h(userId) })

export const fetchInventoryAudit = (id, page, userId) =>
  apiFetch(`/api/inventory/${id}/audit`, { params: { page, limit: 50 }, headers: h(userId) })

export function attachInventoryFiles(id, attachments = [], userId) {
  const formData = new FormData()
  attachments
    .filter((attachment) => attachment?.file instanceof File)
    .forEach((attachment, index) => formData.append(`attachments[${index}]`, attachment.file))
  return apiFetch(`/api/inventory/${id}/attach-file`, { method: 'POST', body: formData, headers: h(userId) })
}
export const deleteInventoryAttachment = (attachment, userId) =>
  apiFetch(`/api/inventory/delete-file/${attachment.id}`, { method: 'DELETE', headers: h(userId) })

// Коментарі до рядка
export const addInventoryComment = ({ inventoryId, comment }, userId) =>
  apiFetch(`/api/inventory/${inventoryId}/comments`, { method: 'POST', body: { comment }, headers: h(userId) })
export const editInventoryComment = ({ inventoryId, commentId, comment }, userId) =>
  apiFetch(`/api/inventory/${inventoryId}/comments/${commentId}`, { method: 'PATCH', body: { comment }, headers: h(userId) })
export const deleteInventoryComment = ({ inventoryId, commentId }, userId) =>
  apiFetch(`/api/inventory/${inventoryId}/comments/${commentId}`, { method: 'DELETE', headers: h(userId) })

/** Друк/експорт — web-маршрут бекенду /inventory/export (через proxy, нова вкладка). */
export const inventoryExportUrl = (query, columns, hideNonInventory) =>
  `/inventory/export?filters=${JSON.stringify(query)}&columns=${JSON.stringify(columns)}&hideNonInventory=${hideNonInventory}`

// ---- вузли ----
export const fetchNodes = (search, userId) =>
  apiFetch('/api/inventory-nodes', { params: { limit: 500, search }, headers: h(userId) })
export const fetchNode = (id, userId) => apiFetch(`/api/inventory-nodes/${id}`, { headers: h(userId) })
export const createNode = (data, userId) => apiFetch('/api/inventory-nodes', { method: 'POST', body: data, headers: h(userId) })
export const updateNode = ({ id, data }, userId) =>
  apiFetch(`/api/inventory-nodes/${id}`, { method: 'PUT', body: data, headers: h(userId) })
export const deleteNode = (id, userId) => apiFetch(`/api/inventory-nodes/${id}`, { method: 'DELETE', headers: h(userId) })
export const addNodeItem = ({ nodeId, inventoryId }, userId) =>
  apiFetch(`/api/inventory-nodes/${nodeId}/items`, { method: 'POST', body: { inventory_id: inventoryId }, headers: h(userId) })
export const removeNodeItem = ({ nodeId, inventoryId }, userId) =>
  apiFetch(`/api/inventory-nodes/${nodeId}/items/${inventoryId}`, { method: 'DELETE', headers: h(userId) })

/** Інвентар для додавання у вузол (30 перших збігів, без видалених). */
export const fetchInventoryForNode = (itemFilters, userId) =>
  apiFetch('/api/inventory', {
    params: {
      filters: JSON.stringify({
        fText: itemFilters.search,
        fBaileeUser: values(itemFilters.user),
        fLocation: [],
        fResponsibleUser: [],
        fType: values(itemFilters.type),
      }),
      limit: 30,
      page: 0,
      hideDeleted: true,
      userId,
    },
    headers: h(userId),
  })
