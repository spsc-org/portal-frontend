/**
 * Model сторінки /project (список v2): запити й команди для VM.
 * HTTP — entities/project/api.js, entities/cart/api.js (axios, заголовок userId —
 * /api/project/* захищено ExtractUserPermissions, не сесією).
 */
import axios from 'axios'
import { downloadFile } from '../../../lib/utils.js'
import { filenameFromDisposition } from '../../../entities/file/fileApi.js'
import { rootStore } from '../../../stores/RootStore.js'
import { fetchProjectList, fetchProjectOptions, fetchProjectsByIds } from '../entities/project/api.js'
import {
  addDocument,
  addRestrictions,
  createTaskWithProjects,
  fetchBulkOperationsLog,
  fetchCartCollection,
  fetchTaskOptionsForCart,
  generateDossiers,
  linkProjectsToProposals,
  replaceReasoningText,
  rewriteRestriction25,
  rewriteRestrictions,
  rewriteTerm,
  setPerformer,
  setState,
  setValidator,
} from '../entities/cart/api.js'
import { projectKeys } from '../shared/lib/queryKeys.js'

const userId = () => rootStore.session.userId
const headers = () => ({ userId: userId() })

export const PROJECT_KEYS = {
  ...projectKeys,
  all: ['project-list'],
  voc: ['voc_project'],
  options: (only) => ['project-options', ...only.slice().sort()],
  cartCollection: (ids) => ['project-cart-collection', ...ids.slice().sort((a, b) => a - b)],
  cartLog: ['project-cart-bulk-log'],
  cartTaskOptions: ['project-cart-task-options'],
}

/**
 * Словники сторінки (той самий /api/voc_project, що вантажив legacy core.js:getVoc):
 * state, user, _term, action, subjectType, category*, proposal, decree, country…
 */
export async function fetchProjectVoc() {
  const { data } = await axios.get('/api/voc_project', { headers: headers() })
  if (!data?.user) throw new Error('Не вдалося завантажити словники проєктів')
  if (Array.isArray(data.country)) {
    data.country.sort((a, b) => (a.caption < b.caption ? 1 : -1))
    data.country.sort((a, b) => (a.order < b.order ? 1 : -1))
  }
  if (Array.isArray(data.restriction)) data.restriction.sort((a, b) => (a.order > b.order ? 1 : -1))
  return data
}

export const PROJECT_QUERIES = {
  voc: { queryKey: PROJECT_KEYS.voc, queryFn: fetchProjectVoc, staleTime: Infinity, retry: false },
  options: (only) => ({
    queryKey: PROJECT_KEYS.options(only),
    queryFn: () => fetchProjectOptions(only, userId()),
    staleTime: Infinity,
  }),
  list: (params) => ({ queryKey: PROJECT_KEYS.list(params), queryFn: () => fetchProjectList(params, userId()) }),
}

/** Свіжі рядки за id → підміна в закешованій сторінці (live-оновлення без перезапиту сторінки). */
export async function refreshListRows(queryClient, params, ids) {
  if (ids.length === 0) return
  const fresh = await fetchProjectsByIds(ids, userId())
  const byId = new Map(fresh.map((row) => [row.id, row]))
  queryClient.setQueryData(PROJECT_KEYS.list(params), (old) =>
    old ? { ...old, rows: old.rows.map((row) => byId.get(row.id) ?? row) } : old,
  )
}

const ok = (response) => {
  if (response?.data?.success === false) throw Object.assign(new Error(response.data.message || 'Невідома помилка'), { response })
  return response.data
}

/** Дії над рядком списку (замість legacy Page.confirmAndCopy/deleteItem, ticketManager). */
export const ROW_COMMANDS = {
  copyProject: {
    mutationFn: ({ id, options }) => axios.post(`/api/project/${id}/copy`, options, { headers: headers() }).then(ok),
    invalidate: () => [PROJECT_KEYS.all],
    success: 'Проєкт скопійовано',
    error: 'Не вдалося скопіювати проєкт',
  },
  deleteProject: {
    mutationFn: (id) => axios.delete(`/api/project/${id}`, { headers: headers() }).then(ok),
    invalidate: () => [PROJECT_KEYS.all],
    success: 'Проєкт видалено',
    error: 'Помилка при видаленні',
  },
  setTicketState: {
    mutationFn: ({ ticketId, stateId }) => axios.patch(`/api/ticket/${ticketId}/state`, { stateId }, { headers: headers() }).then(ok),
    invalidate: () => [PROJECT_KEYS.all],
    error: 'Не вдалося змінити стан тікета',
  },
  deleteTicket: {
    mutationFn: (ticketId) => axios.delete(`/api/ticket/${ticketId}`, { headers: headers() }).then(ok),
    invalidate: () => [PROJECT_KEYS.all],
    success: 'Тікет видалено',
    error: 'Не вдалося видалити тікет',
  },
}

/** Вкладення проєкту (blob) — як legacy TableManager.downloadAttachment. */
export async function downloadProjectAttachment(attachmentId, filename) {
  const response = await axios.get(`/api/project/attachment/${attachmentId}/download`, { headers: headers(), responseType: 'blob' })
  downloadFile(response.data, filenameFromDisposition(response.headers['content-disposition'], filename || 'attachment'))
}

// ---- кошик ----

export const CART_QUERIES = {
  collection: (ids) => ({ queryKey: PROJECT_KEYS.cartCollection(ids), queryFn: () => fetchCartCollection(ids, userId()) }),
  log: { queryKey: PROJECT_KEYS.cartLog, queryFn: () => fetchBulkOperationsLog(userId()) },
  taskOptions: { queryKey: PROJECT_KEYS.cartTaskOptions, queryFn: () => fetchTaskOptionsForCart(userId()), staleTime: Infinity },
}

/** Масова дія: variables — масив аргументів API-функції (як у legacy-формах). Помилку показує форма. */
const bulk = (fn) => ({ mutationFn: (variables) => fn(...variables), invalidate: () => [PROJECT_KEYS.cartLog], error: false })

export const CART_COMMANDS = {
  linkProjectsToProposals: bulk(linkProjectsToProposals),
  addRestrictions: bulk(addRestrictions),
  rewriteRestrictions: bulk(rewriteRestrictions),
  rewriteRestriction25: bulk(rewriteRestriction25),
  rewriteTerm: bulk(rewriteTerm),
  replaceReasoningText: bulk(replaceReasoningText),
  setPerformer: bulk(setPerformer),
  setValidator: bulk(setValidator),
  setState: bulk(setState),
  generateDossiers: bulk(generateDossiers),
  addDocument: bulk(addDocument),
  createTaskWithProjects: bulk(createTaskWithProjects),
}

export const cartErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback
