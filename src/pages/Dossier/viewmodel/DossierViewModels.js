import { observable, reaction, toJS } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommand, createCommands } from '../../../shared/mvvm/commands.js'
import { fetchProfileAuditHistory, fetchProfiles, refreshProfileStatus } from '../entities/dossier/api.js'
import { linkConnection, searchSources } from '../entities/dossierConnection/api.js'
import { fetchAllTickets, previewLinks as fetchLinksPreview } from '../entities/dossierTicket/api.js'
import { clearDraft, hasDraft, readDraft, writeDraft } from '../entities/dossierTicket/draftStorage.js'
import { canChangeLink, canDeleteProfile, canReadAudit, canViewProfiles } from '../shared/lib/permissions.js'
import { dossierTicketKeys, sanctionConnectionKeys, sanctionProfileKeys } from '../shared/lib/queryKeys.js'
import {DOSSIER_QUERIES, ORPHAN_COMMANDS, connectionCommands, duplicatesSearchCommand, orphansInfiniteQuery, profileCommands, profileListParams, profilesInfiniteQuery, relationCommands, singleTicketCommands, ticketCommands} from '../model/dossierModel.js';
function readStored(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeStored(key, value) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, String(value))
  } catch {
    // localStorage недоступний (приватний режим) — ігноруємо
  }
}

/** Права модуля (session.auth має форму Inertia auth). */
const dossierRights = (session) => ({
  canView: canViewProfiles(session.auth),
  canManage: canChangeLink(session.auth),
  canDeleteProfile: canDeleteProfile(session.auth),
  canReadAudit: canReadAudit(session.auth),
})

/** Словники модуля — для компонентів, яким потрібні лише options. */
export class DossierOptionsViewModel {
  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query(DOSSIER_QUERIES.options)
  }
  get options() {
    return this.query.data
  }
}

// ============================================================================
// /dossier — сторінка
// ============================================================================

const STORAGE = '/dossier'
export const DEFAULT_FILTERS = {
  q: '',
  typeFilter: [],
  modelClassFilter: [],
  reviewOnly: false,
  conflictOnly: false,
  uaSanctionsStatusFilter: [],
  matchedPassFilter: [],
  originFilter: [],
  ticketStatusFilter: null,
  expiringWithinDays: null,
  hasAvatar: undefined,
  connectionsCountMin: '',
  connectionsCountMax: '',
  sort: 'updated_at',
  direction: 'desc',
}

// Старі збережені фільтри (typeFilter був числом, не масивом) — замінюємо типовими.
function sanitize(stored) {
  const arrays = ['typeFilter', 'modelClassFilter', 'uaSanctionsStatusFilter', 'matchedPassFilter', 'originFilter']
  const result = { ...DEFAULT_FILTERS, ...stored }
  arrays.forEach((key) => {
    if (!Array.isArray(stored?.[key])) result[key] = DEFAULT_FILTERS[key]
  })
  return result
}

/**
 * /dossier: фільтри списку (persist), активний профіль (?view= / останній
 * відкритий), панель "Список сирот" (persist).
 */
export class DossierPageViewModel {
  filters
  activeId = null
  showOrphans = readStored(`${STORAGE}-showOrphans`) === 'true'

  constructor({ scope, stores, viewParam }) {
    this.scope = scope
    this.stores = stores
    let restored = DEFAULT_FILTERS
    try {
      const raw = readStored(`${STORAGE}-filters`)
      if (raw) restored = sanitize(JSON.parse(raw))
    } catch {
      restored = DEFAULT_FILTERS
    }
    this.filters = restored
    // Немає ?view= (свіжий захід) — відкриваємо останнє досьє з попереднього візиту.
    const stored = readStored(`${STORAGE}-lastProfile`)
    this.activeId = viewParam ? Number(viewParam) : stored ? Number(stored) : null
    makeViewModel(this, { filters: observable.ref })

    const stop = reaction(() => toJS(this.filters), (filters) => writeStored(`${STORAGE}-filters`, JSON.stringify(filters)))
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  get rights() {
    return dossierRights(this.stores.session)
  }

  patch(values) {
    this.filters = { ...this.filters, ...values }
  }
  setQuery(q) {
    this.patch({ q })
  }
  setTypeFilter(typeFilter) {
    this.patch({ typeFilter })
  }
  setModelClassFilter(modelClassFilter) {
    this.patch({ modelClassFilter })
  }
  setUaSanctionsStatusFilter(uaSanctionsStatusFilter) {
    this.patch({ uaSanctionsStatusFilter })
  }
  setMatchedPassFilter(matchedPassFilter) {
    this.patch({ matchedPassFilter })
  }
  setOriginFilter(originFilter) {
    this.patch({ originFilter })
  }
  /** Повторний клік на активне значення — вимикає фільтр. */
  setTicketStatusFilter(status) {
    this.patch({ ticketStatusFilter: this.filters.ticketStatusFilter === status ? null : status })
  }
  setExpiringWithinDays(days) {
    this.patch({ expiringWithinDays: this.filters.expiringWithinDays === days ? null : days })
  }
  toggleReviewOnly() {
    this.patch({ reviewOnly: !this.filters.reviewOnly })
  }
  toggleConflictOnly() {
    this.patch({ conflictOnly: !this.filters.conflictOnly })
  }
  toggleHasAvatar() {
    this.patch({ hasAvatar: this.filters.hasAvatar ? undefined : true })
  }
  setConnectionsCountMin(connectionsCountMin) {
    this.patch({ connectionsCountMin })
  }
  setConnectionsCountMax(connectionsCountMax) {
    this.patch({ connectionsCountMax })
  }
  setSort(sort) {
    this.patch({ sort })
  }
  toggleDirection() {
    this.patch({ direction: this.filters.direction === 'asc' ? 'desc' : 'asc' })
  }
  resetFilters() {
    this.filters = DEFAULT_FILTERS
  }

  /** Вибір профілю: ?view= пише View (router), тут — стан і "останній відкритий". */
  select(id) {
    this.activeId = id || null
    writeStored(`${STORAGE}-lastProfile`, id || null)
  }
  setShowOrphans(value) {
    this.showOrphans = typeof value === 'function' ? value(this.showOrphans) : value
    writeStored(`${STORAGE}-showOrphans`, this.showOrphans)
  }
}

const COMPACT_KEY = 'sanction-profiles-compact'
const PAGE_SIZE_KEY = 'sanction-profiles-page-size'

/** Майстер-список профілів (нескінченний), компактний режим, розмір сторінки. */
export class ProfilesListViewModel {
  isCompact
  pageSize
  refreshingId = null
  // Фільтри — проп компонента; View синхронізує їх сюди (setFilters у effect).
  filters

  constructor({ scope, stores, filters, readCompact, readPageSize }) {
    this.scope = scope
    this.stores = stores
    this.filters = filters
    this.isCompact = readCompact()
    this.pageSize = readPageSize()
    makeViewModel(this, { filters: observable.ref })

    this.optionsQuery = scope.query(DOSSIER_QUERIES.options)
    this.listQuery = scope.infiniteQuery({
      ...profilesInfiniteQuery(() => profileListParams(this.filters, this.pageSize)),
      placeholderData: keepPreviousData,
    })
    // Перерахунок стану з рядка списку (id — у змінних, тому не profileCommands(id)).
    this.refreshCmd = createCommand(scope, {
      mutationFn: (profileId) => refreshProfileStatus(profileId),
      invalidate: () => [['sanction-profiles']],
      success: 'Стан підсанкційності перераховано',
      error: false,
      onErrorMessage: (error) => error?.response?.data?.message ?? 'Не вдалося оновити стан підсанкційності',
    })
    const stops = [
      reaction(() => this.isCompact, (value) => writeStored(COMPACT_KEY, value)),
      reaction(() => this.pageSize, (value) => writeStored(PAGE_SIZE_KEY, value)),
    ]
    scope.signal.addEventListener('abort', () => stops.forEach((stop) => stop()), { once: true })
  }

  get options() {
    return this.optionsQuery.data
  }
  get pages() {
    return this.listQuery.data?.pages ?? []
  }
  profiles(excludeId) {
    const loaded = this.pages.flatMap((page) => page.data ?? [])
    return excludeId ? loaded.filter((profile) => profile.id !== excludeId) : loaded
  }
  get total() {
    return this.pages[0]?.meta?.total ?? 0
  }

  setFilters(filters) {
    this.filters = filters
  }
  setIsCompact(value) {
    this.isCompact = typeof value === 'function' ? value(this.isCompact) : value
  }
  setPageSize(value) {
    this.pageSize = value
  }
  async refreshStatus(profileId) {
    this.refreshingId = profileId
    try {
      await this.refreshCmd.run(profileId)
    } catch {
      // тост уже показано
    } finally {
      this.refreshingId = null
    }
  }
}

const connectionStorageKey = (profileId) => `sanction-profile-${profileId}-connection`

/** Картка профілю: дані, зв'язки, дії над профілем і зв'язками, модалки. */
export class ProfileDetailViewModel {
  showDuplicates = false
  isAddConnectionOpen = false
  isEditProfileOpen = false
  unlinkTarget = null
  voidTarget = null
  showDeleteConfirm = false
  showAvatarDeleteConfirm = false
  showAuditModal = false
  activeTab = 'connections'
  selectedConnectionId = null

  constructor({ scope, stores, profileId, isProfileRelation }) {
    this.scope = scope
    this.stores = stores
    this.profileId = profileId
    this.isProfileRelation = isProfileRelation
    makeViewModel(this, { profileId: false, isProfileRelation: false, unlinkTarget: observable.ref, voidTarget: observable.ref })

    this.optionsQuery = scope.query(DOSSIER_QUERIES.options)
    this.profileQuery = scope.query({
      ...DOSSIER_QUERIES.profile(profileId),
      options: () => ({ enabled: Boolean(profileId) }),
    })
    this.connections = createCommands(scope, connectionCommands(profileId))
    this.profileCmd = createCommands(scope, profileCommands(profileId))

    // Обраний зв'язок: збережений для цього профілю або перший (не profile↔profile).
    const stop = reaction(
      () => this.profile,
      (profile) => {
        if (!profileId) {
          this.selectedConnectionId = null
          return
        }
        if (this.selectedConnectionId != null) return
        const stored = readStored(connectionStorageKey(profileId))
        if (stored) {
          this.selectedConnectionId = Number(stored)
          return
        }
        const first = (profile?.connections ?? []).find((c) => !this.isProfileRelation(c))
        this.selectedConnectionId = first ? first.id : null
      },
      { fireImmediately: true },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  get profile() {
    return this.profileQuery.data
  }
  get isFetching() {
    return this.profileQuery.isFetching
  }
  get isError() {
    return this.profileQuery.isError
  }
  get options() {
    return this.optionsQuery.data
  }

  selectConnection(id) {
    this.selectedConnectionId = id
    if (this.profileId) writeStored(connectionStorageKey(this.profileId), id || null)
  }
  copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?view=${this.profileId}`
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success('Посилання скопійовано'))
      .catch(() => toast.error('Не вдалося скопіювати посилання'))
  }

  /** Назва й примітка — окремими PATCH; модалка закривається, коли обидва успішні. */
  async saveProfile({ caption, note }) {
    const profile = this.profile
    const tasks = []
    if (caption !== (profile?.view_caption ?? '')) tasks.push(this.profileCmd.updateCaption.run(caption))
    if (note !== (profile?.note ?? '')) tasks.push(this.profileCmd.updateNote.run(note))
    try {
      await Promise.all(tasks)
      this.isEditProfileOpen = false
    } catch {
      // помилку вже показано тостом / біля поля
    }
  }

  set(field, value) {
    this[field] = typeof value === 'function' ? value(this[field]) : value
  }
}

/** Пов'язані профілі (profile↔profile). */
export class RelatedProfilesViewModel {
  unlinkTarget = null
  showAddRelation = false

  constructor({ scope, profileId }) {
    this.scope = scope
    makeViewModel(this, { unlinkTarget: observable.ref })
    this.cmd = createCommands(scope, relationCommands(profileId))
  }
  setUnlinkTarget(value) {
    this.unlinkTarget = value
  }
  setShowAddRelation(value) {
    this.showAddRelation = value
  }
}

/** Пошук кандидатів-дублікатів за джерелом і прив'язка. */
export class DuplicatesViewModel {
  searchedSource = null

  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this, { searchedSource: observable.ref })
    this.searchCmd = createCommand(scope, duplicatesSearchCommand)
    this.linkCmd = createCommand(scope, {
      mutationFn: ({ profileId }) => linkConnection(profileId, this.searchedSource),
      invalidate: ({ profileId }) => [['sanction-profiles'], sanctionProfileKeys.detail(profileId)],
      success: "Джерело прив'язано до профілю-кандидата",
      error: "Не вдалося прив'язати джерело",
    })
  }
  get candidates() {
    return this.searchCmd.data ?? []
  }
  /** Заморожує джерело пошуку: "Прив'язати" бере саме його, а не відредаговані поля. */
  search(source) {
    this.searchedSource = source
    this.searchCmd.fire(source)
  }
}

/** Пошук джерела для нового зв'язку (дебаунс 300 мс у View). */
export class SourceSearchViewModel {
  modelClass
  debouncedQuery = ''

  constructor({ scope, initialModelClass }) {
    this.scope = scope
    this.modelClass = initialModelClass
    makeViewModel(this)
    this.query = scope.query({
      queryKey: () => sanctionConnectionKeys.sourceSearch(this.modelClass, this.debouncedQuery),
      queryFn: () => searchSources(Number(this.modelClass), this.debouncedQuery),
      options: () => ({ enabled: this.debouncedQuery.length >= 2 }),
    })
  }
  get results() {
    return this.query.data ?? []
  }
  get isFetching() {
    return this.query.isFetching
  }
  setModelClass(value) {
    this.modelClass = value
  }
  setDebouncedQuery(value) {
    this.debouncedQuery = value
  }
}

/** Автокомпліт профілю (зв'язок profile↔profile). */
export class ProfileAutocompleteViewModel {
  term = ''

  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query({
      queryKey: () => ['sanction-profiles-autocomplete', this.term],
      queryFn: () => fetchProfiles({ q: this.term, limit: 10 }),
      options: () => ({ enabled: this.term.length >= 2 }),
    })
  }
  setTerm(value) {
    this.term = value
  }
}

/** Деталі джерела зв'язку (fetcher залежить від типу джерела; enabled — коли треба). */
export class SourceDetailsViewModel {
  enabled

  constructor({ scope, modelClass, modelId, fetcher, enabled = true }) {
    this.scope = scope
    this.enabled = enabled
    makeViewModel(this)
    this.query = scope.query({
      queryKey: sanctionConnectionKeys.sourceDetails(modelClass, modelId),
      queryFn: () => fetcher(modelId),
      options: () => ({ enabled: Boolean(fetcher) && this.enabled }),
    })
  }
  setEnabled(value) {
    this.enabled = value
  }
}

/** Історія змін профілю (аудит). */
export class DossierAuditViewModel {
  page = 1

  constructor({ scope, profileId }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query({
      queryKey: () => ['dossier-audit', profileId, this.page],
      queryFn: () => fetchProfileAuditHistory(profileId, this.page, 50),
    })
  }
  setPage(value) {
    this.page = typeof value === 'function' ? value(this.page) : value
  }
}

const ORPHANS_PAGE_SIZE_KEY = 'orphan-projects-page-size'

/** Панель "Список сирот": фільтри, нескінченний список, прив'язка/створення досьє. */
export class OrphansViewModel {
  q = ''
  subjectTypeIds = []
  stateIds = []
  pageSize
  showBulkConfirm = false

  constructor({ scope, readPageSize }) {
    this.scope = scope
    this.pageSize = readPageSize()
    makeViewModel(this, { subjectTypeIds: observable.ref, stateIds: observable.ref })
    this.optionsQuery = scope.query(DOSSIER_QUERIES.options)
    this.listQuery = scope.infiniteQuery({
      ...orphansInfiniteQuery(() => ({ q: this.q, subjectTypeIds: this.subjectTypeIds, stateIds: this.stateIds, limit: this.pageSize })),
      placeholderData: keepPreviousData,
    })
    this.cmd = createCommands(scope, ORPHAN_COMMANDS)
    const stop = reaction(() => this.pageSize, (value) => writeStored(ORPHANS_PAGE_SIZE_KEY, value))
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  get options() {
    return this.optionsQuery.data
  }
  get orphans() {
    return (this.listQuery.data?.pages ?? []).flatMap((page) => page.data ?? [])
  }
  get total() {
    return this.listQuery.data?.pages?.[0]?.meta?.total ?? 0
  }
  setQ(value) {
    this.q = value
  }
  setSubjectTypeIds(value) {
    this.subjectTypeIds = value
  }
  setStateIds(value) {
    this.stateIds = value
  }
  setPageSize(value) {
    this.pageSize = value
  }
  setShowBulkConfirm(value) {
    this.showBulkConfirm = value
  }
  /** Пакетне створення: окремий тост про невдалі (частковий успіх). */
  async bulkCreate(projectIds) {
    try {
      const { errors } = await this.cmd.bulkCreate.run(projectIds)
      if (errors?.length > 0) toast.error(`Не вдалося створити: ${errors.length}`)
    } catch {
      // тост уже показано
    }
  }
}

// ============================================================================
// Тікети
// ============================================================================

/** Тікети однієї сутності (кнопка тікетів, модалка тікета); enabled — коли потрібні. */
export class TicketsButtonViewModel {
  openTicketId = null
  creating = false
  draftPending

  constructor({ scope, entityType, entityId, enabled = () => true }) {
    this.scope = scope
    this.entityType = entityType
    this.entityId = entityId
    this.draftPending = hasDraft(entityType, entityId)
    makeViewModel(this, { entityType: false, entityId: false })
    this.query = scope.query({
      ...DOSSIER_QUERIES.tickets(entityType, entityId),
      options: () => ({ enabled: enabled() && Boolean(entityType) && Boolean(entityId) }),
    })
  }
  get isFetching() {
    return this.query.isFetching
  }
  invalidate() {
    return this.scope.invalidate(dossierTicketKeys.list(this.entityType, this.entityId))
  }
  get tickets() {
    return this.query.data ?? []
  }
  setOpenTicketId(value) {
    this.openTicketId = value
  }
  /** Після закриття форми — чи лишилась чернетка (draftStorage). */
  setCreating(value) {
    this.creating = value
    if (!value) this.draftPending = hasDraft(this.entityType, this.entityId)
  }
}

/** Картка тікета: вирішення, додавання/вилучення прив'язок. */
export class TicketBodyViewModel {
  resolving = false
  resolutionNote = ''

  constructor({ scope, ticketId, onChanged }) {
    this.scope = scope
    this.onChanged = onChanged
    makeViewModel(this, { onChanged: false })
    this.cmd = createCommands(scope, singleTicketCommands(ticketId))
  }
  setResolving(value) {
    this.resolving = value
  }
  setResolutionNote(value) {
    this.resolutionNote = value
  }
  async resolve(note) {
    try {
      await this.cmd.resolve.run(note)
      this.resolving = false
      this.resolutionNote = ''
      this.onChanged?.()
    } catch {
      // тост уже показано
    }
  }
  async addLink(link) {
    try {
      await this.cmd.addLink.run(link)
      this.onChanged?.()
    } catch {
      // тост уже показано
    }
  }
  async removeLink(link) {
    try {
      await this.cmd.removeLink.run(link)
      this.onChanged?.()
    } catch {
      // тост уже показано
    }
  }
}

/** Нова форма тікета: чернетка (draftStorage) + прев'ю додаткових прив'язок. */
export class CreateTicketViewModel {
  text = ''
  extraLinks = []
  linkPreview = []

  constructor({ scope, entityType, entityId }) {
    this.scope = scope
    this.entityType = entityType
    this.entityId = entityId
    const draft = readDraft(entityType, entityId)
    this.text = draft?.text ?? ''
    this.extraLinks = Array.isArray(draft?.extraLinks) ? draft.extraLinks : []
    makeViewModel(this, { entityType: false, entityId: false, extraLinks: observable.ref, linkPreview: observable.ref })
    this.cmd = createCommands(scope, ticketCommands(entityType, entityId))
  }

  /** Чернетка — на кожну зміну; прев'ю прив'язок — з дебаунсом 400 мс. */
  mount() {
    const stopDraft = reaction(
      () => [this.text, this.extraLinks],
      ([text, extraLinks]) => writeDraft(this.entityType, this.entityId, { text, extraLinks }),
    )
    let timer
    const stopPreview = reaction(
      () => this.extraLinks,
      (links) => {
        clearTimeout(timer)
        if (links.length === 0) {
          this.setLinkPreview([])
          return
        }
        timer = setTimeout(() => {
          fetchLinksPreview(links).then(this.setLinkPreview).catch(() => this.setLinkPreview([]))
        }, 400)
      },
      { fireImmediately: true },
    )
    return () => {
      stopDraft()
      stopPreview()
      clearTimeout(timer)
    }
  }

  setText(value) {
    this.text = value
  }
  setLinkPreview(value) {
    this.linkPreview = value
  }
  addLink(link, linkKey) {
    if (!this.extraLinks.some((l) => linkKey(l) === linkKey(link))) this.extraLinks = [...this.extraLinks, link]
  }
  removeLink(link, linkKey) {
    this.extraLinks = this.extraLinks.filter((l) => linkKey(l) !== linkKey(link))
  }
  async submit(onCreated, onClose) {
    if (!this.text.trim()) return
    try {
      const ticket = await this.cmd.create.run({ text: this.text.trim(), extraLinks: this.extraLinks })
      this.text = ''
      this.extraLinks = []
      this.linkPreview = []
      clearDraft(this.entityType, this.entityId)
      onCreated?.(ticket)
      onClose()
    } catch {
      // тост уже показано
    }
  }
}

const TICKET_FILTERS = { states: [], entityType: null, authorIds: [] }

/** /dossier/tickets — усі тікети модуля з фільтрами й сторінками. */
export class TicketsPageViewModel {
  filters = TICKET_FILTERS
  page = 1
  selectedId = null

  constructor({ scope, stores, initialFilters = TICKET_FILTERS }) {
    this.scope = scope
    this.stores = stores
    this.filters = initialFilters
    makeViewModel(this, { filters: observable.ref })
    this.optionsQuery = scope.query(DOSSIER_QUERIES.ticketOptions)
    this.listQuery = scope.query({
      queryKey: () => ['dossier-tickets-all', this.filters, this.page],
      queryFn: () =>
        fetchAllTickets({
          state: this.filters.states,
          entityType: this.filters.entityType,
          authorIds: this.filters.authorIds,
          page: this.page,
          perPage: 50,
        }),
    })
  }

  get rights() {
    return dossierRights(this.stores.session)
  }
  get options() {
    return this.optionsQuery.data
  }
  get tickets() {
    return this.listQuery.data?.data ?? []
  }
  get meta() {
    return this.listQuery.data?.meta
  }
  get isFetching() {
    return this.listQuery.isFetching
  }
  get selectedTicket() {
    return this.tickets.find((t) => t.id === this.selectedId) ?? null
  }
  get hasActive() {
    return Boolean(this.filters.states.length || this.filters.entityType || this.filters.authorIds.length)
  }
  setFilters(value) {
    this.filters = typeof value === 'function' ? value(this.filters) : value
  }
  setPage(value) {
    this.page = typeof value === 'function' ? value(this.page) : value
  }
  setSelectedId(value) {
    this.selectedId = value
  }
  clearFilters() {
    this.filters = TICKET_FILTERS
    this.page = 1
  }
  invalidateAll() {
    return this.scope.invalidate(['dossier-tickets-all'])
  }
}
