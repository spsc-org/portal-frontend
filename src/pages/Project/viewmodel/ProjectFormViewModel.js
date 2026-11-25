import { observable, reaction } from 'mobx'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { deepEqual, threeWayMerge } from '../shared/lib/threeWayMerge.js'
import { PROJECT_MERGE_OPTIONS, applyConflictChoice, fieldLabelForPath } from '../shared/lib/projectSnapshot.js'
import {
  createDraftAutosaver,
  deleteDraft,
  draftKeyForNew,
  draftKeyForProject,
  DRAFT_SCHEMA_VERSION,
  getDraft,
  listDrafts,
  purgeOlderThan,
} from '../shared/lib/drafts.js'
import { PROJECT_KEYS, downloadProjectAttachment } from '../model/projectModel.js'
import { ANALYSED_FIELDS, analyzeFormPayload } from '../model/liveAnalysisModel.js'
import { LiveAnalysisState } from './LiveAnalysisState.js'
import { ConsolidatedSearchState } from './ConsolidatedSearchState.js'
import {
  FORM_RESTRICTION_KEYS,
  UKRAINE_ID,
  VESSEL_SUBJECT_TYPE_ID,
  announceEditingProject,
  applyVesselDefaults,
  attributeTypeOptions,
  buildPayload,
  canonicalSnapshot,
  defaultIdentifierRows,
  deleteProjectAttachment,
  draftsEnabled,
  emptyAttribute,
  emptyDocument,
  emptyForm,
  emptyIdentifier,
  fetchProjectForForm,
  formFromSnapshot,
  formLayout,
  identifierTypeOptions,
  includedRowKeys,
  isEmptyAttributeRow,
  isEmptyIdentifierRow,
  lookupUnitByRegnum,
  parseValidation,
  readProjectSettings,
  rememberHints,
  rememberLastAdd,
  restrictionColors,
  saveProject,
  updateAttachmentComment,
  uploadProjectAttachment,
  ACTION_TYPES,
} from '../model/projectFormModel.js'

const NAME_FIELDS = ['nameUk', 'nameRu', 'nameEn']
const NO_ERRORS = { fields: {}, rows: { identifiers: {}, attributes: {}, documents: {} }, general: [] }
const NONE = []
const ROW_FACTORIES = { identifiers: emptyIdentifier, attributes: emptyAttribute, documents: emptyDocument }
const REGNUM_DEBOUNCE_MS = 400
const USER_ID_FIELDS = ['updatedUserId', 'createdUserId', 'performerId', 'validatorId']

const asList = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}))
const byIds = (options, ids) => {
  const set = new Set((ids ?? []).map(Number))
  return options.filter((option) => set.has(Number(option.id)))
}

/**
 * Модалка створення/редагування проєкту (порт legacy ProjectModalManagerV2, #modalProjectV2).
 *
 * Стан форми — `form`: канонічний legacy-знімок (GET /api/project/{id}) + `_key` у рядках таблиць,
 * тож злиття конфлікту версій (threeWayMerge), чернетки (IndexedDB) і "є незбережені дані"
 * працюють напряму зі станом, без DOM-адаптерів. Створення — POST /api/project/json,
 * редагування — PATCH /api/project/json/{id} (optimistic concurrency за version, 409 → злиття).
 *
 * Живий аналіз — POST /api/project/json/{id|0}/liveAnalysis з payload форми (повний при відкритті
 * редагування і за кнопкою, по полю — після втрати фокусу). Ще не перенесено: пошук у консолідованій базі,
 * словникові модалки (ідентифікатор/атрибут/категорія).
 */
export class ProjectFormViewModel {
  mode = null // 'add' | 'edit' | null
  projectId = null
  form = null
  base = null // канонічний знімок останньої відомої серверної версії (або чистої форми створення)
  loading = false
  saving = false
  errors = NO_ERRORS
  showIgnore = false
  force = false
  conflicts = NONE // [{ path, base, theirs, mine }]
  merged = null // робочий злитий знімок, поки є невирішені конфлікти
  notice = null // { message, labels } — злиття без конфліктів
  attachments = NONE
  attachmentType = 'file'
  uploadOpen = false
  uploading = false
  reasoningMax = false
  draftOffer = null // { updatedAt, values }
  unitLookups = {} // rowKey → true, поки шукаємо підрозділ за рег. номером
  settings = readProjectSettings()

  constructor({ scope, page }) {
    this.scope = scope
    this.page = page
    // Тип дії/суб'єкта нового проєкту пам'ятається між відкриттями (legacy sessionVariables)
    this.lastTypes = { actionType: 1, subjectTypeId: 1 }
    this.autosaver = null
    this.draftKey = null
    this.clientUuid = null
    this.timers = {}
    this.analysis = new LiveAnalysisState()
    this.consolidated = new ConsolidatedSearchState({ excludeProjectId: () => (this.isEdit ? this.projectId : null) })
    makeViewModel(this, {
      page: false,
      analysis: false,
      consolidated: false,
      lastTypes: false,
      autosaver: false,
      draftKey: false,
      clientUuid: false,
      timers: false,
      form: observable.ref,
      base: observable.ref,
      errors: observable.ref,
      conflicts: observable.ref,
      merged: observable.ref,
      notice: observable.ref,
      attachments: observable.ref,
      draftOffer: observable.ref,
      unitLookups: observable.ref,
      settings: observable.ref,
    })
    purgeOlderThan(30)

    const stop = reaction(
      () => (this.isOpen && this.form ? this.snapshot : null),
      (snapshot) => snapshot && this.onSnapshotChanged(snapshot),
    )
    scope.signal.addEventListener('abort', () => {
      stop()
      Object.values(this.timers).forEach(clearTimeout)
      this.autosaver?.cancel()
    }, { once: true })
  }

  mount() {
    // Незбережені дані → нативний промпт браузера; сховали вкладку — дописуємо чернетку
    const onBeforeUnload = (event) => {
      if (!this.isOpen || !this.dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    const flush = () => this.autosaver?.flush()
    const onVisibility = () => document.visibilityState === 'hidden' && flush()
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      if (this.mode === 'edit') announceEditingProject(null)
    }
  }

  // ---- похідні ----
  get isOpen() {
    return this.mode != null
  }
  get isEdit() {
    return this.mode === 'edit'
  }
  get voc() {
    return this.page.voc ?? {}
  }
  get userId() {
    return this.page.userId
  }
  get snapshot() {
    return canonicalSnapshot(this.form ?? {})
  }
  get dirty() {
    return Boolean(this.form && this.base) && !deepEqual(this.snapshot, this.base)
  }
  get layout() {
    return formLayout(this.form?.actionType, this.form?.subjectTypeId)
  }
  get caption() {
    const action = ACTION_TYPES.find((item) => item.id === this.form?.actionType)
    return { prefix: this.isEdit ? 'Редагування' : 'Створення', action }
  }
  get countries() {
    return (this.form?.country ?? NONE).map(Number)
  }
  get hasUkrainian() {
    return (this.form?.citizen ?? NONE).map(Number).includes(UKRAINE_ID)
  }
  get restrictionColors() {
    return restrictionColors(this.voc, this.form?.subjectTypeId, this.hasUkrainian ? ['UA'] : NONE)
  }
  get coEditors() {
    if (!this.isEdit) return NONE
    const me = Number(this.userId)
    return asList(this.page.presenceUsers).filter((user) => Number(user?.editing_project_id) === Number(this.projectId) && Number(user.id) !== me)
  }
  get canSubmit() {
    return !this.saving && !this.loading && this.conflicts.length === 0
  }

  // опції селектів (словники /api/voc_project)
  get options() {
    const voc = this.voc
    const decreeTime = (decree) => Date.parse(decree?.date) || 0
    const decrees = asList(voc.decree)
      .slice()
      .sort((a, b) => decreeTime(b) - decreeTime(a) || Number(b.id) - Number(a.id))
      .map((decree) => ({ id: decree.id, caption: decree.caption ?? decree.code ?? `Указ #${decree.id}` }))
    return {
      country: asList(voc.country).map((item) => ({ id: item.id, caption: item.caption })),
      state: asList(voc.state).map((item) => ({ id: item.id, caption: item.deletedAt ? `${item.caption} (НЕ ВИКОРИСТОВУЄМО)` : item.caption })),
      user: asList(voc.user).map((item) => ({ id: item.id, caption: item.caption })),
      term: asList(voc.term).map((item) => ({ id: item.id, caption: item.caption })),
      issuer: asList(voc.issuer).map((item) => ({ id: item.id, caption: item.caption })),
      reason: asList(voc.reason).map((item) => ({ id: item.id, caption: item.caption })),
      category1: asList(voc.category1),
      category2: asList(voc.category2),
      category3: asList(voc.category3),
      proposal: asList(voc.proposal).map((item) => ({ id: item.id, caption: `${[3, 4, 5].includes(item.stateId) ? '# ' : ''}${item.caption}` })),
      decree: decrees,
      documentType: asList(voc.documentType),
      initiator: asList(voc.initiator),
    }
  }
  /** Вибрані значення мультиселектів як опції react-select. */
  selected(field, optionsKey = field) {
    return byIds(this.options[optionsKey] ?? NONE, this.form?.[field])
  }
  get rowCountryOptions() {
    const names = this.voc._country ?? {}
    return this.countries.map((id) => ({ id, caption: names[id] ?? String(id) }))
  }
  get identifierTypes() {
    return identifierTypeOptions(this.voc, this.form?.subjectTypeId, this.countries)
  }
  get attributeTypes() {
    return attributeTypeOptions(this.voc, this.form?.subjectTypeId)
  }

  /** Швидкі підказки — останні значення з попередніх збережень (legacy loadHints). */
  get hints() {
    const values = this.settings.hintValues ?? {}
    const voc = this.voc
    const make = (key, vocName) =>
      (values[key] ?? NONE)
        .map((id) => {
          const item = voc[vocName]?.[id]
          const caption = typeof item === 'string' ? item : item?.caption
          return caption ? { id: Number(id), caption, short: caption.length > 8 ? `${caption.slice(0, 8)}...` : caption } : null
        })
        .filter(Boolean)
    return {
      country: make('country', '_country'),
      category1: make('cat1', '_category1'),
      category2: make('cat2', '_category2'),
      category3: make('cat3', '_category3'),
      proposal: make('proposal', '_proposal'),
      performerId: make('performer', '_user'),
      validatorId: make('validator', '_user'),
      stateId: make('state', '_state'),
      restrictions: (values.restrictions ?? NONE).length > 0,
    }
  }

  fieldError(name) {
    return this.errors.fields[name] ?? null
  }
  rowError(list, rowKey, field) {
    return this.errors.rows[list]?.[rowKey]?.[field] ?? null
  }
  get theirsLabel() {
    const id = this.base?.updatedUserId
    return (id != null && this.voc._user?.[id]) || 'Інший користувач'
  }
  formatConflictValue(path, value) {
    if (value === null || value === undefined) return null
    if (USER_ID_FIELDS.includes(path)) return this.voc._user?.[value] ?? String(value)
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }

  // ---- відкриття / закриття ----
  resetState() {
    Object.values(this.timers).forEach(clearTimeout)
    this.timers = {}
    this.autosaver?.cancel()
    this.autosaver = null
    this.errors = NO_ERRORS
    this.showIgnore = false
    this.force = false
    this.conflicts = NONE
    this.merged = null
    this.notice = null
    this.attachments = NONE
    this.uploadOpen = false
    this.reasoningMax = false
    this.draftOffer = null
    this.unitLookups = {}
    this.settings = readProjectSettings()
    this.analysis.reset()
    this.consolidated.reset()
  }

  async openAdd() {
    if (!this.page.ready) return
    this.resetState()
    this.mode = 'add'
    this.projectId = null
    this.form = emptyForm(this.lastTypes)
    this.base = this.snapshot
    this.setUrl(null)

    // Продовжуємо вже почату чернетку створення, а не губимо її новим uuid
    const existing = draftsEnabled() ? await this.findLatestNewDraft() : null
    this.clientUuid = existing?.clientUuid ?? crypto.randomUUID()
    this.draftKey = draftKeyForNew(this.userId, this.clientUuid)
    this.initAutosaver()
    await this.checkDraft()
  }

  async openEdit(id) {
    if (!this.page.ready || id == null) return
    this.resetState()
    this.mode = 'edit'
    this.projectId = Number(id)
    this.form = null
    this.base = null
    this.loading = true
    this.setUrl(this.projectId)
    try {
      const raw = await fetchProjectForForm(this.projectId)
      if (this.projectId !== Number(id)) return
      this.applyServer(raw)
      this.attachments = Array.isArray(raw.attachments) ? raw.attachments : NONE
    } catch (error) {
      toast.error(error.message || 'Не вдалося завантажити проєкт')
      this.finishClose()
      return
    } finally {
      this.setLoading(false)
    }
    this.runAnalysis()
    this.runInitialConsolidated()
    this.publishPresence(await announceEditingProject(this.projectId))
    this.draftKey = draftKeyForProject(this.userId, this.projectId)
    this.clientUuid = null
    this.initAutosaver()
    await this.checkDraft()
  }

  setLoading(value) {
    this.loading = value
  }

  /** Свіжий серверний знімок → база + форма. */
  applyServer(raw) {
    this.base = canonicalSnapshot(raw)
    this.form = formFromSnapshot(this.base)
  }

  close() {
    if (!this.isOpen) return
    if (this.dirty && !draftsEnabled() && !window.confirm('Є незбережені дані. Закрити форму без збереження?')) return
    this.autosaver?.flush()
    this.finishClose()
  }

  finishClose() {
    if (this.mode === 'edit') announceEditingProject(null).then(this.publishPresence)
    this.resetState()
    this.mode = null
    this.projectId = null
    this.form = null
    this.base = null
    this.draftKey = null
    this.setUrl(null)
  }

  /** Відповідь presence-ендпоінта — одразу всім слухачам (бейдж "Редагує"), не чекаючи ping. */
  publishPresence(users) {
    if (!users) return
    window.__presenceUsers = users
    window.dispatchEvent(new CustomEvent('user-presence-changed', { detail: users }))
  }

  /** ?edit={id} як legacy — посилання/F5 відкриває форму знову. */
  setUrl(projectId) {
    const url = new URL(window.location.href)
    if (projectId == null) url.searchParams.delete('edit')
    else url.searchParams.set('edit', projectId)
    window.history.replaceState(window.history.state, '', url)
  }

  // ---- поля ----
  setField(key, value) {
    this.analysis.markStale(key)
    if (NAME_FIELDS.includes(key)) this.consolidated.schedule(key, value)
    this.form = { ...this.form, [key]: value }
    if (this.errors.fields[key]) this.errors = { ...this.errors, fields: { ...this.errors.fields, [key]: undefined } }
  }
  setMulti(key, options) {
    this.setField(key, (options ?? NONE).map((option) => Number(option.id)))
  }
  setSelect(key, value) {
    this.setField(key, value === '' ? null : Number(value))
  }

  setActionType(id) {
    if (this.isEdit) return
    this.lastTypes = { ...this.lastTypes, actionType: id }
    this.setField('actionType', id)
  }
  /**
   * Тип суб'єкта (legacy handleSubjectTypeChange). Уся автоматика — лише при створенні:
   * якщо тип справді змінився і жоден рядок ідентифікаторів/атрибутів не заповнений користувачем
   * (лише авто-запропоновані рядки старого типу) — таблиці перекомпоновуються під новий тип
   * (типові ідентифікатори за країною, IMO/MMSI + атрибути 25/26 + підстава 7 для судна).
   */
  setSubjectType(id) {
    if (this.isEdit) {
      this.form = { ...this.form, subjectTypeId: id }
      this.syncRowOptions()
      return
    }
    const changed = this.form.subjectTypeId !== id
    this.lastTypes = { ...this.lastTypes, subjectTypeId: id }
    let { identifiers, attributes } = this.form
    if (changed) {
      if (identifiers.length > 0 && identifiers.every(isEmptyIdentifierRow)) identifiers = []
      if (attributes.length > 0 && attributes.every(isEmptyAttributeRow)) attributes = []
      const countries = this.countries
      if (identifiers.length === 0 && countries.length === 1) identifiers = defaultIdentifierRows(id, countries[0])
    }
    let form = applyVesselDefaults({ ...this.form, subjectTypeId: id, identifiers, attributes })
    // Атрибути не мають тригера від країни — повертаємо типовий порожній рядок, як при відкритті форми
    if (changed && id !== VESSEL_SUBJECT_TYPE_ID && form.attributes.length === 0) form = { ...form, attributes: [emptyAttribute()] }
    this.form = form
    this.syncRowOptions()
  }

  /** Задіяні країни → громадянство (лише серед обраних) і селекти рядків ідентифікаторів. */
  setCountries(options) {
    const ids = (options ?? NONE).map((option) => Number(option.id))
    const citizen = (this.form.citizen ?? NONE).filter((id) => ids.includes(Number(id)))
    let identifiers = this.form.identifiers
    // Перша країна в порожній таблиці — одразу рядки з типовими ідентифікаторами (лише особа/організація;
    // у судна свої IMO/MMSI без країни)
    if (identifiers.length === 0 && ids.length === 1) identifiers = defaultIdentifierRows(this.form.subjectTypeId, ids[0])
    this.form = { ...this.form, country: ids, citizen, identifiers }
    this.syncRowOptions()
  }

  /** "Не задано" — свідоме підтвердження відсутності ідентифікатора; вмикання очищує значення. */
  setIdentifierNotSpecified(rowKey, checked) {
    this.updateRow('identifiers', rowKey, checked ? { notSpecified: true, identifierValue: '' } : { notSpecified: false })
  }

  /** Значення рядків, яких більше немає серед опцій (тип суб'єкта/країни змінились), скидаємо. */
  syncRowOptions() {
    const countries = this.countries
    const identifierIds = new Set(this.identifierTypes.map((item) => Number(item.id)))
    const attributeIds = new Set(this.attributeTypes.map((item) => Number(item.id)))
    const identifiers = this.form.identifiers.map((row) => {
      const countryOk = row.identifierCountryId === '' || row.identifierCountryId == null || countries.includes(Number(row.identifierCountryId))
      const typeOk = row.identifierId === '' || row.identifierId == null || identifierIds.has(Number(row.identifierId))
      return countryOk && typeOk ? row : { ...row, identifierCountryId: countryOk ? row.identifierCountryId : '', identifierId: typeOk ? row.identifierId : '' }
    })
    const attributes = this.form.attributes.map((row) =>
      row.attributeId === '' || row.attributeId == null || attributeIds.has(Number(row.attributeId)) ? row : { ...row, attributeId: '' },
    )
    this.form = { ...this.form, identifiers, attributes }
  }

  toggleCitizen(id) {
    const citizen = this.form.citizen ?? NONE
    this.setField('citizen', citizen.includes(id) ? citizen.filter((item) => item !== id) : [...citizen, id])
    if (this.errors.fields.citizen) this.errors = { ...this.errors, fields: { ...this.errors.fields, citizen: undefined } }
  }

  // обмеження
  toggleRestriction(key) {
    this.setField(key, !this.form[key])
  }
  setAllRestrictions(checked) {
    const patch = Object.fromEntries(FORM_RESTRICTION_KEYS.map((key) => [key, checked]))
    this.form = { ...this.form, ...patch }
  }
  setGreenRestrictions(checked) {
    const colors = this.restrictionColors
    const patch = Object.fromEntries(FORM_RESTRICTION_KEYS.filter((key) => colors[key]?.color === 'green').map((key) => [key, checked]))
    this.form = { ...this.form, ...patch }
  }
  applyRestrictionHint() {
    const previous = new Set(this.settings.hintValues?.restrictions ?? NONE)
    this.form = { ...this.form, ...Object.fromEntries(FORM_RESTRICTION_KEYS.map((key) => [key, previous.has(key)])) }
  }

  /** Клік по підказці: мультиселект — додати на початок, селект — встановити. */
  applyHint(field, id) {
    if (field === 'country') {
      this.setCountries([{ id }, ...this.countries.filter((item) => item !== id).map((item) => ({ id: item }))])
      return
    }
    const current = this.form[field]
    if (Array.isArray(current)) this.setField(field, [id, ...current.filter((item) => Number(item) !== id)])
    else this.setField(field, id)
  }

  // таблиці
  addRow(list) {
    this.form = { ...this.form, [list]: [...this.form[list], ROW_FACTORIES[list]()] }
  }
  removeRow(list, rowKey) {
    // прибрали збережений ідентифікатор — переаналізувати решту (legacy MutationObserver)
    const removed = this.form[list].find((row) => row._key === rowKey)
    if (list === 'identifiers' && removed?.id && this.isEdit) this.scheduleAnalysis('identifier')
    if (list === 'identifiers' && removed) this.consolidated.remove(this.consolidatedKey(removed))
    this.form = { ...this.form, [list]: this.form[list].filter((row) => row._key !== rowKey) }
  }
  updateRow(list, rowKey, patch) {
    this.form = { ...this.form, [list]: this.form[list].map((row) => (row._key === rowKey ? { ...row, ...patch } : row)) }
    const rowErrors = this.errors.rows[list]?.[rowKey]
    if (rowErrors) {
      const cleared = { ...rowErrors }
      for (const field of Object.keys(patch)) delete cleared[field]
      this.errors = { ...this.errors, rows: { ...this.errors.rows, [list]: { ...this.errors.rows[list], [rowKey]: cleared } } }
    }
    if (list === 'documents' && 'regNum' in patch) this.scheduleUnitLookup(rowKey, patch.regNum)
    if (list === 'identifiers' && 'identifierValue' in patch) {
      const row = this.form.identifiers.find((item) => item._key === rowKey)
      if (row) this.consolidated.schedule(this.consolidatedKey(row), patch.identifierValue)
    }
  }

  /** Рег. номер документа → підрозділ (GET /api/helper/validateNumber), з дебаунсом. */
  scheduleUnitLookup(rowKey, regNum) {
    clearTimeout(this.timers[`unit-${rowKey}`])
    const text = String(regNum ?? '').trim()
    if (!text) return
    this.timers[`unit-${rowKey}`] = setTimeout(async () => {
      this.setUnitLookup(rowKey, true)
      try {
        const result = await lookupUnitByRegnum(text)
        const row = this.form?.documents.find((item) => item._key === rowKey)
        if (row && String(row.regNum ?? '').trim() === text) this.updateRowSilently('documents', rowKey, { unitId: result.success && result.unitId != null ? result.unitId : '' })
      } catch {
        // підказка підрозділу не критична
      } finally {
        this.setUnitLookup(rowKey, false)
      }
    }, REGNUM_DEBOUNCE_MS)
  }
  setUnitLookup(rowKey, value) {
    const next = { ...this.unitLookups }
    if (value) next[rowKey] = true
    else delete next[rowKey]
    this.unitLookups = next
  }
  updateRowSilently(list, rowKey, patch) {
    if (!this.form) return
    this.form = { ...this.form, [list]: this.form[list].map((row) => (row._key === rowKey ? { ...row, ...patch } : row)) }
  }

  toggleReasoningMax() {
    this.reasoningMax = !this.reasoningMax
  }
  setForce(value) {
    this.force = value
  }

  /**
   * "Заповнити останніми даними": проєкт, збережений останнім для цієї пари (дія, тип суб'єкта) —
   * термін, категорії, пакети, виконавець, стан, указ, fix, обґрунтування, обмеження, документи.
   */
  async pasteLast() {
    const { actionType, subjectTypeId } = this.form
    const lastId = this.settings.lastAdds?.[actionType]?.[subjectTypeId]
    if (lastId == null) {
      toast.error("Для даної дії та типу суб'єкта в буфері немає інформації")
      return
    }
    try {
      const last = canonicalSnapshot(await fetchProjectForForm(lastId))
      const restrictions = Object.fromEntries(FORM_RESTRICTION_KEYS.map((key) => [key, last[key]]))
      const fresh = emptyForm({ actionType: last.actionType, subjectTypeId: last.subjectTypeId })
      this.form = {
        ...fresh,
        ...restrictions,
        id: this.form.id,
        version: this.form.version,
        updatedAt: this.form.updatedAt,
        termId: last.termId,
        category1: last.category1,
        category2: last.category2,
        category3: last.category3,
        proposal: last.proposal,
        performerId: last.performerId,
        stateId: last.stateId,
        decreeId: last.decreeId,
        fix_action_id: last.fix_action_id ?? '',
        fix_decree: last.fix_decree ?? '',
        fix_annex: last.fix_annex,
        fix_index: last.fix_index,
        reasoning: last.reasoning ?? '',
        r25: last.r25 ?? '',
        r6Text: last.r6Text ?? '',
        documents: formFromSnapshot(last).documents,
      }
    } catch (error) {
      toast.error(error.message || 'Не вдалося завантажити останній проєкт')
    }
  }

  // ---- живий аналіз ----
  /**
   * fields = null — повний аналіз (лише редагування); [field] — одне поле (і при створенні, projectId 0).
   * Аналізується поточний стан форми, а не збережений проєкт.
   */
  async runAnalysis(fields = null) {
    if (!this.form || (fields === null && !this.isEdit)) return
    if (fields === null) clearTimeout(this.timers.analysis) // повний аналіз покриває заплановані по полях
    const list = fields ?? ANALYSED_FIELDS
    const rowKeys = includedRowKeys(this.form)
    const payload = buildPayload(this.snapshot, { userId: this.userId, attachmentIds: this.attachments.map((item) => item.id).filter(Boolean) })
    const requestId = this.analysis.begin(list)
    try {
      const data = await analyzeFormPayload(this.isEdit ? this.projectId : 0, payload, list)
      this.analysis.apply(requestId, data, list, { identifier: rowKeys.identifiers, attribute: rowKeys.attributes })
    } catch {
      this.analysis.fail(requestId, list)
    }
  }
  /** Втрата фокусу поля, що аналізується → аналіз цього поля через 800 мс (legacy _attachAnalysisOnBlur). */
  scheduleAnalysis(field) {
    if (!ANALYSED_FIELDS.includes(field) || !this.isOpen) return
    clearTimeout(this.timers.analysis)
    this.timers.analysis = setTimeout(() => this.runAnalysis([field]), 800)
  }
  /** Ключ значка рядка: id збереженого або tmp-{_key} нового (як у відповіді аналізу). */
  rowAnalysisId(row) {
    return row.id ? Number(row.id) : `tmp-${row._key}`
  }

  // ---- консолідований пошук ----
  /** Ключ збігів рядка ідентифікатора (legacy identifier-{dbId} / identifier-tmp-{n}). */
  consolidatedKey(row) {
    return `identifier-${this.rowAnalysisId(row)}`
  }
  /** Відкриття редагування: пошук по непорожніх назвах і збережених ідентифікаторах. */
  runInitialConsolidated() {
    for (const key of NAME_FIELDS) this.consolidated.search(key, String(this.form?.[key] ?? '').trim())
    for (const row of this.form?.identifiers ?? []) {
      const value = String(row.identifierValue ?? '').trim()
      if (row.id && value.length >= 2) this.consolidated.search(this.consolidatedKey(row), value)
    }
  }

  // ---- збереження ----
  /**
   * Задіяна країна без позначки "Громадянство / Країна реєстрації / Прапор" мовчки не збереглась би
   * (у projectToCountry пишуться лише позначені) — без форсування блокуємо збереження, як legacy;
   * чекбокс "Ігнорувати попередження" (той самий, що для серверних soft-помилок) пропускає її.
   */
  validateCitizenship(forced = false) {
    if (!this.layout.citizen) return true
    const citizen = new Set((this.form.citizen ?? NONE).map(Number))
    const missing = this.countries.filter((id) => !citizen.has(id))
    if (missing.length === 0) return true
    const message = `Оберіть ${this.layout.citizenCaption.toLowerCase()} або приберіть його зі списку задіяних країн`
    const names = missing.map((id) => this.voc._country?.[id] ?? id).join(', ')
    if (forced) {
      toast(`${message} (збережено форсовано): ${names}`, { icon: '⚠️' })
      return true
    }
    this.errors = { ...NO_ERRORS, fields: { citizen: { message, level: 'error', ids: missing } } }
    this.showIgnore = true
    toast.error(`${message}: ${names}`)
    return false
  }

  async submit(event) {
    event?.preventDefault?.()
    if (!this.canSubmit) return
    this.errors = NO_ERRORS
    if (!this.validateCitizenship(this.force)) return

    const snapshot = this.snapshot
    const rowKeys = includedRowKeys(this.form)
    const payload = buildPayload(snapshot, { userId: this.userId, attachmentIds: this.attachments.map((item) => item.id).filter(Boolean) })
    this.saving = true
    let result
    try {
      result = await saveProject({ id: this.isEdit ? this.projectId : null, payload, force: this.force })
    } catch (error) {
      result = { status: 0, body: { success: false, message: error.message || 'Помилка мережі' } }
    }
    await this.handleSaveResult(result, snapshot, rowKeys)
    this.setSaving(false)
  }
  setSaving(value) {
    this.saving = value
  }

  async handleSaveResult({ status, body }, snapshot, rowKeys) {
    if (body?.success) {
      rememberHints(snapshot)
      if (body.data?.id != null) rememberLastAdd(snapshot.actionType, snapshot.subjectTypeId, body.data.id)
      if (this.draftKey) await deleteDraft(this.draftKey)
      this.autosaver?.cancel()
      toast.success(this.isEdit ? `Проєкт #${this.projectId} збережено` : `Проєкт #${body.data?.id ?? ''} створено`)
      this.scope.invalidate(PROJECT_KEYS.all)
      this.finishClose()
      return
    }

    if (status === 409 && body?.conflict && this.isEdit) {
      this.showIgnore = false
      await this.mergeAfterConflict()
      return
    }
    if (status === 409) {
      this.showIgnore = false
      this.errors = { ...NO_ERRORS, general: [`⚠️ ${body?.message ?? 'Конфлікт збереження'}`] }
      return
    }
    this.showIgnore = true
    if (body?.messages) {
      this.errors = parseValidation(body.messages, rowKeys)
    } else {
      const icon = { 422: '📝', 500: '💥', 404: '🔍' }[status] ?? '🛑️'
      this.errors = { ...NO_ERRORS, general: [`${icon} ${body?.message ?? body?.error ?? 'Невідома помилка сервера'}`] }
    }
  }

  /**
   * 409 на PATCH — інший користувач зберіг раніше: свіжий знімок ⨝ мої зміни (threeWayMerge).
   * Ніколи не зберігає автоматично — користувач перевіряє форму і тисне "ОК" ще раз.
   */
  async mergeAfterConflict() {
    let theirsRaw
    try {
      theirsRaw = await fetchProjectForForm(this.projectId)
    } catch {
      this.errors = { ...NO_ERRORS, general: ['⚠️ Не вдалося отримати свіжу версію проєкту для злиття.'] }
      return
    }
    const theirs = canonicalSnapshot(theirsRaw)
    const result = threeWayMerge(this.base ?? theirs, theirs, this.snapshot, PROJECT_MERGE_OPTIONS)
    this.base = theirs
    this.form = formFromSnapshot(result.merged)
    if (result.conflicts.length === 0) {
      this.notice = {
        message: 'Проєкт оновився, поки ви редагували. Несуперечливі зміни об’єднано з новою версією — перевірте форму і натисніть «ОК» ще раз, щоб зберегти.',
        labels: [...new Set(result.appliedFromTheirs.map(fieldLabelForPath))],
      }
      return
    }
    this.conflicts = result.conflicts
    this.merged = result.merged
    this.errors = { ...NO_ERRORS, general: [`⚠️ Проєкт оновився, поки ви редагували. ${result.conflicts.length} конфлікт(ів) потребує вашого рішення.`] }
  }

  resolveConflict(index, choice) {
    const conflict = this.conflicts[index]
    if (!conflict || !this.merged) return
    const merged = applyConflictChoice(structuredClone(this.merged), conflict, choice)
    this.merged = merged
    this.conflicts = this.conflicts.filter((_, i) => i !== index)
    this.form = formFromSnapshot(merged)
    if (this.conflicts.length === 0) this.errors = NO_ERRORS
  }
  dismissNotice() {
    this.notice = null
  }

  /** Відкинути локальні зміни і завантажити актуальну версію з бази (лише редагування). */
  async revertToLatest() {
    if (!this.isEdit || !window.confirm('Скинути незбережені зміни та завантажити актуальну версію з бази?')) return
    try {
      const raw = await fetchProjectForForm(this.projectId)
      this.applyServer(raw)
      this.attachments = Array.isArray(raw.attachments) ? raw.attachments : this.attachments
    } catch {
      toast.error('Не вдалося завантажити актуальну версію проєкту.')
      return
    }
    this.autosaver?.cancel()
    if (this.draftKey) await deleteDraft(this.draftKey)
    this.resetMergeState()
    toast('Форму оновлено до актуальної версії проєкту.', { icon: 'ℹ️' })
  }
  resetMergeState() {
    this.conflicts = NONE
    this.merged = null
    this.notice = null
    this.errors = NO_ERRORS
    this.draftOffer = null
  }

  // ---- чернетки (IndexedDB; вмикаються в налаштуваннях сторінки) ----
  initAutosaver() {
    this.autosaver?.cancel()
    this.autosaver = draftsEnabled() && this.draftKey
      ? createDraftAutosaver({
          key: this.draftKey,
          userId: this.userId,
          projectId: this.projectId,
          clientUuid: this.clientUuid,
          baseVersion: this.base?.version ?? null,
          baseSnapshot: this.base,
        })
      : null
  }

  onSnapshotChanged(snapshot) {
    if (!this.autosaver || !this.draftKey) return
    if (deepEqual(snapshot, this.base)) {
      this.autosaver.cancel()
      deleteDraft(this.draftKey)
    } else {
      this.autosaver.schedule(snapshot)
    }
  }

  async findLatestNewDraft() {
    const drafts = await listDrafts(this.userId)
    return drafts.filter((draft) => draft.projectId == null && draft.clientUuid).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0] ?? null
  }

  async checkDraft() {
    if (!draftsEnabled() || !this.draftKey) return
    const key = this.draftKey
    const draft = await getDraft(key)
    if (!draft || key !== this.draftKey) return
    if (draft.schemaVersion !== DRAFT_SCHEMA_VERSION) {
      await deleteDraft(key)
      return
    }
    const baseVersion = this.base?.version
    if (baseVersion != null && draft.baseVersion != null && draft.baseVersion < baseVersion) {
      // Проєкт змінився, поки чернетка чекала — одразу зливаємо, як живе оновлення
      const result = threeWayMerge(draft.baseSnapshot ?? this.base, this.base, draft.values, PROJECT_MERGE_OPTIONS)
      this.form = formFromSnapshot(result.merged)
      this.conflicts = result.conflicts
      this.merged = result.conflicts.length ? result.merged : null
      toast('Проєкт було оновлено, поки вас не було — чернетку злито з новою версією.', { icon: 'ℹ️' })
      return
    }
    this.draftOffer = { updatedAt: draft.updatedAt, values: draft.values }
  }
  restoreDraft() {
    if (!this.draftOffer) return
    this.form = formFromSnapshot(this.draftOffer.values)
    this.draftOffer = null
  }
  discardDraft() {
    if (this.draftKey) deleteDraft(this.draftKey)
    this.draftOffer = null
  }

  // ---- вкладення (лише редагування) ----
  toggleUpload() {
    this.uploadOpen = !this.uploadOpen
  }
  setAttachmentType(type) {
    this.attachmentType = type
  }
  async upload(files) {
    const list = Array.from(files ?? []).filter((file) => {
      if (file.size <= 10 * 1024 * 1024) return true
      toast.error(`"${file.name}" більший за 10 МБ`)
      return false
    })
    if (list.length === 0) return
    this.uploading = true
    for (const file of list) {
      try {
        const attachment = await uploadProjectAttachment({ file, projectId: this.projectId, type: this.attachmentType })
        this.addAttachment(attachment)
        toast.success(`Файл "${file.name}" завантажено`)
      } catch (error) {
        toast.error(error.message)
      }
    }
    this.setUploading(false)
  }
  setUploading(value) {
    this.uploading = value
  }
  addAttachment(attachment) {
    this.attachments = [...this.attachments, attachment]
  }
  async removeAttachment(id) {
    if (!window.confirm('Видалити вкладення?')) return
    try {
      await deleteProjectAttachment(id)
      this.attachments = this.attachments.filter((item) => item.id !== id)
      this.scope.invalidate(PROJECT_KEYS.all)
    } catch (error) {
      toast.error(error.message)
    }
  }
  async saveAttachmentComment(id, comment) {
    const attachment = this.attachments.find((item) => item.id === id)
    const trimmed = String(comment ?? '').trim()
    if (!attachment || (attachment.comment || '') === trimmed) return
    try {
      await updateAttachmentComment({ id, comment: trimmed })
      this.attachments = this.attachments.map((item) => (item.id === id ? { ...item, comment: trimmed || null } : item))
    } catch (error) {
      toast.error(error.message)
    }
  }
  downloadAttachment(attachment) {
    downloadProjectAttachment(attachment.id, attachment.originalName || attachment.filename).catch(() => toast.error('Не вдалося завантажити вкладення'))
  }
}
