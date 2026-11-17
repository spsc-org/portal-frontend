import { keepPreviousData } from '@tanstack/react-query'
import { format } from 'date-fns'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import { DOCUMENT_KEYS, decorateDocuments, fetchDocument, fetchDocuments } from '../../../entities/document/documentApi.js'

export const INITIAL_FILTERS = {
  limit: 50,
  page: 0,
  caption: '',
  regNum: '',
  listItem: '',
  typeId: [],
  unitId: [],
  performerId: [],
  path: '',
  start_date: '',
  end_date: '',
  from: undefined,
  to: undefined,
}

/** /document: реєстр документів (фільтри/сортування з persist) + модалки. */
export class DocumentListViewModel {
  selectedId = null
  isDetailsOpen = false
  isEditOpen = false
  isCreateOpen = false

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    // Той самий ключ localStorage, що й у Inertia-версії (`${location.pathname}-filters`).
    this.table = new TableState({
      storageKey: '/document',
      initialFilters: INITIAL_FILTERS,
      signal: scope.signal,
      dirField: 'direction',
    })
    this.optionsQuery = scope.query(pageOptionsQuery('document'))
    this.listQuery = scope.query({
      queryKey: () => DOCUMENT_KEYS.list(this.table.snapshot),
      queryFn: ({ queryKey }) => fetchDocuments(queryKey[1], this.stores.session.userId),
      placeholderData: keepPreviousData,
    })
  }

  /** Insert — нова форма (лише коли не відкрито інших модалок і є право). */
  mount() {
    const onKeyUp = (event) => {
      if (event.key === 'Insert' && this.canCreate && !this.isEditOpen && !this.isDetailsOpen) {
        this.selectedId = null
        this.openCreate()
      }
    }
    window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }

  // ---- словники/права ----
  get options() {
    return this.optionsQuery.data ?? {}
  }
  get dictionaries() {
    const { types = [], units = [], users = [] } = this.options
    return { types, units, users }
  }
  get permissions() {
    return this.stores.session.pagePermissions.document ?? {}
  }
  get canCreate() {
    return Boolean(this.permissions.create)
  }
  get canUpdate() {
    return Boolean(this.permissions.update)
  }
  get canDelete() {
    return Boolean(this.permissions.delete)
  }

  // ---- список ----
  get filters() {
    return this.table.filters
  }
  get isFetching() {
    return this.listQuery.isFetching
  }
  get documents() {
    const data = this.listQuery.data
    return data ? { ...data, data: decorateDocuments(data.data, this.dictionaries) } : undefined
  }
  get pagination() {
    return {
      onLimitChange: this.table.setLimit,
      onPageChange: this.table.setPageFromPaginator,
      currentPage: this.table.page,
      pageSize: this.documents?.limit,
      totalCount: this.documents?.total,
    }
  }

  get hasActiveFilters() {
    const { path, caption, typeId, unitId, from, to, regNum, listItem } = this.filters
    return Boolean(
      caption?.trim() || regNum?.trim() || listItem?.trim() || path?.trim() ||
        typeId?.length || unitId?.length || from || to,
    )
  }

  /** Мультиселект (масив опцій) → фільтр з поверненням на першу сторінку. */
  changeOptions(key) {
    return (selected) => this.table.setFilter(key, selected)
  }

  changeDate(range) {
    if (range?.from || range?.to) {
      const from = format(range.from, 'yyyy-MM-dd') || ''
      const to = format(range.to, 'yyyy-MM-dd') || ''
      this.table.patchFilters({ from, to }, { resetPage: false })
    } else {
      this.table.patchFilters({ from: undefined, to: undefined }, { resetPage: false })
    }
  }

  clearFilters() {
    this.table.reset()
  }

  // ---- модалки ----
  select(id) {
    this.selectedId = id
  }
  openDetails(id) {
    this.isDetailsOpen = !this.isDetailsOpen
    this.selectedId = id
  }
  closeDetails() {
    this.selectedId = null
    this.isDetailsOpen = false
  }
  openEdit(id) {
    this.isEditOpen = true
    this.selectedId = id
  }
  closeEdit() {
    this.selectedId = null
    this.isEditOpen = false
  }
  openCreate() {
    this.isCreateOpen = true
  }
  closeCreate() {
    this.isCreateOpen = false
  }
}

/** Модалка "Детальна інформація" документа. */
export class DocumentDetailsViewModel {
  constructor({ scope, stores, documentId }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)
    this.query = scope.query({
      queryKey: DOCUMENT_KEYS.detail(documentId),
      queryFn: () => fetchDocument(documentId, stores.session.userId),
    })
  }

  get document() {
    return this.query.data ?? null
  }
}
