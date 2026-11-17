import { keepPreviousData } from '@tanstack/react-query'
import { format } from 'date-fns'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import {
  AUDIT_ENTITIES,
  AUDIT_KEYS,
  fetchAuditOptions,
  fetchAuditPage,
  fetchAuditRecord,
} from '../model/auditApi.js'

const INITIAL_FILTERS = {
  entityId: '',
  userId: [],
  action: '',
  from: '',
  to: '',
  page: 0,
  limit: 50,
  sort: 'createdAt',
  dir: 'desc',
}

/** Таблиця журналу однієї сутності (вкладка). Запит — лише поки вкладка активна. */
export class AuditTableViewModel {
  selectedId = null

  constructor({ scope, entity, parent }) {
    this.scope = scope
    this.entity = entity
    this.parent = parent
    makeViewModel(this, { entity: false, parent: false })

    // Ключ сумісний з Inertia-версією (`${location.pathname}-${entity}`).
    this.table = new TableState({
      storageKey: `/audit-${entity}`,
      initialFilters: INITIAL_FILTERS,
      signal: scope.signal,
    })

    this.listQuery = scope.query({
      queryKey: () => AUDIT_KEYS.list(entity, this.table.snapshot),
      queryFn: ({ queryKey }) => fetchAuditPage(entity, queryKey[2]),
      placeholderData: keepPreviousData,
      options: () => ({ enabled: this.parent.tab === entity }),
    })

    this.detailQuery = scope.query({
      queryKey: () => AUDIT_KEYS.detail(entity, this.selectedId),
      queryFn: ({ queryKey }) => fetchAuditRecord(entity, queryKey[2]),
      enabled: ({ queryKey }) => queryKey[2] != null,
    })
  }

  // ---- таблиця ------------------------------------------------------------

  get rows() {
    return this.listQuery.data?.data ?? []
  }

  get isFetching() {
    return this.listQuery.isFetching
  }

  get pagination() {
    const meta = this.listQuery.data?.meta
    return {
      currentPage: (meta?.page ?? this.table.page + 1) - 1,
      pageSize: meta?.limit ?? this.table.limit,
      totalCount: meta?.total ?? 0,
      onPageChange: this.table.setPageFromPaginator,
      onLimitChange: this.table.setLimit,
    }
  }

  // ---- фільтри ------------------------------------------------------------

  get actionOptions() {
    return (this.parent.actionsFor(this.entity) ?? []).map((action) => ({ value: action, label: action }))
  }

  get selectedActionOption() {
    return this.actionOptions.find((option) => option.value === this.table.filters.action) ?? null
  }

  setUsers(selected) {
    this.table.setFilter('userId', selected || [])
  }

  setAction(selected) {
    this.table.setFilter('action', selected?.value ?? '')
  }

  setDateRange(range) {
    this.table.patchFilters({
      from: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
      to: range?.to ? format(range.to, 'yyyy-MM-dd') : '',
    })
  }

  // ---- деталі -------------------------------------------------------------

  openDetail(id) {
    this.selectedId = id
  }

  closeDetail() {
    this.selectedId = null
  }

  get detail() {
    return this.detailQuery.data ?? null
  }

  get diff() {
    return this.detail?.diff ?? { added: {}, changed: {}, removed: {} }
  }

  get hasChanges() {
    const { added, changed, removed } = this.diff
    return Object.keys(added).length + Object.keys(changed).length + Object.keys(removed).length > 0
  }

  userName(id) {
    return this.parent.userLabel(id)
  }
}

/** /audit: вкладки сутностей (синхронізуються з ?tab=), спільні опції (користувачі, дії). */
export class AuditViewModel {
  tab

  constructor({ scope, initialTab }) {
    this.scope = scope
    this.tab = AUDIT_ENTITIES.some((t) => t.value === initialTab) ? initialTab : AUDIT_ENTITIES[0].value
    makeViewModel(this)

    this.optionsQuery = scope.query({
      queryKey: AUDIT_KEYS.options,
      queryFn: fetchAuditOptions,
      staleTime: 5 * 60 * 1000,
    })

    this.tables = Object.fromEntries(
      AUDIT_ENTITIES.map(({ value }) => [value, new AuditTableViewModel({ scope, entity: value, parent: this })]),
    )
  }

  get tabs() {
    return AUDIT_ENTITIES
  }

  /** [{ value: id, label: name }] — формат AdvancedSelect. */
  get userOptions() {
    return (this.optionsQuery.data?.users ?? []).map((user) => ({ value: user.id, label: user.name }))
  }

  actionsFor(entity) {
    return this.optionsQuery.data?.actions?.[entity] ?? []
  }

  userLabel(id) {
    const user = this.userOptions.find((option) => option.value === id)
    return user ? user.label : id ? `#${id}` : '—'
  }

  setTab(value) {
    this.tab = value
  }
}
