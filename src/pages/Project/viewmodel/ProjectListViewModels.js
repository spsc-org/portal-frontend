import { observable, reaction, toJS } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommands } from '../../../shared/mvvm/commands.js'
import { listenPrivate } from '../../../shared/realtime/echoChannels.js'
import { copyToClipboard } from '../shared/lib/clipboard.js'
import { shorten } from '../shared/lib/text.js'
import { listLoadState, skeletonRowCount } from '../shared/lib/loadState.js'
import { emptyFilterValues } from '../features/filter-projects/model/filterConfig.js'
import { readInitialListState, saveListState } from '../features/filter-projects/model/initialListState.js'
import { normalizePageSize, PAGE_SIZES } from '../features/filter-projects/model/pageSize.js'
import { serializeFilters, countActive } from '../features/filter-projects/model/serializeFilters.js'
import { buildFilterFields, buildFilterOptions, countHiddenActive } from '../features/filter-projects/model/filterFields.js'
import { readCompactPreference, saveCompactPreference } from '../features/filter-projects/model/compactPreference.js'
import { addNewIds, classifyChange, pruneShown } from '../features/new-projects-notice/model/changeFeed.js'
import { isInCart, pageSelectionState, togglePage, toggleId } from '../features/cart-select/model/cartSelection.js'
import { groupEditorsByProject } from '../features/project-presence/model/editors.js'
import { buildContextMenuItems } from '../features/row-context-menu/model/contextMenuItems.js'
import { toRowModel } from '../widgets/ProjectListTable/model/rowModel.js'
import { sameProposalExtended, toLegacyFilterSettings } from '../widgets/ProjectListPage/model/legacyFilterSettings.js'
import { getCartIds, setCartIds } from '../entities/cart/storage.js'
import {
  CART_COMMANDS,
  CART_QUERIES,
  PROJECT_KEYS,
  PROJECT_QUERIES,
  ROW_COMMANDS,
  downloadProjectAttachment,
  refreshListRows,
} from '../model/projectModel.js'
import { ProjectFormViewModel } from './ProjectFormViewModel.js'
import { TicketFormViewModel } from './TicketFormViewModel.js'
import { ProjectSettingsViewModel, ProposalFilterViewModel } from './ProjectSettingsViewModels.js'
import { PersonalReasonRulesViewModel } from './PersonalReasonRulesViewModel.js'
import { ProjectCardViewModel } from './ProjectCardViewModel.js'
import { VocabularyModalViewModel } from './VocabularyModalViewModel.js'

const HIGHLIGHT_MS = 3000
const UPDATED_PULSE_MS = 3000 // = animation highlight (Portal UI kit, 3s)
const ROW_REFRESH_DEBOUNCE_MS = 400
const NO_IDS = []

/** Що включити в копію (legacy Page.confirmAndCopy: прив'язати документи/пакети, дублювати вкладення/тікети). */
export const COPY_OPTIONS = [
  { group: "Прив'язати", items: [{ id: 'copyDocuments', label: 'Документи' }, { id: 'copyProposals', label: 'Пакети' }] },
  { group: 'Дублювати', items: [{ id: 'copyAttachments', label: 'Вкладення' }, { id: 'copyTickets', label: 'Тікети' }] },
]
const COPY_DEFAULTS = { copyDocuments: true, copyProposals: true, copyAttachments: true, copyTickets: true }

/** Налаштування legacy (localStorage "project-settings"): видимість фільтрів, "Фільтр за поданням". */
export function readLegacySettings() {
  try {
    return JSON.parse(localStorage.getItem('project-settings') ?? 'null') ?? {}
  } catch {
    return {}
  }
}

/**
 * Кошик — той самий localStorage["cartItems"], що й legacy CartManager і кошик-модалка;
 * зміни приходять подією project-cart-changed (і storage з інших вкладок).
 */
export class CartIdsStore {
  ids = getCartIds()

  constructor() {
    makeViewModel(this, { ids: observable.ref })
  }
  mount() {
    const onChange = (event) => this.setIds(event?.detail ?? getCartIds())
    const onStorage = () => this.setIds(getCartIds())
    window.addEventListener('project-cart-changed', onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('project-cart-changed', onChange)
      window.removeEventListener('storage', onStorage)
    }
  }
  setIds(ids) {
    this.ids = ids
  }
  set(ids) {
    setCartIds(ids) // подія оновить усіх слухачів
  }
}

/**
 * /project (список v2): фільтри (persist "project-v2-list"), сторінки, запит списку,
 * live-оновлення (Reverb projects.list), кошик, presence, команди рядка й модалки сторінки.
 */
export class ProjectListPageViewModel {
  // стан списку
  values
  page
  limit
  legacyFilters
  compact = readCompactPreference()
  // нові/змінені проєкти
  pending = NO_IDS
  highlightIds = NO_IDS
  updatedPulse = { ids: NO_IDS, key: 0 }
  // контекстне меню рядка: { x, y, items } | null
  menu = null
  // модалки сторінки
  copyTarget = null
  copyOptions = { ...COPY_DEFAULTS }
  deleteTarget = null
  photo = null // { photos, index }
  isCartOpen = false
  presenceUsers = window.__presenceUsers ?? NO_IDS

  constructor({ scope, stores, search }) {
    this.scope = scope
    this.stores = stores
    const initial = readInitialListState(search, window.localStorage, emptyFilterValues())
    this.values = initial.values
    this.page = initial.page
    this.limit = initial.limit
    this.legacyFilters = toLegacyFilterSettings(readLegacySettings())
    this.cart = new CartIdsStore()
    this.menuRef = { current: null }
    makeViewModel(this, {
      values: observable.ref,
      legacyFilters: observable.ref,
      pending: observable.ref,
      highlightIds: observable.ref,
      updatedPulse: observable.ref,
      menu: observable.ref,
      photo: observable.ref,
      presenceUsers: observable.ref,
      cart: false,
      cartModal: false,
      projectForm: false,
      ticketForm: false,
      settings: false,
      proposalFilter: false,
      reasonRules: false,
      projectCard: false,
      vocabularyModal: false,
      menuRef: false,
      initialOpen: false,
    })

    this.vocQuery = scope.query(PROJECT_QUERIES.voc)
    this.listQuery = scope.query({
      queryKey: () => PROJECT_QUERIES.list(this.params).queryKey,
      queryFn: ({ queryKey }) => PROJECT_QUERIES.list(queryKey[1]).queryFn(),
      placeholderData: keepPreviousData,
    })
    this.cmd = createCommands(scope, ROW_COMMANDS)
    this.cartModal = new CartModalViewModel({ scope, page: this })
    this.projectForm = new ProjectFormViewModel({ scope, page: this })
    this.ticketForm = new TicketFormViewModel({ scope, page: this })
    this.settings = new ProjectSettingsViewModel({ page: this })
    this.proposalFilter = new ProposalFilterViewModel({ scope, page: this })
    this.reasonRules = new PersonalReasonRulesViewModel({ scope, page: this })
    this.projectCard = new ProjectCardViewModel({ scope, page: this })
    this.vocabularyModal = new VocabularyModalViewModel({ scope, page: this })
    // Deep link ?edit={id} (форма) / ?card={id} (картка), як legacy project.js — після словників
    const params = new URLSearchParams(search)
    this.initialOpen = { edit: Number(params.get('edit')) || null, card: Number(params.get('card')) || null, chain: params.has('chain') }

    this.lastId = null
    this.rowsToRefresh = new Set()
    this.timers = {}
    const stops = [
      reaction(
        () => ({ page: this.page, limit: this.limit, values: toJS(this.values) }),
        (state) => saveListState(window.localStorage, state),
      ),
      // Після видалення чи звуження фільтром поточна сторінка могла зникнути
      reaction(
        () => this.pages,
        (pages) => {
          if (pages > 0 && this.page > pages) this.setPage(pages)
        },
      ),
      // Межа "нових" — meta.lastId свіжої сторінки 1
      reaction(
        () => this.listQuery.data,
        (data) => {
          if (this.page !== 1 || !data || this.listQuery.isPlaceholderData) return
          const lastId = Number(data.meta?.lastId)
          if (!Number.isInteger(lastId)) return
          this.lastId = lastId
          this.setPending(pruneShown(this.pending, lastId))
        },
      ),
    ]
    scope.signal.addEventListener('abort', () => stops.forEach((stop) => stop()), { once: true })
  }

  mount() {
    const offCart = this.cart.mount()
    const offForm = this.projectForm.mount()
    const stopInitialOpen = reaction(
      // ланцюжок карток (?chain=1) чекає й на рядки сторінки
      () => this.ready && !(this.initialOpen?.chain && this.pageIds.length === 0),
      (ready) => {
        if (!ready || !this.initialOpen) return
        const { edit, card, chain } = this.initialOpen
        this.initialOpen = null
        if (edit) this.projectForm.openEdit(edit)
        // ?chain=1 — ланцюжок по рядках сторінки, коли вони завантажаться
        else if (card) this.openCard(card, chain ? this.pageIds : [card])
      },
      { fireImmediately: true },
    )
    // Live-зміни: приватний канал projects.list (подія ProjectsChanged {ids, actorId}).
    const offRealtime = listenPrivate('projects.list', ['.ProjectsChanged'], this.onProjectsChanged)
    const onKeyUp = (event) => {
      const active = document.activeElement
      const typing = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable
      if (event.key === 'Insert' && !typing && this.canCreate && !this.projectForm.isOpen) this.createProject()
    }
    window.addEventListener('keyup', onKeyUp)
    const onPresence = (event) => this.setPresenceUsers(Array.isArray(event.detail) ? [...event.detail] : NO_IDS)
    window.addEventListener('user-presence-changed', onPresence)
    const onMouseDown = (event) => this.menu && !this.menuRef.current?.contains(event.target) && this.closeMenu()
    const onKeyDown = (event) => {
      // Escape: відкрите меню react-select закривається саме (preventDefault), інакше — верхня модалка
      if (event.key === 'Escape' && !event.defaultPrevented && this.closeTopModal()) return
      if (event.key === 'Escape') this.closeMenu()
      // ←/→ у картці — сусідній проєкт сторінки (legacy ProjectCardDock)
      const cardOnTop = this.projectCard.isOpen && !this.ticketForm.isOpen && !this.photo
      if (cardOnTop && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !event.target.closest?.('input, textarea, select, [contenteditable]')) {
        this.projectCard.step(event.key === 'ArrowLeft' ? -1 : 1)
      }
    }
    const onScroll = (event) => this.menu && !this.menuRef.current?.contains(event.target) && this.closeMenu()
    window.addEventListener('scroll', onScroll, true)
    const onBlur = () => this.closeMenu()
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onBlur)
    return () => {
      offCart()
      offForm()
      stopInitialOpen()
      offRealtime()
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('user-presence-changed', onPresence)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('scroll', onScroll, true)
      Object.values(this.timers).forEach(clearTimeout)
    }
  }

  // ---- Model-похідні ----
  get session() {
    return this.stores.session
  }
  get userId() {
    return this.session.userId
  }
  get permissions() {
    return this.session.pagePermissions.project ?? {}
  }
  get canCreate() {
    return Boolean(this.permissions.create)
  }
  get voc() {
    return this.vocQuery.data ?? null
  }
  get ready() {
    return Boolean(this.voc)
  }
  get filtersPayload() {
    return serializeFilters(this.values, this.legacyFilters.visibility, this.legacyFilters.proposalExtended)
  }
  get params() {
    return { page: this.page, limit: this.limit, filters: this.filtersPayload }
  }
  get rows() {
    return this.listQuery.data?.rows ?? NO_IDS
  }
  get meta() {
    return this.listQuery.data?.meta ?? {}
  }
  get pages() {
    return this.meta.pages ?? 0
  }
  get pageIds() {
    return this.rows.map((row) => row.id)
  }
  get loadState() {
    return listLoadState({
      ready: this.ready,
      isPending: this.listQuery.isPending,
      isPlaceholderData: this.listQuery.isPlaceholderData,
      isFetching: this.listQuery.isFetching,
    })
  }

  // ---- дочірні VM (форма, яку читають View з origin) ----
  get filters() {
    const options = buildFilterOptions(this.voc)
    const { visibility, proposalExtended } = this.legacyFilters
    return {
      fields: buildFilterFields({ values: this.values, options, visibility, compact: this.compact, optionsLoading: !this.voc }),
      onChange: this.setValue,
      compact: this.compact,
      onToggleCompact: this.toggleCompact,
      hiddenActiveCount: countHiddenActive(this.values, visibility, this.compact),
      canReset: countActive(this.values, Object.keys(this.values)) > 0,
      onReset: this.resetFilters,
      proposalExtendedCount: proposalExtended?.enabled ? proposalExtended.val?.length ?? 0 : null,
    }
  }

  get pagination() {
    const { isLoading } = this.loadState
    return {
      total: isLoading ? null : this.meta.total,
      page: this.page,
      pages: this.pages,
      onPageChange: this.changePage,
      pageSize: this.limit,
      pageSizes: PAGE_SIZES,
      onPageSizeChange: this.setLimit,
      disabled: this.listQuery.isFetching,
    }
  }

  get newProjects() {
    return { visible: this.page === 1 && this.pending.length > 0, count: this.pending.length, onShowNew: this.showNew }
  }

  get table() {
    const voc = this.voc
    const highlighted = new Set(this.highlightIds)
    const pulsing = new Set(this.updatedPulse.ids)
    const { isLoading, isRefreshing } = this.loadState
    if (!isLoading) this.lastShownCount = this.rows.length
    // Замикання нижче викликають дочірні View — залежності читаємо тут, щоб рендер сторінки їх відстежував
    const cartIds = this.cart.ids
    const editorsByProject = this.editorsByProject
    const cartPage = pageSelectionState(cartIds, this.pageIds)
    return {
      rows: this.rows.map((row) => {
        const isPulsing = pulsing.has(row.id)
        return {
          ...toRowModel(row, { permissions: this.permissions, terms: voc?._term }),
          isHighlighted: highlighted.has(row.id),
          isPulsing,
          rowKey: isPulsing ? `${row.id}-pulse-${this.updatedPulse.key}` : String(row.id),
        }
      }),
      pageIds: this.pageIds,
      users: Array.isArray(voc?.user) ? voc.user : NO_IDS,
      states: Array.isArray(voc?.state) ? voc.state : NO_IDS,
      cart: {
        page: isLoading ? { checked: false, indeterminate: false, disabled: true } : cartPage,
        isSelected: (id) => isInCart(cartIds, id),
        onToggle: (id) => this.cart.set(toggleId(cartIds, id)),
        onTogglePage: () => this.cart.set(togglePage(cartIds, this.pageIds)),
      },
      commands: this.commands,
      rowEvents: { onClick: this.onRowClick, onDoubleClick: this.onRowDoubleClick },
      contextMenu: { menu: this.menu, menuRef: this.menuRef, onOpen: this.openMenu, onClose: this.closeMenu, onSelect: this.selectMenuItem },
      editorsOf: (projectId) => editorsByProject.get(Number(projectId)) ?? NO_IDS,
      isLoading,
      isRefreshing,
      skeletonRowCount: skeletonRowCount(this.lastShownCount ?? 0),
      emptyText: 'Проєктів за цими фільтрами не знайдено',
    }
  }

  get error() {
    return this.listQuery.isError
      ? this.listQuery.error?.response?.data?.message ?? 'Не вдалося завантажити список проєктів'
      : null
  }
  get showTable() {
    return !this.listQuery.isError || this.rows.length > 0
  }
  get showBottomBar() {
    return !this.loadState.isLoading && this.rows.length > 0
  }
  get highlightedWords() {
    return this.meta.highlightedWords
  }

  // ---- presence: хто редагує проєкт (список шле OnlineUsersViewModel сайдбару подією user-presence-changed) ----
  setPresenceUsers(users) {
    this.presenceUsers = users
  }
  get editorsByProject() {
    return groupEditorsByProject(this.presenceUsers, this.userId)
  }

  // ---- фільтри / сторінки ----
  setValue(key, value) {
    this.values = { ...this.values, [key]: value }
    this.page = 1
  }
  resetFilters() {
    this.values = emptyFilterValues()
    this.page = 1
  }
  toggleCompact() {
    this.compact = !this.compact
    saveCompactPreference(this.compact)
  }
  setPage(page) {
    this.page = page
  }
  changePage(next) {
    this.page = next
    this.scrollToTop()
  }
  setLimit(limit) {
    this.limit = normalizePageSize(limit)
    this.page = 1
  }
  scrollToTop(behavior = 'auto') {
    document.getElementById('project-list')?.scrollIntoView({ block: 'start', behavior })
  }
  /** Налаштування/"Фільтр за поданням" змінено (модалки сторінки) — перечитати. */
  /** Перечитати project-settings (видимість фільтрів, фільтр за поданням) після змін у модалках. */
  applyLegacySettings() {
    const next = toLegacyFilterSettings(readLegacySettings())
    const proposalChanged = !sameProposalExtended(this.legacyFilters.proposalExtended, next.proposalExtended)
    this.legacyFilters = next
    if (proposalChanged) this.page = 1
  }
  onRetry() {
    return this.retry()
  }
  retry() {
    return this.listQuery.refetch()
  }

  // ---- нові / змінені проєкти (live) ----
  setPending(ids) {
    this.pending = ids
  }
  onProjectsChanged(payload) {
    const { newIds, updatedOnPage } = classifyChange(payload ?? {}, {
      currentUserId: this.userId,
      lastId: this.lastId,
      pageIds: this.pageIds,
    })
    if (newIds.length > 0) this.setPending(addNewIds(this.pending, newIds))
    if (updatedOnPage.length > 0) this.scheduleRowRefresh(updatedOnPage)
  }
  scheduleRowRefresh(ids) {
    ids.forEach((id) => this.rowsToRefresh.add(id))
    clearTimeout(this.timers.refresh)
    this.timers.refresh = setTimeout(() => {
      const batch = [...this.rowsToRefresh]
      this.rowsToRefresh.clear()
      refreshListRows(this.scope.queryClient, this.params, batch)
        .then(() => this.pulseRows(batch))
        .catch((error) => console.error('[project-list] не вдалося оновити рядки', error))
    }, ROW_REFRESH_DEBOUNCE_MS)
  }
  /** Змінені рядки м'яко "блимають"; новий ключ перезапускає CSS-анімацію. */
  pulseRows(ids) {
    this.updatedPulse = { ids, key: this.updatedPulse.key + 1 }
    clearTimeout(this.timers.pulse)
    this.timers.pulse = setTimeout(() => this.setPulseIds(NO_IDS), UPDATED_PULSE_MS)
  }
  setPulseIds(ids) {
    this.updatedPulse = { ids, key: this.updatedPulse.key }
  }
  showNew() {
    this.highlightIds = this.pending
    clearTimeout(this.timers.highlight)
    this.timers.highlight = setTimeout(() => this.setHighlightIds(NO_IDS), HIGHLIGHT_MS)
    this.listQuery.refetch()
    this.scrollToTop('smooth')
  }
  setHighlightIds(ids) {
    this.highlightIds = ids
  }

  // ---- клік по рядку: одиночний (250 мс) — картка, подвійний — редагування ----
  onRowClick(event, id) {
    if (event.target.closest('button, a, input, label, .group\\/ticket')) return
    clearTimeout(this.timers.click)
    this.timers.click = setTimeout(() => {
      if (window.getSelection()?.toString().trim()) return
      this.commands.onOpenCard(id, this.pageIds)
    }, 250)
  }
  onRowDoubleClick(event, id) {
    if (event.target.closest('button, a, input, label, .group\\/ticket')) return
    clearTimeout(this.timers.click)
    this.commands.onEdit(id)
  }

  // ---- контекстне меню (копіювання значень рядка) ----
  openMenu(event, rowModel) {
    if (event.target.closest('a, input, textarea') || window.getSelection()?.toString()) return
    event.preventDefault()
    this.menu = { x: event.clientX, y: event.clientY, items: buildContextMenuItems(rowModel.row, rowModel.precomputedData) }
  }
  closeMenu() {
    if (this.menu) this.menu = null
  }
  async selectMenuItem(item) {
    if (item.disabled) return
    this.closeMenu()
    const copied = await copyToClipboard(item.value)
    if (copied) toast.success(`Скопійовано: ${shorten(item.value, 80)}`)
    else toast.error(`Не вдалося скопіювати: ${item.caption}`)
  }

  // ---- команди рядка ----
  get commands() {
    return {
      canAct: this.ready,
      onOpenCard: this.openCard,
      onEdit: this.editProject,
      onAddTicket: this.addTicket,
      onCopy: this.requestCopy,
      onDelete: this.requestDelete,
      onEditTicket: this.editTicket,
      onSetTicketState: (ticketId, stateId) => this.cmd.setTicketState.fire({ ticketId, stateId }),
      onDeleteTicket: (ticketId) => {
        if (window.confirm(`Видалити тікет ${ticketId}?`)) this.cmd.deleteTicket.fire(ticketId)
      },
      onDownloadAttachment: (attachmentId, filename) =>
        downloadProjectAttachment(attachmentId, filename).catch(() => toast.error('Не вдалося завантажити вкладення')),
      onOpenPhoto: (photos, index) => this.openPhoto(photos, index),
    }
  }

  openCard(id, ids = this.pageIds) {
    this.projectCard.open(id, ids)
  }
  closeCard() {
    if (this.projectCard.isOpen) this.projectCard.close()
  }

  createProject() {
    if (this.canCreate) this.projectForm.openAdd()
  }
  editProject(id) {
    this.closeCard()
    this.projectForm.openEdit(id)
  }
  addTicket(projectId) {
    this.ticketForm.openAdd(projectId)
  }
  editTicket(projectId, ticketId) {
    this.ticketForm.openEdit(projectId, ticketId)
  }

  requestCopy(id) {
    this.copyTarget = id
    this.copyOptions = { ...COPY_DEFAULTS }
  }
  toggleCopyOption(key) {
    this.copyOptions = { ...this.copyOptions, [key]: !this.copyOptions[key] }
  }
  closeCopy() {
    this.copyTarget = null
  }
  copy() {
    const id = this.copyTarget
    this.copyTarget = null
    return this.cmd.copyProject.fire({ id, options: this.copyOptions })
  }
  requestDelete(id) {
    this.deleteTarget = id
  }
  closeDelete() {
    this.deleteTarget = null
  }
  confirmDelete() {
    const id = this.deleteTarget
    this.deleteTarget = null
    return this.cmd.deleteProject.fire(id)
  }

  openPhoto(photos, index) {
    if (photos?.length) this.photo = { photos, index }
  }
  closePhoto() {
    this.photo = null
  }
  stepPhoto(delta) {
    if (!this.photo) return
    const count = this.photo.photos.length
    this.photo = { ...this.photo, index: (this.photo.index + delta + count) % count }
  }

  /** Експорт (NSDC) з поточними фільтрами — web-маршрут /project/export (через proxy). */
  exportProjects() {
    const filters = encodeURIComponent(JSON.stringify(this.filtersPayload ?? {}))
    window.open(`/project/export?filters=${filters}&mode=nsdc`, '_blank')?.focus()
  }
  openSettings() {
    this.settings.open()
  }
  openProposalFilter() {
    this.proposalFilter.open()
  }
  openReasonRules() {
    this.reasonRules.open()
  }

  /** Модалка збігів консолідованого пошуку форми (для стека Escape). */
  get consolidatedModal() {
    const search = this.projectForm.consolidated
    return { isOpen: search.modal != null, close: search.closeModal }
  }

  /** Escape закриває верхню з відкритих модалок сторінки; true — якщо щось закрито. */
  closeTopModal() {
    const stack = [this.vocabularyModal, this.consolidatedModal, this.ticketForm, this.projectForm, this.projectCard, this.reasonRules, this.proposalFilter, this.settings]
    const top = stack.find((modal) => modal.isOpen)
    top?.close()
    return Boolean(top)
  }

  openCart() {
    this.isCartOpen = true
  }
  closeCart() {
    this.isCartOpen = false
  }
}

const CART_OPTION_KEYS = ['documentType', 'initiator', 'proposal', 'restriction', 'state', 'term', 'user']

/**
 * Кошик-модалка (порт CartModal + entities/cart/queries.js): вибрані проєкти, масові дії, журнал.
 * Набір id — page.cart (localStorage "cartItems"); запити активні лише поки модалка відкрита.
 */
export class CartModalViewModel {
  activeTab = 'tab-1'

  constructor({ scope, page }) {
    this.scope = scope
    this.page = page
    makeViewModel(this, { page: false })
    const enabled = () => ({ enabled: this.page.isCartOpen && Boolean(this.page.userId) })
    this.optionsQuery = scope.query({ ...PROJECT_QUERIES.options(CART_OPTION_KEYS), options: enabled })
    this.collectionQuery = scope.query({
      queryKey: () => CART_QUERIES.collection(this.ids).queryKey,
      queryFn: () => CART_QUERIES.collection(this.ids).queryFn(),
      options: () => ({ enabled: this.page.isCartOpen && this.ids.length > 0 }),
    })
    this.logQuery = scope.query({ ...CART_QUERIES.log, options: () => ({ enabled: this.page.isCartOpen && this.activeTab === 'tab-3' }) })
    this.taskOptionsQuery = scope.query({ ...CART_QUERIES.taskOptions, options: enabled })
    this.cmd = createCommands(scope, CART_COMMANDS)
  }

  get isOpen() {
    return this.page.isCartOpen
  }
  get userId() {
    return this.page.userId
  }
  get ids() {
    return this.page.cart.ids
  }
  get options() {
    return this.optionsQuery.data
  }
  get collection() {
    return this.ids.length > 0 ? this.collectionQuery.data ?? NO_IDS : NO_IDS
  }
  get isCollectionLoading() {
    return this.ids.length > 0 && this.collectionQuery.isLoading
  }
  get log() {
    return this.logQuery.data ?? NO_IDS
  }
  get isLogLoading() {
    return this.logQuery.isLoading
  }
  get taskOptions() {
    return this.taskOptionsQuery.data
  }

  setActiveTab(tab) {
    this.activeTab = tab
  }
  remove(id) {
    this.page.cart.set(this.ids.filter((existing) => Number(existing) !== Number(id)))
  }
  clear() {
    this.page.cart.set([])
  }
  close() {
    this.page.closeCart()
  }

  /** Після успішної масової дії — як handleMassAction() legacy cartManager. */
  done(envelope) {
    const message = envelope?.message ?? ''
    toast.success(message && message !== 'complete' ? message : 'Операцію виконано')
    const filePath = envelope?.data?.filePath
    if (filePath) {
      const filename = filePath.split(/[\\/]/).pop()
      const url = `/api/project/download-dossier/${filename}`
      if (filename.endsWith('.html')) window.open(url, '_blank')
      else window.location.href = url
    }
    this.scope.invalidate(['project-cart-collection'])
    this.scope.invalidate(PROJECT_KEYS.all)
    this.close()
  }
}
