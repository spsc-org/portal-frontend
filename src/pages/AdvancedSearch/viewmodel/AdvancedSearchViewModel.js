import { observable, reaction } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import { createCommand } from '../../../shared/mvvm/commands.js'
import { SEARCH_KEYS, exportBasket, fetchBasketRecords, fetchSearchData, searchOptionsQuery } from '../model/searchApi.js'

const BASKET_STORAGE_KEY = 'advancedSearchBasket'

const INITIAL_FILTERS = { search: '', searchMethods: [], groups: [], types: [], item_states: [], page: 0, limit: 50 }

function readBasket() {
  try {
    const stored = JSON.parse(localStorage.getItem(BASKET_STORAGE_KEY))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

/** "Вибрані" записи пошуку — { datasetId, id, addedAt }, у localStorage. */
export class SearchBasket {
  items = readBasket()

  constructor() {
    makeViewModel(this, { items: observable.ref })
  }

  persist() {
    try {
      localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(this.items))
    } catch {
      // сховище недоступне — кошик житиме до перезавантаження
    }
  }
  isInBasket(datasetId, id) {
    return this.items.some((item) => item.datasetId === datasetId && item.id === id)
  }
  toggleItem(record) {
    this.items = this.isInBasket(record.datasetId, record.id)
      ? this.items.filter((item) => !(item.datasetId === record.datasetId && item.id === record.id))
      : [...this.items, { datasetId: record.datasetId, id: record.id, addedAt: new Date().toISOString() }]
    this.persist()
  }
  clearBasket() {
    this.items = []
    this.persist()
  }
}

/** /search: пошук по консолідованих даних, деталі запису, кошик "вибраних". */
export class AdvancedSearchViewModel {
  detailsRecord = null
  isBasketOpen = false

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { detailsRecord: observable.ref })

    this.basket = new SearchBasket()
    this.table = new TableState({ storageKey: '/search', initialFilters: INITIAL_FILTERS, signal: scope.signal, dirField: 'direction' })
    this.optionsQuery = scope.query(searchOptionsQuery)
    this.searchQuery = scope.query({
      queryKey: () => SEARCH_KEYS.search(this.table.snapshot),
      queryFn: ({ queryKey }) => fetchSearchData(queryKey[1], this.stores.session.userId),
      placeholderData: keepPreviousData,
      options: () => ({ enabled: Boolean(this.filters.search) }),
    })

    // Метод "Basic" (id 1) — за замовчуванням, коли не вибрано жодного.
    const stop = reaction(
      () => this.searchOptions.searchMethods,
      () => {
        if (this.filters.searchMethods.length === 0 && this.basicMethod) {
          this.table.patchFilters({ searchMethods: [this.basicMethod] }, { resetPage: false })
        }
      },
      { fireImmediately: true },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  get filters() {
    return this.table.filters
  }
  get searchOptions() {
    return this.optionsQuery.data ?? {}
  }
  get basicMethod() {
    return this.searchOptions.searchMethods?.find((method) => method.id === 1)
  }
  get results() {
    return this.searchQuery.data
  }
  get rows() {
    return this.results?.data || []
  }
  get isFetching() {
    return this.searchQuery.isFetching
  }
  get pagination() {
    return {
      onLimitChange: this.table.setLimit,
      onPageChange: this.table.setPageFromPaginator,
      currentPage: this.results?.page || 0,
      pageSize: this.results?.limit || this.filters.limit,
      totalCount: this.results?.total || 0,
    }
  }
  get hasActiveFilters() {
    const { search, groups = [], searchMethods = [], types = [], item_states = [] } = this.filters
    return Boolean(
      search?.trim() || groups.length || types.length || item_states.length ||
        (searchMethods.length > 0 && searchMethods[0]?.id !== 1),
    )
  }

  datasetName(datasetId) {
    return this.searchOptions.datasets?.find((d) => d.id === datasetId)?.caption || `Dataset #${datasetId}`
  }

  changeOptions(key) {
    return (selected) => this.table.setFilter(key, selected || [])
  }
  changeSearch(event) {
    this.table.patchFilters({ search: event.target.value }, { resetPage: false })
  }
  clearFilters() {
    this.table.filters = {
      ...INITIAL_FILTERS,
      searchMethods: this.basicMethod ? [this.basicMethod] : [],
      limit: this.filters.limit,
    }
  }

  /** Рядок результату → запис для DetailsDialog (оригінальні поля + контекст датасету). */
  openDetailsFor(row) {
    const datasetId = row.original.datasetId
    this.detailsRecord = {
      ...row.original.original_data,
      dataset_id: datasetId,
      dataset_name: this.datasetName(datasetId),
      typeId: row.original.typeId,
      actions: row.original.actions || [],
    }
  }
  openDetails(record) {
    this.detailsRecord = record
  }
  closeDetails() {
    this.detailsRecord = null
  }
  openBasket() {
    this.isBasketOpen = true
  }
  closeBasket() {
    this.isBasketOpen = false
  }
}

/** Діалог кошика: повні записи за id + експорт у xlsx. */
export class BasketDialogViewModel {
  constructor({ scope, basket }) {
    this.scope = scope
    this.basket = basket
    makeViewModel(this, { basket: false })
    this.query = scope.query({
      queryKey: () => SEARCH_KEYS.basket(this.basket.items),
      queryFn: ({ queryKey }) => (queryKey[1].length ? fetchBasketRecords(queryKey[1]) : []),
      options: () => ({ enabled: this.basket.items.length > 0 }),
      staleTime: 5 * 60 * 1000,
    })
    this.exportCmd = createCommand(scope, { mutationFn: exportBasket, error: false })
  }

  get items() {
    return this.basket.items
  }
  get isLoading() {
    return this.query.isLoading
  }
  get isError() {
    return this.query.isError
  }
  get isExporting() {
    return this.exportCmd.isPending
  }

  /** Порядок і addedAt — з кошика, дані — з бекенду (видалені записи — заглушка). */
  get displayItems() {
    const records = this.query.data
    if (!records) return []
    const byKey = new Map(records.map((record) => [`${record.datasetId}-${record.id}`, record]))
    return this.items.map((item) => {
      const record = byKey.get(`${item.datasetId}-${item.id}`)
      return record
        ? { ...record, addedAt: item.addedAt, original: { ...record, datasetId: item.datasetId } }
        : { ...item, captions: 'Запис не знайдено або видалено', original: { datasetId: item.datasetId } }
    })
  }

  async export() {
    if (this.items.length === 0) return
    try {
      await this.exportCmd.run(this.items)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }
}
