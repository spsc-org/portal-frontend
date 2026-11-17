import { observable, reaction } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import { format } from 'date-fns'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import { createCommand } from '../../../shared/mvvm/commands.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import {
  GROUPS,
  createIdentifier,
  deleteIdentifier,
  fetchIdentifier,
  fetchIdentifierAudit,
  fetchIdentifierVersions,
  fetchIdentifiers,
  fetchVesselCallSigns,
  restoreIdentifier,
  rollbackIdentifierVersion,
  updateIdentifier,
} from '../model/dictionaryApi.js'

export const TABS = ['identify', 'identify-v2', 'subgroup', 'attributes']

/** Сторінка /dictionary: вкладка (синхронізується з ?tab=) + словники сторінки. */
export class DictionaryPageViewModel {
  tab

  constructor({ scope, stores, initialTab }) {
    this.scope = scope
    this.stores = stores
    this.tab = TABS.includes(initialTab) ? initialTab : TABS[0]
    makeViewModel(this)
    // countries, subjectTypes — колишні Inertia props.
    this.optionsQuery = scope.query(pageOptionsQuery('dictionary'))
  }

  get countries() {
    return this.optionsQuery.data?.countries ?? []
  }
  get subjectTypes() {
    return this.optionsQuery.data?.subjectTypes ?? []
  }
  get dictionaries() {
    return { countries: this.countries, subjectTypes: this.subjectTypes }
  }
  /** Глобальний /api/voc_user (користувачі для "Оновив" у деталях). */
  get vocabulary() {
    return this.stores.dictionary.dictionary
  }
  get auth() {
    return this.stores.session.auth
  }
  get permissions() {
    return this.stores.session.pagePermissions.dictionary ?? {}
  }

  setTab(value) {
    this.tab = value
  }
}

const IDENTIFIER_FILTERS = {
  group: [],
  subjectTypeId: [],
  code: '',
  name: '',
  comment: '',
  hideDeleted: false,
  belongCountryId: [],
  from: undefined,
  to: undefined,
  limit: 10,
  page: 0,
}

/** Таблиця ідентифікаторів (v1/v2 — лише інший `api`). */
export class IdentifierListViewModel {
  selectedId = null
  isDetailsOpen = false
  isAddOpen = false

  constructor({ scope, stores, page, api }) {
    this.scope = scope
    this.stores = stores
    this.page = page
    this.api = api
    makeViewModel(this, { page: false, api: false })

    this.table = new TableState({
      storageKey: api.storageKey,
      initialFilters: IDENTIFIER_FILTERS,
      signal: scope.signal,
      dirField: 'direction',
    })
    this.listQuery = scope.query({
      queryKey: () => [api.listKey, this.table.snapshot],
      queryFn: ({ queryKey }) => fetchIdentifiers(api, queryKey[1], this.userId),
      placeholderData: keepPreviousData,
    })
    const invalidate = () => [[api.listKey]]
    this.deleteCmd = createCommand(scope, {
      mutationFn: (id) => deleteIdentifier(api, id, this.userId),
      invalidate,
      success: 'Успішно видалено',
      error: 'Помилка видалення',
    })
    this.restoreCmd = createCommand(scope, {
      mutationFn: (id) => restoreIdentifier(api, id, this.userId),
      invalidate,
      success: 'Успішно відновлено',
      error: 'Помилка відновлення',
    })
  }

  /** Insert — додати (коли не відкрито модалок і є право create). */
  mount() {
    const onKeyUp = (event) => {
      if (event.key === 'Insert' && this.page.permissions.create && !this.isAddOpen && !this.isDetailsOpen) {
        this.selectedId = null
        this.isDetailsOpen = false
        this.toggleAdd()
      }
    }
    window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }

  get userId() {
    return this.stores.session.userId
  }
  get filters() {
    return this.table.filters
  }
  get isLoading() {
    return this.listQuery.isLoading
  }
  get isFetching() {
    return this.listQuery.isFetching
  }
  /** Рядки з'являються, коли завантажено і список, і глобальний словник (як в Inertia-версії). */
  get data() {
    const list = this.listQuery.data
    if (!list || !this.page.vocabulary) return []
    return { ...list, data: this.api.decorate(list.data ?? [], this.page.dictionaries) }
  }
  get pagination() {
    return {
      onLimitChange: this.table.setLimit,
      onPageChange: this.table.setPageFromPaginator,
      currentPage: this.table.page,
      pageSize: this.data?.limit,
      totalCount: this.data?.total,
    }
  }
  get hasActiveFilters() {
    const { name, hideDeleted, comment, group, from, to, subjectTypeId, code, belongCountryId } = this.filters
    return Boolean(
      belongCountryId?.length || subjectTypeId?.length || code?.trim() || name?.trim() || comment?.trim() ||
        hideDeleted || from || to || group?.length,
    )
  }

  changeOptions(key) {
    return (selected) => this.table.setFilter(key, selected)
  }
  changeDeleted({ target }) {
    this.table.patchFilters({ [target.name]: target.checked }, { resetPage: false })
  }
  changeDate(range) {
    if (range?.from || range?.to) {
      this.table.patchFilters(
        { from: format(range.from, 'yyyy-MM-dd') || '', to: format(range.to, 'yyyy-MM-dd') || '' },
        { resetPage: false },
      )
    } else {
      this.table.patchFilters({ from: undefined, to: undefined }, { resetPage: false })
    }
  }
  clearFilters() {
    this.table.reset()
  }

  remove(id) {
    return this.deleteCmd.fire(id)
  }
  restore(id) {
    return this.restoreCmd.fire(id)
  }

  openDetails(id) {
    this.selectedId = id
    this.isDetailsOpen = true
  }
  closeDetails() {
    this.isDetailsOpen = false
    this.selectedId = null
  }
  openEdit(id) {
    this.selectedId = id
    this.isAddOpen = true
  }
  toggleAdd() {
    this.isAddOpen = !this.isAddOpen
    if (this.selectedId) this.selectedId = null
  }
}

const EMPTY_IDENTIFIER = {
  code: '',
  pattern: '',
  group: '',
  subjectTypeId: '',
  name_uk: '',
  name_en: '',
  name_doc: '',
  comment: '',
  description_uk: '',
  description_en: '',
  belongCountryId: '',
}

/** Форма ідентифікатора (створення без id / редагування). Після успіху — рядок у кеші списку. */
export class IdentifierFormViewModel {
  form = { ...EMPTY_IDENTIFIER }
  errors = null

  constructor({ scope, stores, api, id, dictionaries }) {
    this.scope = scope
    this.stores = stores
    this.api = api
    this.id = id ?? null
    this.dictionaries = dictionaries
    makeViewModel(this, { api: false, id: false, dictionaries: false, errors: observable.ref })

    this.saveCmd = createCommand(scope, {
      mutationFn: (body) =>
        this.id ? updateIdentifier(api, this.id, body, this.userId) : createIdentifier(api, body, this.userId),
      success: () => (this.id ? 'Оновлено успішно' : 'Створено успішно'),
      error: false,
    })

    if (this.id) {
      this.editQuery = scope.query({
        queryKey: [api.editKey, this.id],
        queryFn: () => fetchIdentifier(api, this.id, this.userId),
      })
      const stop = reaction(() => this.editQuery.data, (payload) => payload && this.fillFrom(api.formSource(payload)), {
        fireImmediately: true,
      })
      scope.signal.addEventListener('abort', stop, { once: true })
    }
  }

  get userId() {
    return this.stores.session.userId
  }
  get title() {
    return this.editQuery?.data ? this.api.title(this.editQuery.data) : undefined
  }
  get isPending() {
    return this.saveCmd.isPending
  }

  fillFrom(source) {
    if (!source) return
    const { countries = [], subjectTypes = [] } = this.dictionaries
    this.form = {
      code: source.code ?? '',
      pattern: source.pattern ?? '',
      group: GROUPS.find((g) => g.id === source.group) ?? '',
      name_uk: source.name_uk ?? '',
      name_en: source.name_en ?? '',
      name_doc: source.name_doc ?? '',
      comment: source.comment ?? '',
      description_uk: source.description_uk ?? '',
      description_en: source.description_en ?? '',
      subjectTypeId: subjectTypes.find((item) => item.id === source.subjectTypeId) ?? '',
      belongCountryId: countries.find((c) => c.id === source.belongCountryId) ?? '',
    }
  }

  changeField({ target }) {
    this.form = { ...this.form, [target.name]: target.value }
  }
  changeOptions(key) {
    return (selected) => {
      this.errors = { ...this.errors, [key]: '' }
      this.form = { ...this.form, [key]: selected }
    }
  }

  async submit() {
    const empty = this.api.emptySelect
    const body = {
      ...this.form,
      subjectTypeId: this.form.subjectTypeId?.id || empty,
      group: this.form.group?.id || empty,
      belongCountryId: this.form.belongCountryId?.id || empty,
    }
    try {
      const data = await this.saveCmd.run(body)
      this.patchList(data)
      this.form = { ...EMPTY_IDENTIFIER }
      return data
    } catch (error) {
      if (error?.status === 422) this.errors = error.payload?.unvalidFields ?? null
      return null
    }
  }

  patchList(data) {
    if (!data?.success) return
    const row = { ...this.api.toRow(data.data), isUpdated: true }
    this.scope.queryClient.setQueriesData({ queryKey: [this.api.listKey] }, (old) => {
      if (!Array.isArray(old?.data)) return old
      return {
        ...old,
        data: this.id ? old.data.map((item) => (item.id === row.id ? row : item)) : [row, ...old.data],
      }
    })
  }
}

/** Деталі ідентифікатора v1: картка + версії (пагінація) + відкат до версії. */
export class IdentifierDetailsViewModel {
  tab = 'info'
  versionsFilters = { limit: 10, page: 0 }
  auditPage = 1 // v2

  constructor({ scope, stores, api, id }) {
    this.scope = scope
    this.stores = stores
    this.api = api
    this.id = id
    makeViewModel(this, { api: false, id: false })

    this.detailsQuery = scope.query({
      queryKey: [api.detailsKey, id],
      queryFn: () => fetchIdentifier(api, id, this.userId),
    })
    if (api.version === 'v1') {
      this.versionsQuery = scope.query({
        queryKey: () => ['identify-versions', id, { ...this.versionsFilters }],
        queryFn: () => fetchIdentifierVersions(id, this.versionsFilters, this.userId),
      })
      this.rollbackCmd = createCommand(scope, {
        mutationFn: (versionId) => rollbackIdentifierVersion({ versionId, identifierId: id }, this.userId),
        invalidate: () => [[api.listKey], [api.detailsKey, id], ['identify-versions', id]],
        success: 'Успішно відновлено',
        error: 'Помилка відновлення',
      })
    } else {
      this.auditQuery = scope.query({
        queryKey: () => ['identify-v2-audit', id, this.auditPage],
        queryFn: () => fetchIdentifierAudit(id, this.auditPage, this.userId),
        options: () => ({ enabled: this.tab === 'audit' }),
      })
    }
  }

  get userId() {
    return this.stores.session.userId
  }
  get payload() {
    return this.detailsQuery.data
  }
  get isFetching() {
    return this.detailsQuery.isFetching
  }

  setTab(value) {
    this.tab = value
  }
  // v1
  setVersionsLimit(limit) {
    this.versionsFilters = { ...this.versionsFilters, limit }
  }
  setVersionsPage(oneBasedPage) {
    this.versionsFilters = { ...this.versionsFilters, page: oneBasedPage - 1 }
  }
  rollback(versionId) {
    return this.rollbackCmd.fire(versionId)
  }
  // v2
  setAuditPage(value) {
    this.auditPage = typeof value === 'function' ? value(this.auditPage) : value
  }
}

const CALL_SIGN_FILTERS = { belongCountryId: [], limit: 50, page: 0 }

/** Вкладка "Позивні сигнали судна" (без persist — як в Inertia-версії). */
export class VesselCallSignsViewModel {
  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)
    this.table = new TableState({ storageKey: 'vessel-call-signs', initialFilters: CALL_SIGN_FILTERS, persist: false })
    this.query = scope.query({
      queryKey: () => ['vessel-call-signs', this.table.snapshot],
      queryFn: ({ queryKey }) => fetchVesselCallSigns(queryKey[1], this.stores.session.userId),
      placeholderData: keepPreviousData,
    })
  }

  get filters() {
    return this.table.filters
  }
  get data() {
    return this.query.data
  }
  get isFetching() {
    return this.query.isFetching
  }
  get hasActiveFilter() {
    return this.filters.belongCountryId?.length > 0
  }
  changeOptions(key) {
    return (selected) => this.table.setFilter(key, selected)
  }
  clearFilters() {
    this.table.reset([])
  }
}
