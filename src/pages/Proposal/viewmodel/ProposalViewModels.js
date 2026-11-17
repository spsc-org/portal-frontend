import { observable, reaction } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import { compareDesc, format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import { createCommand } from '../../../shared/mvvm/commands.js'
import { downloadFile } from '../../../lib/utils.js'
import { blobErrorMessage } from '../../../entities/file/fileApi.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import {
  PROPOSAL_KEYS,
  bulkAttachDecree,
  completeProposal,
  createProposal,
  deleteProposal,
  exportFilename,
  exportLinkedProjects,
  fetchLinkedProjects,
  fetchProposal,
  fetchProposals,
  generateDossiers,
  restoreProposal,
  revertProposalState,
  updateProposal,
  updateProposalOrder,
} from '../model/proposalApi.js'

/**
 * Спільне для VM сторінок подань: колишні Inertia props (options) + auth —
 * те, що модалки читали через usePage().props (тепер useProposalProps()).
 */
const pageProps = (vm, extra = {}) => ({ auth: vm.stores.session.auth, ...(vm.optionsQuery.data ?? {}), ...extra })

// ============================================================================
// /proposal — реєстр
// ============================================================================

const INITIAL_FILTERS = {
  text: '',
  decreeId: [],
  stateId: [],
  issuerId: [],
  createdUserId: [],
  hideDeleted: false,
  hideNonHistorical: undefined,
  outgoingNumber: '',
  page: 0,
  limit: 50,
}

/** Старі збережені фільтри могли містити опції без value — шукаємо id за підписом. */
function normalizeOptions(items = [], source = []) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (!item) return null
      if (item.value !== undefined && item.value !== null) return item
      const label = item.label || item.caption || item.name
      if (!label) return null
      const matched = source.find((option) => [option?.caption, option?.name].includes(label))
      return matched?.id != null ? { label, value: matched.id } : null
    })
    .filter(Boolean)
}

export class ProposalListViewModel {
  selectedId = null
  isCreateOpen = false
  isDetailsOpen = false
  editDialog = null // { selectedId }
  revertDialog = null // { selectedId }

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { editDialog: observable.ref, revertDialog: observable.ref })

    this.optionsQuery = scope.query(pageOptionsQuery('proposal'))
    this.table = new TableState({ storageKey: '/proposal', initialFilters: INITIAL_FILTERS, signal: scope.signal, dirField: 'direction' })
    this.listQuery = scope.query({
      queryKey: () => PROPOSAL_KEYS.list(this.table.snapshot),
      queryFn: ({ queryKey }) => fetchProposals(queryKey[1], this.userId),
      placeholderData: keepPreviousData,
    })
    const list = () => [PROPOSAL_KEYS.all]
    this.deleteCmd = createCommand(scope, {
      mutationFn: (id) => deleteProposal(id, this.userId),
      invalidate: list,
      success: 'Успішно видалено',
      error: 'Помилка видалення',
    })
    this.restoreCmd = createCommand(scope, {
      mutationFn: (id) => restoreProposal(id, this.userId),
      invalidate: list,
      success: 'Успішно відновлено',
      error: 'Помилка відновлення',
    })

    // Нормалізація відновлених фільтрів — щойно завантажились словники.
    const stop = reaction(
      () => this.optionsQuery.data,
      (options) => {
        if (!options) return
        const f = this.table.filters
        this.table.patchFilters(
          {
            decreeId: normalizeOptions(f.decreeId, options.decrees),
            stateId: normalizeOptions(f.stateId, options.proposalState),
            issuerId: normalizeOptions(f.issuerId, options.issuers),
            createdUserId: normalizeOptions(f.createdUserId, options.users),
          },
          { resetPage: false },
        )
        stop()
      },
      { fireImmediately: true },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  /** Insert — нове подання (коли не відкрито редагування/деталей). */
  mount() {
    const onKeyUp = (event) => {
      if (event.key === 'Insert' && this.canCreate && !this.editDialog && !this.isDetailsOpen) {
        this.selectedId = null
        this.isDetailsOpen = false
        this.openCreate()
      }
    }
    window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }

  get props() {
    return pageProps(this)
  }
  get userId() {
    return this.stores.session.userId
  }
  get auth() {
    return this.stores.session.auth
  }
  get permissions() {
    return this.stores.session.pagePermissions.proposal ?? {}
  }
  get canCreate() {
    return Boolean(this.permissions.create)
  }
  canRestore(row) {
    if (!row?.original?.deletedAt) return false
    const restore = this.permissions.restore
    return restore === true || (restore === 'individual' && this.userId === row.original.createdUserId)
  }

  get filters() {
    return this.table.filters
  }
  get data() {
    return this.listQuery.data
  }
  get isFetching() {
    return this.listQuery.isFetching
  }

  changeOptions(key) {
    return (selected) => this.table.setFilter(key, selected || [])
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

  openCreate() {
    if (this.isFetching) return
    this.isCreateOpen = true
  }
  closeCreate() {
    this.isCreateOpen = false
  }
  openDetails(id) {
    this.isDetailsOpen = !this.isDetailsOpen
    this.selectedId = id
  }
  closeDetails() {
    this.isDetailsOpen = false
    this.selectedId = null
  }
  openEdit(props) {
    this.editDialog = props
  }
  closeEdit() {
    this.editDialog = null
  }
  openRevert(props) {
    this.revertDialog = props
  }
  closeRevert() {
    this.revertDialog = null
  }
}

// ============================================================================
// Модалки подання
// ============================================================================

const EMPTY_FORM = {
  issuerId: '',
  stateId: '',
  caption: '',
  description: '',
  outgoingDate: undefined,
  outgoingNumber: '',
  createdUserId: '',
  comments: '',
}

/** Створення (без id) / редагування подання. */
export class ProposalFormViewModel {
  form
  errors = null

  constructor({ scope, stores, id = null, props }) {
    this.scope = scope
    this.stores = stores
    this.id = id
    this.dicts = props
    this.form = id ? { ...EMPTY_FORM } : { ...EMPTY_FORM, stateId: props.proposalState?.find((s) => s.caption === 'Проєкт') }
    makeViewModel(this, { id: false, dicts: false, errors: observable.ref })

    this.saveCmd = createCommand(scope, {
      mutationFn: (body) => (this.id ? updateProposal(this.id, body, this.userId) : createProposal(body, this.userId)),
      // створення — новий рядок угорі списку (підсвітка), редагування — рефетч
      onSuccess: (data, _vars, sc) => {
        if (this.id || !data?.success) return
        sc.queryClient.setQueriesData({ queryKey: PROPOSAL_KEYS.all }, (old) =>
          Array.isArray(old?.data) ? { ...old, data: [{ ...data.data, isUpdated: true }, ...old.data] } : old,
        )
      },
      invalidate: () => (this.id ? [PROPOSAL_KEYS.show(this.id), PROPOSAL_KEYS.all] : []),
      success: () => (this.id ? 'Оновлено успішно' : 'Створено успішно'),
      error: false,
    })

    if (id) {
      this.detailQuery = scope.query({ queryKey: PROPOSAL_KEYS.detail(id), queryFn: () => fetchProposal(id, this.userId) })
      const stop = reaction(() => this.detailQuery.data?.data, (proposal) => proposal && this.fillFrom(proposal), { fireImmediately: true })
      scope.signal.addEventListener('abort', stop, { once: true })
    }
  }

  get userId() {
    return this.stores.session.userId
  }
  get data() {
    return this.detailQuery?.data
  }
  get isLoading() {
    return this.detailQuery?.isLoading ?? false
  }
  get isPending() {
    return this.saveCmd.isPending
  }
  /** Зафіксоване подання переходить лише між фіксованими станами (і навпаки). */
  get states() {
    const all = this.dicts.proposalState ?? []
    const stateId = this.data?.data?.stateId
    if (!stateId) return all
    const isFixed = all.find((item) => item.id === stateId)?.isFixed
    return all.filter((item) => Boolean(item.isFixed) === Boolean(isFixed))
  }

  fillFrom(proposal) {
    this.form = {
      caption: proposal.caption,
      description: proposal.description,
      outgoingNumber: proposal.outgoingNumber,
      comments: proposal.comments,
      issuerId: this.dicts.issuers?.find((i) => i.id === proposal.issuerId),
      stateId: this.dicts.proposalState?.find((s) => s.id === proposal.stateId),
      outgoingDate: proposal.outgoingDate ? format(proposal.outgoingDate, 'yyyy-MM-dd') : '',
    }
  }

  clearError(key) {
    this.errors = { ...this.errors, [key]: '' }
  }
  changeInput({ target: { name, value } }) {
    this.clearError(name)
    this.form = { ...this.form, [name]: value }
  }
  changeSelect(key) {
    return (selected) => {
      this.clearError(key)
      this.form = { ...this.form, [key]: selected }
    }
  }
  changeDate(date) {
    if (date) {
      this.form = { ...this.form, outgoingDate: format(date, 'yyyy-MM-dd') || '' }
      this.clearError('outgoingDate')
    } else {
      this.form = { ...this.form, outgoingDate: undefined }
    }
  }

  async submit() {
    try {
      await this.saveCmd.run({ ...this.form, stateId: this.form.stateId?.id, issuerId: this.form.issuerId?.id })
      this.form = { ...EMPTY_FORM }
      return true
    } catch (error) {
      if (error?.status === 422) this.errors = error.payload?.unvalidFields ?? null
      return false
    }
  }
}

/** Модалка "Детальна інформація" (реєстр). */
export class ProposalDetailsViewModel {
  constructor({ scope, stores, id }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query({ queryKey: PROPOSAL_KEYS.detail(id), queryFn: () => fetchProposal(id, stores.session.userId) })
  }

  get proposal() {
    const result = this.query.data?.data
    return {
      ...result,
      createdAt: result?.createdAt || result?.created_at,
      updatedAt: result?.updatedAt || result?.updated_at,
      deletedAt: result?.deletedAt || result?.deleted_at,
    }
  }
}

/** Повернення подання в нефіксований стан. */
export class RevertStateViewModel {
  form = { state: null }
  errors = null

  constructor({ scope, stores, id, props }) {
    this.scope = scope
    this.stores = stores
    this.id = id
    this.options = (props.proposalState ?? []).filter((item) => !item.isFixed)
    makeViewModel(this, { id: false, options: false, form: observable.ref, errors: observable.ref })
    this.revertCmd = createCommand(scope, {
      mutationFn: (stateId) => revertProposalState(id, stateId, stores.session.userId),
      invalidate: () => [PROPOSAL_KEYS.show(id), PROPOSAL_KEYS.all],
      success: 'Стан змінено успішно',
      error: false,
    })
  }

  setForm(value) {
    this.form = typeof value === 'function' ? value(this.form) : value
  }
  get isPending() {
    return this.revertCmd.isPending
  }
  async submit() {
    try {
      await this.revertCmd.run(this.form.state?.id)
      return true
    } catch (error) {
      if (error?.status === 422) this.errors = error.payload?.unvalidFields ?? null
      return false
    }
  }
}

// ============================================================================
// /proposal/:id — перегляд подання
// ============================================================================

const READY_STATES = [2, 7]
const isReady = (project) => READY_STATES.includes(project?.stateId)

/**
 * /proposal/:id: подання, проєкти за вкладками (тип суб'єкта × дія),
 * ручне впорядкування (dnd) і модалки дій над поданням.
 */
export class ProposalViewViewModel {
  activeTab = null
  items = {} // вкладка → впорядкований список (після dnd/сортування)
  sortType = null
  dialogs = {} // назва → props | undefined

  constructor({ scope, stores, id, minify = false }) {
    this.scope = scope
    this.stores = stores
    this.id = Number(id)
    makeViewModel(this, { id: false, items: observable.ref, dialogs: observable.ref })

    this.optionsQuery = scope.query(pageOptionsQuery(minify ? `proposal-minify/${id}` : `proposal-view/${id}`))
    this.proposalQuery = scope.query({ queryKey: PROPOSAL_KEYS.show(this.id), queryFn: () => fetchProposal(this.id, this.userId) })
    this.projectsQuery = scope.query({
      queryKey: minify ? PROPOSAL_KEYS.linkedProjectsMinify(this.id) : PROPOSAL_KEYS.linkedProjects(this.id),
      queryFn: () => fetchLinkedProjects(this.id, this.userId),
    })
    this.orderCmd = createCommand(scope, {
      mutationFn: (order) => updateProposalOrder(this.id, order, this.userId),
      success: 'Порядок змінено успішно',
      error: 'Помилка зміна порядку',
    })

    // Перша вкладка — щойно з'явились проєкти.
    const stop = reaction(
      () => this.headers[0]?.value,
      (first) => {
        if (first && !this.activeTab) this.activeTab = first
      },
      { fireImmediately: true },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  get props() {
    return pageProps(this, { id: this.id })
  }
  get userId() {
    return this.stores.session.userId
  }
  get auth() {
    return this.stores.session.auth
  }
  get options() {
    return this.optionsQuery.data ?? {}
  }
  get proposal() {
    return this.proposalQuery.data?.data
  }
  get projects() {
    return this.projectsQuery.data
  }
  get isLinkedProjectsLoading() {
    return this.projectsQuery.isFetching
  }
  get isFixed() {
    const stateId = this.proposal?.stateId
    return stateId ? Boolean((this.options.proposalState ?? []).find((ps) => ps.id === stateId)?.isFixed) : false
  }

  /** Вкладки "тип.дія" з ненульовими лічильниками (labels: тип → дія → [готові, усі, назва]). */
  get headers() {
    const projects = this.projects
    if (!projects?.data && !projects?.labels) return []
    return Object.entries(projects.labels ?? {}).flatMap(([outerKey, inner]) =>
      Object.entries(inner)
        .filter(([, value]) => value[0] > 0 || value[1] > 0)
        .map(([innerKey, value]) => ({
          content: value[2],
          label: `${outerKey}.${innerKey}`,
          value: `${outerKey}-${innerKey}`,
          count: `${value[0] || 0}/${value[1] || 0}`,
          subjectTypeId: outerKey,
          actionTypeId: innerKey,
        })),
    )
  }
  tabProjects(tab = this.activeTab) {
    if (!tab) return []
    const [outerKey, innerKey] = tab.split('-')
    return this.projects?.data?.[outerKey]?.[innerKey] ?? []
  }
  get currentItems() {
    if (!this.activeTab) return []
    return this.items[this.activeTab] || this.tabProjects().filter(isReady)
  }
  get nonReadyItems() {
    return this.tabProjects().filter((project) => !isReady(project))
  }
  get allItems() {
    if (!this.projects?.data) return []
    return Object.values(this.projects.data)
      .flatMap((group) => Object.values(group).flat())
      .filter(isReady)
  }
  get countStates() {
    return (this.options.projectState ?? []).map((state) => ({
      id: state.id,
      caption: state.caption,
      count: this.currentItems.filter((item) => item?.stateId === state.id).length,
    }))
  }
  get countReady() {
    return this.countStates.filter((s) => READY_STATES.includes(s.id)).reduce((acc, s) => acc + s.count, 0)
  }
  get countNonReady() {
    return this.countStates.length === 0 ? 0 : this.nonReadyItems.length
  }

  setActiveTab(tab) {
    this.activeTab = tab
  }
  setItems(value) {
    this.items = typeof value === 'function' ? value(this.items) : value
  }
  setTabItems(list) {
    this.items = { ...this.items, [this.activeTab]: list }
  }

  /** Сортування поточної вкладки (до збереження — лише локально). */
  sort(type = null) {
    const list = [...this.currentItems]
    const countryOf = (item) => {
      try {
        return JSON.parse(item?.precomputedData)?.countries?.[0]?.name || ''
      } catch {
        return ''
      }
    }
    switch (type) {
      case 'alphabetical':
        list.sort((a, b) => a.nameUk.localeCompare(b.nameUk))
        break
      case 'countries':
        list.sort((a, b) => countryOf(b).localeCompare(countryOf(a)))
        break
      case 'newFirst':
        list.sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)))
        break
      default:
        list.sort((a, b) => a.order - b.order)
    }
    this.sortType = type
    this.setTabItems(list)
  }

  /** Зберегти порядок вкладки: [[projectId, позиція]…] лише для готових. */
  async saveOrder() {
    if (this.orderCmd.isPending) return
    const current = this.items[this.activeTab] || this.currentItems
    const request = Object.entries(current)
      .filter(([, project]) => isReady(project))
      .map(([order, project]) => [project.id, Number(order) + 1])
    try {
      const response = await this.orderCmd.run(request)
      this.setTabItems(response?.data)
    } catch {
      this.setTabItems(this.currentItems)
    }
  }

  // ---- модалки (назва → props) ----
  openDialog(name, props = {}) {
    this.dialogs = { ...this.dialogs, [name]: props }
  }
  closeDialog(name) {
    this.dialogs = { ...this.dialogs, [name]: undefined }
  }
}

/** Фіксація стану / внесення змін (номер і дата вихідного). */
export class CompleteViewModel {
  form
  errors = null

  constructor({ scope, stores, props, dialogProps }) {
    this.scope = scope
    this.stores = stores
    this.id = props.id
    this.isEdit = Boolean(dialogProps?.isEdit)
    this.fixedStates = (props.proposalState ?? []).filter((state) => state.isFixed)
    this.form = { outgoingNumber: dialogProps?.outgoingNumber || '', outgoingDate: dialogProps?.outgoingDate || undefined }
    makeViewModel(this, { id: false, isEdit: false, fixedStates: false, errors: observable.ref })
    this.completeCmd = createCommand(scope, {
      mutationFn: (body) => completeProposal(this.id, body, this.isEdit, stores.session.userId),
      invalidate: () => [PROPOSAL_KEYS.show(this.id), PROPOSAL_KEYS.linkedProjects(this.id), PROPOSAL_KEYS.all],
      success: 'Стан підтверджено успішно',
      error: false,
    })
  }

  get title() {
    return this.isEdit ? 'Внесення змін' : 'Зафіксувати стан'
  }
  get isPending() {
    return this.completeCmd.isPending
  }
  clearError(key) {
    this.errors = { ...this.errors, [key]: '' }
  }
  changeInput({ target: { name, value } }) {
    this.clearError(name)
    this.form = { ...this.form, [name]: value }
  }
  changeSelect(key) {
    return (selected) => {
      this.clearError(key)
      this.form = { ...this.form, [key]: selected }
    }
  }
  changeDate(date) {
    if (date) {
      this.form = { ...this.form, outgoingDate: format(date, 'yyyy-MM-dd') || '' }
      this.clearError('outgoingDate')
    } else {
      this.form = { ...this.form, outgoingDate: undefined }
    }
  }
  async submit() {
    this.errors = null
    try {
      await this.completeCmd.run({ ...this.form, stateId: this.form?.stateId?.id })
      return true
    } catch (error) {
      if (error?.payload?.message) toast.error(error.payload.message)
      if (error?.status === 422) this.errors = error.payload?.unvalidFields ?? null
      return false
    }
  }
}

/** Масове прикріплення указу до обраних проєктів подання. */
export class AttachDecreeViewModel {
  form = { decreeId: null }
  errors = null

  constructor({ scope, stores, proposalId }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { form: observable.ref, errors: observable.ref })
    this.attachCmd = createCommand(scope, {
      mutationFn: (body) => bulkAttachDecree(body, stores.session.userId),
      invalidate: () => [PROPOSAL_KEYS.show(proposalId), PROPOSAL_KEYS.linkedProjects(proposalId)],
      success: 'Успішно додано указ',
      error: false,
    })
  }

  get isPending() {
    return this.attachCmd.isPending
  }
  setForm(value) {
    this.form = typeof value === 'function' ? value(this.form) : value
  }
  async submit(projectIds) {
    try {
      await this.attachCmd.run({ decreeId: this.form?.decreeId?.id, projectIds })
      return true
    } catch (error) {
      if (error?.status === 422) this.errors = error.payload?.errors ?? null
      return false
    }
  }
}

/** Експорт проєктів вкладки у файл (blob; помилка — JSON у Blob). */
export class ExportLinkedProjectsViewModel {
  form

  constructor({ scope, stores, defaults }) {
    this.scope = scope
    this.stores = stores
    this.form = defaults
    makeViewModel(this)
    this.exportCmd = createCommand(scope, {
      mutationFn: ({ id, params }) => exportLinkedProjects(id, params, stores.session.userId),
      error: false,
    })
  }

  get isPending() {
    return this.exportCmd.isPending
  }
  setForm(value) {
    this.form = typeof value === 'function' ? value(this.form) : value
  }

  async exportFile({ actionId, typeId, id }) {
    if (this.isPending) return
    const f = this.form
    const params = {
      actionTypeId: actionId,
      subjectTypeId: typeId,
      changeQuotes: f.changeQuotes,
      moveVesselToRestriction: f.moveVesselToRestriction,
      restrictionsSeparateProcessingNum24: f.restrictionsSeparateProcessingNum24,
      moveAddressesToAdditionalInfo: f.moveAddressesToAdditionalInfo,
      onlyReadyProjects: f.onlyReadyProjects,
      shouldValidateIdentifier: f.shouldValidateIdentifier,
      restrictionsFullProhibition: f.restrictionsFullProhibition.map((item) => item.value),
      restrictionsCompleteTermination: f.restrictionsCompleteTermination.map((item) => item.value),
      skipIdentifierTypes: f.skipIdentifierTypes.map((item) => item.value),
      skipAttributeTypes: f.skipAttributeTypes.map((item) => item.value),
      useReasoningMacro: f.useReasoningMacro,
      reasoningMacro: f.reasoningMacro,
    }
    try {
      const response = await this.exportCmd.run({ id, params })
      downloadFile(response.data, exportFilename(response.headers['content-disposition']))
    } catch (error) {
      const blob = error?.payload
      let message = 'Виникла помилка завантаження.'
      if (blob instanceof Blob && blob.type?.includes('application/json')) {
        try {
          const parsed = JSON.parse(await blob.text())
          if (parsed?.message) message = `${parsed.message} ${parsed.error ?? ''}`.trim()
        } catch {
          // не JSON
        }
      } else {
        message = (await blobErrorMessage(error)) || message
      }
      toast.error(message)
    }
  }
}

/** Генерація досьє за проєктами вкладки (docx/html). */
export class GenerateDossiersViewModel {
  form = { includePhoto: true, photoMode: 'first', includeNotes: false, outputFormat: 'docx' }

  constructor({ scope, stores }) {
    this.scope = scope
    makeViewModel(this)
    this.generateCmd = createCommand(scope, {
      mutationFn: ({ id, body }) => generateDossiers(id, body, stores.session.userId),
      success: (data) => data?.message ?? 'Досьє згенеровано',
      error: 'Виникла помилка генерації досьє',
    })
  }

  get isPending() {
    return this.generateCmd.isPending
  }
  setForm(value) {
    this.form = typeof value === 'function' ? value(this.form) : value
  }

  /** Файл віддає /api/project/download-dossier/{name}: html — у новій вкладці, docx — завантаженням. */
  async generate({ actionId, typeId, id }, onClose) {
    if (this.isPending) return
    const f = this.form
    try {
      const data = await this.generateCmd.run({
        id,
        body: {
          actionTypeId: actionId,
          subjectTypeId: typeId,
          includePhoto: f.includePhoto,
          includeNotes: f.includeNotes,
          outputFormat: f.outputFormat,
          photoMode: f.photoMode,
        },
      })
      const filePath = data?.data?.filePath
      if (!filePath) return
      const filename = filePath.split(/[\\/]/).pop()
      const url = `/api/project/download-dossier/${filename}`
      if (filename.endsWith('.html')) window.open(url, '_blank')
      else window.location.href = url
      onClose()
    } catch {
      // тост уже показано
    }
  }
}
