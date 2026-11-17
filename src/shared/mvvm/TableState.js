import { makeAutoObservable, reaction, toJS } from 'mobx'

function readStored(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // не критично (приватний режим/квота)
  }
}

/**
 * Стан серверної таблиці: фільтри + пагінація (filters.page — 0-based,
 * filters.limit) + сортування react-table, з персистом у localStorage.
 * Композиція в VM (не наслідування):
 *
 *   this.table = new TableState({
 *     storageKey: `/audit-${entity}`,
 *     initialFilters: { q: '', page: 0, limit: 50, sort: 'createdAt', dir: 'desc' },
 *     signal: scope.signal,
 *   })
 *   this.listQuery = scope.query({
 *     queryKey: () => ['audit', entity, this.table.snapshot],
 *     queryFn: ({ queryKey }) => fetchAudit(entity, queryKey[2]),
 *   })
 *
 * Ключі localStorage — `${storageKey}-filters` / `${storageKey}-sorting`
 * (той самий формат, що й у Inertia-версії, тож збережені фільтри
 * користувачів підхоплюються). Сторінка (page) НЕ відновлюється.
 */
export class TableState {
  filters
  sorting = []

  constructor({
    storageKey,
    initialFilters,
    signal,
    sortField = 'sort',
    dirField = 'dir',
    persist = true,
    // (stored) => filters — міграція старого формату збережених фільтрів
    migrateStored = (stored) => stored,
  }) {
    this.storageKey = storageKey
    this.initialFilters = initialFilters
    this.sortField = sortField
    this.dirField = dirField

    const stored = persist ? readStored(`${storageKey}-filters`) : null
    // eslint-disable-next-line no-unused-vars -- сторінку свідомо не відновлюємо
    const { page: _page, ...storedFilters } = stored ? migrateStored(stored) : {}
    this.filters = { ...initialFilters, ...storedFilters }
    this.sorting = (persist && readStored(`${storageKey}-sorting`)) || []

    makeAutoObservable(
      this,
      { storageKey: false, initialFilters: false, sortField: false, dirField: false },
      { autoBind: true },
    )

    if (persist) {
      const stop = reaction(
        () => ({ filters: toJS(this.filters), sorting: toJS(this.sorting) }),
        ({ filters, sorting }) => {
          writeStored(`${storageKey}-filters`, filters)
          writeStored(`${storageKey}-sorting`, sorting)
        },
      )
      signal?.addEventListener('abort', stop, { once: true })
    }
  }

  /** Плоска (не observable) копія фільтрів — для queryKey/запиту. */
  get snapshot() {
    return toJS(this.filters)
  }

  /** Номер сторінки для пагінатора (0-based). */
  get page() {
    return this.filters.page ?? 0
  }

  get limit() {
    return this.filters.limit
  }

  setFilter(name, value) {
    this.filters = { ...this.filters, [name]: value, page: 0 }
  }

  patchFilters(patch, { resetPage = true } = {}) {
    this.filters = { ...this.filters, ...patch, ...(resetPage ? { page: 0 } : {}) }
  }

  /** Для SearchInput/Input: onChange({ target: { name, value } }). */
  handleInput({ target: { name, value } }) {
    this.setFilter(name, value)
  }

  setPage(page) {
    this.filters = { ...this.filters, page }
  }

  /** Пагінатор Table віддає 1-based номер. */
  setPageFromPaginator(oneBasedPage) {
    this.setPage(oneBasedPage - 1)
  }

  setLimit(limit) {
    this.filters = { ...this.filters, limit: Number(limit), page: 0 }
  }

  /** onSort з Table (updater react-table або готовий масив). */
  applySorting(updater) {
    const next = typeof updater === 'function' ? updater(toJS(this.sorting)) : updater
    this.sorting = next ?? []
    if (this.sorting.length > 0) {
      const [{ id, desc }] = this.sorting
      this.filters = { ...this.filters, [this.sortField]: id, [this.dirField]: desc ? 'desc' : 'asc' }
    }
  }

  /** Скинути фільтри до початкових (keep — поля, які лишаються, напр. limit). */
  reset(keep = ['limit']) {
    const kept = Object.fromEntries(keep.map((key) => [key, this.filters[key]]))
    this.filters = { ...this.initialFilters, ...kept }
  }
}
