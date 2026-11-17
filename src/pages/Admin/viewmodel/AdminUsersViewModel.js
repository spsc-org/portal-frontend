import { observable } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import {
  ADMIN_KEYS,
  deleteAdminUser,
  fetchAdminOptions,
  fetchAdminUsers,
  restoreAdminUser,
} from '../model/adminApi.js'

const INITIAL_FILTERS = { limit: 50, page: 0, q: '', unit: 'all', isResponsible: 'all', trashed: 'all' }
const isTriFilterActive = (value) => value !== 'all' && value !== null && value !== undefined && value !== ''

/** Спільні для сторінки й модалок дані: словники (options) і схема прав (Inertia prop `permissions`). */
export class AdminDataModel {
  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.optionsQuery = scope.query({
      queryKey: ADMIN_KEYS.options,
      queryFn: () => fetchAdminOptions(this.stores.session.userId),
      staleTime: Infinity,
    })
    this.schemaQuery = scope.query(pageOptionsQuery('admin-users'))
  }

  get userId() {
    return this.stores.session.userId
  }

  get unitOptions() {
    return this.optionsQuery.data?.units ?? []
  }

  get isResponsibleOptions() {
    return this.optionsQuery.data?.isResponsible ?? []
  }

  get trashedOptions() {
    return this.optionsQuery.data?.trashed ?? []
  }

  get ranks() {
    return this.optionsQuery.data?.ranks ?? []
  }

  /** { [page]: { [action]: allowedValues[] } } — PermissionService::schemaGroupedByPage(). */
  get permissionsSchema() {
    return this.schemaQuery.data?.permissions ?? {}
  }

  get moduleSchemaKeys() {
    return Object.keys(this.permissionsSchema)
  }

  can(action) {
    return Boolean(this.stores.session.scopeFor('admin-users', action))
  }
}

/** /admin-users: таблиця користувачів, фільтри, вибір рядків, модалки. */
export class AdminUsersViewModel {
  rowSelection = {}
  createOpen = false
  editId = null
  bulkOpen = false
  confirm = null // { kind: 'delete' | 'restore', id }

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { rowSelection: observable.ref, confirm: observable.ref })

    this.data = new AdminDataModel({ scope, stores })

    this.table = new TableState({
      storageKey: '/admin-users',
      initialFilters: INITIAL_FILTERS,
      signal: scope.signal,
      dirField: 'direction',
      // Міграція зі старих окремих name/email → єдине q.
      migrateStored: ({ name, email, ...rest }) => ({ ...rest, q: rest.q ?? name ?? email ?? '' }),
    })

    this.listQuery = scope.query({
      queryKey: () => ADMIN_KEYS.list(this.table.snapshot),
      queryFn: ({ queryKey }) => fetchAdminUsers(queryKey[1], this.data.userId),
      placeholderData: keepPreviousData,
      retry: false,
    })

    const invalidateQueries = { queryKey: ['admin-users'] }
    this.deleteMutation = scope.mutation({ mutationFn: (id) => deleteAdminUser(id, this.data.userId), invalidateQueries })
    this.restoreMutation = scope.mutation({ mutationFn: (id) => restoreAdminUser(id, this.data.userId), invalidateQueries })
  }

  /** Insert — швидке "Додати" (коли не відкрита модалка редагування). */
  mount() {
    const onKeyUp = (event) => {
      if (event.key === 'Insert' && this.editId == null && this.can('create') && !this.isLoading) this.openCreate()
    }
    window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }

  // ---- derived ------------------------------------------------------------

  get rows() {
    return this.listQuery.data?.data ?? []
  }

  get isLoading() {
    return this.listQuery.isLoading
  }

  get pagination() {
    return {
      currentPage: this.table.page,
      pageSize: this.listQuery.data?.limit,
      totalCount: this.listQuery.data?.total,
      onPageChange: this.table.setPageFromPaginator,
      onLimitChange: this.table.setLimit,
    }
  }

  get hasActiveFilters() {
    const { q, unit, isResponsible, trashed } = this.table.filters
    return q?.trim() !== '' || [unit, isResponsible, trashed].some(isTriFilterActive)
  }

  get selectedUserIds() {
    return Object.keys(this.rowSelection).filter((id) => this.rowSelection[id]).map(Number)
  }

  can(action) {
    return this.data.can(action)
  }

  /** Поточний користувач не може видалити/відновити сам себе. */
  isSelf(row) {
    return row?.id === this.data.userId
  }

  selectedOption(options, key) {
    return options.find((option) => String(option.id) === String(this.table.filters[key])) || null
  }

  // ---- actions ------------------------------------------------------------

  setSelectFilter(key, option) {
    this.table.setFilter(key, option?.id ?? 'all')
  }

  setRowSelection(next) {
    this.rowSelection = typeof next === 'function' ? next(this.rowSelection) : next
  }

  openCreate() {
    this.editId = null
    this.createOpen = true
  }

  closeCreate() {
    this.createOpen = false
  }

  openEdit(id) {
    if (this.can('update')) this.editId = id
  }

  closeEdit() {
    this.editId = null
  }

  openBulk() {
    this.bulkOpen = true
  }

  closeBulk({ clearSelection } = {}) {
    this.bulkOpen = false
    if (clearSelection) this.rowSelection = {}
  }

  askDelete(id) {
    this.confirm = { kind: 'delete', id }
  }

  askRestore(id) {
    this.confirm = { kind: 'restore', id }
  }

  cancelConfirm() {
    this.confirm = null
  }

  async confirmAction() {
    const { kind, id } = this.confirm
    const isDelete = kind === 'delete'
    try {
      await (isDelete ? this.deleteMutation : this.restoreMutation).mutate(id)
      toast.success(isDelete ? 'Успішно видалено' : 'Успішно відновлено')
    } catch {
      toast.error(isDelete ? 'Помилка видалення' : 'Помилка відновлення')
    } finally {
      this.confirm = null
    }
  }
}
