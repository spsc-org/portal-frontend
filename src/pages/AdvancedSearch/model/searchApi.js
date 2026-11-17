import { apiFetch } from '../../../lib/api.js'
import { downloadFile } from '../../../lib/utils.js'

/** Розширений пошук по консолідованих даних (/api/consolidated-data/*). */
export const SEARCH_KEYS = {
  options: ['searchOptions'],
  search: (filters) => ['consolidated-search', filters],
  basket: (items) => ['basketData', items],
}

/** Довідники пошуку (методи, датасети, групи, типи, стани). Помилка → порожні списки, як в Inertia-версії. */
export async function fetchSearchOptions() {
  try {
    const data = (await apiFetch('/api/consolidated-data/options'))?.data || {}
    return {
      searchMethods: data.search_methods || [],
      datasets: data.datasets || [],
      groups: data.groups || [],
      types: data.types || [],
      item_states: data.item_states || [],
    }
  } catch {
    return { searchMethods: [], datasets: [], groups: [], types: [], item_states: [] }
  }
}

export const searchOptionsQuery = { queryKey: SEARCH_KEYS.options, queryFn: fetchSearchOptions, staleTime: Infinity }

// Опції бувають { id, caption } або { value, label } — беремо що є.
const ids = (options = [], keepZero = false) =>
  options
    .filter((o) => o && (keepZero ? o.id !== undefined || o.value !== undefined : o.id || o.value))
    .map((o) => (keepZero ? (o.id !== undefined ? o.id : o.value) : o.id || o.value))

export function fetchSearchData(filters, userId) {
  const { search, groups = [], searchMethods = [], types = [], item_states = [], page, limit, sort = 'id', direction = 'desc' } = filters
  return apiFetch('/api/consolidated-data/search', {
    params: {
      q: search,
      limit,
      sort,
      direction,
      page,
      format: 'true',
      search_methods: JSON.stringify(ids(searchMethods)),
      // Групи — рядкові id ('nsdc', 'ofac', 'ds_14', …), бекенд розкриває їх у датасети.
      groups: JSON.stringify(ids(groups, true)),
      types: JSON.stringify(ids(types)),
      item_states: JSON.stringify(ids(item_states)),
    },
    headers: { userId },
  })
}

const toRequestItems = (items) => items.map(({ datasetId, id }) => ({ datasetId, id }))

export const fetchBasketRecords = async (items) =>
  (await apiFetch('/api/consolidated-data/by-ids', { method: 'POST', body: { items: toRequestItems(items) } }))?.data || []

export async function exportBasket(items) {
  const response = await apiFetch('/api/consolidated-data/export-basket', {
    method: 'POST',
    body: { items: toRequestItems(items) },
    responseType: 'blob',
    raw: true,
  })
  downloadFile(response.data, `basket_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
