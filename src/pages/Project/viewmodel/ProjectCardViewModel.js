import { observable, reaction } from 'mobx'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { PROJECT_KEYS, downloadProjectAttachment } from '../model/projectModel.js'
import {
  CARD_KEYS,
  attachFileToProject,
  cardAttributes,
  cardCategories,
  cardCountries,
  cardDocuments,
  cardIdentifiers,
  cardProposals,
  cardReasons,
  cardRestrictions,
  detachFromProject,
  fetchProjectCard,
  fetchProjectHistory,
  historyEntries,
  readDock,
  saveProjectField,
  vocCaption,
  writeDock,
} from '../model/projectCardModel.js'
import { analyzeProject, ANALYSED_FIELDS } from '../model/liveAnalysisModel.js'
import { LiveAnalysisState } from './LiveAnalysisState.js'

const NONE = []
const MAX_UPLOAD = 10 * 1024 * 1024

/**
 * Картка швидкого перегляду проєкту (порт legacy projectCardManager.js + ProjectCardDock.js,
 * #modalProjectCard): вкладки "Загальна інформація" / "Історія змін", ←/→ по проєктах сторінки,
 * кошик, згортання в панель унизу, редагування окремих полів (PATCH /api/project/{id}),
 * тікети, вкладення, живий аналіз полів (POST /api/project/{id}/liveAnalysis після кожного завантаження).
 */
export class ProjectCardViewModel {
  isOpen = false
  projectId = null
  ids = NONE
  tab = 'general'
  editing = null // { field, value }
  failed = {} // field → значення, яке не вдалося зберегти
  savingField = null
  uploadOpen = false
  attachmentType = 'file'
  uploading = false
  dock = NONE
  scrollTop = 0
  restoreScroll = null

  constructor({ scope, page }) {
    this.scope = scope
    this.page = page
    this.analysis = new LiveAnalysisState()
    makeViewModel(this, { page: false, analysis: false, ids: observable.ref, editing: observable.ref, failed: observable.ref, dock: observable.ref })
    this.dock = readDock(page.userId)
    this.cardQuery = scope.query({
      queryKey: () => CARD_KEYS.card(this.projectId),
      queryFn: ({ queryKey }) => fetchProjectCard(queryKey[1]),
      options: () => ({ enabled: this.isOpen && this.projectId != null }),
    })
    this.historyQuery = scope.query({
      queryKey: () => CARD_KEYS.history(this.projectId),
      queryFn: ({ queryKey }) => fetchProjectHistory(queryKey[1]),
      options: () => ({ enabled: this.isOpen && this.projectId != null && this.tab === 'changes' }),
    })
    // Автоаналіз (legacy #runAutoAnalysis): щойно завантажено/перезавантажено дані картки
    const stop = reaction(
      () => (this.isOpen && this.project ? `${this.projectId}:${this.cardQuery.dataUpdatedAt}` : null),
      (stamp) => stamp && this.runAnalysis(),
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  // ---- похідні ----
  get voc() {
    return this.page.voc ?? {}
  }
  get project() {
    const data = this.cardQuery.data
    return data && Number(data.project?.id) === this.projectId ? data.project : null
  }
  get changesCount() {
    return this.cardQuery.data?.changesCount ?? 0
  }
  get isLoading() {
    return this.cardQuery.isFetching && !this.project
  }
  get isRefreshing() {
    return this.cardQuery.isFetching
  }
  get error() {
    return this.cardQuery.isError ? this.cardQuery.error?.message || 'Помилка при завантаженні проєкту.' : null
  }
  get isEditable() {
    return this.project?.isDisabled === 0
  }
  get index() {
    return this.ids.indexOf(this.projectId)
  }
  get isChain() {
    return this.ids.length > 1
  }
  get canPrev() {
    return this.index > 0
  }
  get canNext() {
    return this.index >= 0 && this.index < this.ids.length - 1
  }
  get inCart() {
    return this.page.cart.ids.includes(this.projectId)
  }
  get caption() {
    const project = this.project
    return project ? project.nameUk || project.nameEn || project.nameRu || '' : ''
  }
  /** Видимість блоків (legacy #handleSubjectTypeUI). */
  get layout() {
    const { subjectTypeId, actionType } = this.project ?? {}
    const vessel = subjectTypeId === 5 || subjectTypeId === 6
    return {
      fix: actionType !== 1,
      nameUk: !vessel,
      nameRu: !vessel,
      birthDate: !vessel && subjectTypeId !== 2,
      adr: !vessel && subjectTypeId === 2,
    }
  }
  get view() {
    const project = this.project
    if (!project) return null
    const voc = this.voc
    return {
      subjectType: vocCaption(voc.subjectType, project.subjectTypeId),
      actionType: vocCaption(voc.action, project.actionType),
      state: vocCaption(voc.state, project.stateId),
      term: vocCaption(voc.term, project.termId),
      issuer: vocCaption(voc.issuer, project.issuerId),
      performer: vocCaption(voc.user, project.performerId),
      validator: vocCaption(voc.user, project.validatorId),
      reasons: cardReasons(project, voc),
      countries: cardCountries(project, voc),
      identifiers: cardIdentifiers(project, voc),
      attributes: cardAttributes(project, voc),
      restrictions: cardRestrictions(project, voc.restriction),
      categories: cardCategories(project),
      documents: cardDocuments(project, voc),
      proposals: cardProposals(project, voc),
      decree: project.decree ?? null,
      tickets: Array.isArray(project.tickets) ? project.tickets : NONE,
      attachments: Array.isArray(project.attachments) ? project.attachments : NONE,
    }
  }
  get history() {
    return historyEntries(this.historyQuery.data, this.voc.user)
  }
  get historyLoading() {
    return this.historyQuery.isLoading
  }
  userOf(id) {
    return (this.voc.user ?? NONE).find((user) => user.id === id) ?? null
  }

  // ---- відкриття / навігація ----
  /** Ланцюжок — лише якщо проєкт серед ids (legacy show: ?card={id}&chain=1). */
  open(projectId, ids = NONE, restore = null) {
    const id = Number(projectId)
    const chain = ids.length > 1 && ids.includes(id)
    this.ids = chain ? ids : [id]
    this.projectId = id
    this.tab = restore?.tabId === 'changes' ? 'changes' : 'general'
    this.restoreScroll = restore?.scrollTop ?? null
    this.resetEditState()
    this.isOpen = true
    this.removeFromDock(id)
    this.setUrl()
  }
  close() {
    this.isOpen = false
    this.resetEditState()
    this.setUrl()
  }
  step(delta) {
    const next = this.ids[this.index + delta]
    if (next == null) return
    this.projectId = next
    this.resetEditState()
    this.setUrl()
  }
  setTab(tab) {
    this.tab = tab
  }
  /** Повний живий аналіз збереженого проєкту. */
  async runAnalysis() {
    const projectId = this.projectId
    const requestId = this.analysis.begin(ANALYSED_FIELDS)
    try {
      const data = await analyzeProject(projectId, ANALYSED_FIELDS)
      if (projectId === this.projectId) this.analysis.apply(requestId, data, ANALYSED_FIELDS)
    } catch {
      this.analysis.fail(requestId, ANALYSED_FIELDS)
    }
  }

  resetEditState() {
    this.editing = null
    this.failed = {}
    this.uploadOpen = false
    this.analysis.reset()
  }
  setUrl() {
    const url = new URL(window.location.href)
    url.searchParams.delete('card')
    url.searchParams.delete('chain')
    if (this.isOpen) {
      url.searchParams.set('card', this.projectId)
      if (this.isChain) url.searchParams.set('chain', '1')
    }
    window.history.replaceState(window.history.state, '', url)
  }
  setScrollTop(value) {
    this.scrollTop = value
  }
  consumeRestoreScroll() {
    const value = this.restoreScroll
    this.restoreScroll = null
    return value
  }

  /** Перезавантажити картку і рядки списку (після змін у картці чи тікетах). */
  refresh() {
    this.scope.invalidate(CARD_KEYS.all)
    this.scope.invalidate(PROJECT_KEYS.all)
  }

  // ---- кошик / згортання ----
  toggleCart() {
    const id = this.projectId
    const ids = this.page.cart.ids
    if (ids.includes(id)) {
      this.page.cart.set(ids.filter((item) => item !== id))
      toast(`Проєкт #${id} прибрано з кошика`, { icon: 'ℹ️' })
    } else {
      this.page.cart.set([...ids, id])
      toast.success(`Проєкт #${id} додано в кошик`)
    }
  }

  minimize() {
    if (!this.isOpen) return
    const item = { projectId: this.projectId, caption: this.caption, allIndexList: this.ids, tabId: this.tab, scrollTop: this.scrollTop }
    this.setDock([...this.dock.filter((entry) => entry.projectId !== item.projectId), item])
    this.close()
  }
  restoreFromDock(item) {
    this.open(item.projectId, item.allIndexList ?? NONE, item)
  }
  removeFromDock(projectId) {
    if (this.dock.some((entry) => entry.projectId === projectId)) this.setDock(this.dock.filter((entry) => entry.projectId !== projectId))
  }
  clearDock() {
    this.setDock(NONE)
  }
  setDock(items) {
    this.dock = items.slice(-20)
    writeDock(this.page.userId, this.dock)
  }

  // ---- редагування поля (legacy SimpleTextBlockComponent: ✏️ → Enter/blur зберігає, Escape скасовує) ----
  startEdit(field) {
    const value = this.failed[field] ?? this.project?.[field] ?? ''
    this.editing = { field, value: value == null ? '' : String(value) }
  }
  setEditValue(value) {
    if (this.editing) this.editing = { ...this.editing, value }
  }
  cancelEdit() {
    if (!this.editing) return
    const { field } = this.editing
    const failed = { ...this.failed }
    delete failed[field]
    this.failed = failed
    this.editing = null
  }
  async commitEdit() {
    if (!this.editing) return
    const { field } = this.editing
    const value = this.editing.value.trim()
    this.editing = null
    const current = this.project?.[field]
    if (value === (current == null ? '' : String(current))) {
      this.clearFailed(field)
      return
    }
    const id = this.projectId
    this.savingField = field
    try {
      await saveProjectField(id, field, value)
      this.clearFailed(field)
      toast.success('Збережено')
      this.refresh()
    } catch (error) {
      this.failed = { ...this.failed, [field]: value }
      toast.error(error.message || 'Помилка при збереженні')
    } finally {
      this.setSavingField(null)
    }
  }
  clearFailed(field) {
    if (!(field in this.failed)) return
    const failed = { ...this.failed }
    delete failed[field]
    this.failed = failed
  }
  setSavingField(field) {
    this.savingField = field
  }

  // ---- тікети ----
  addTicket() {
    this.page.ticketForm.openAdd(this.projectId)
  }
  editTicket(ticketId) {
    this.page.ticketForm.openEdit(this.projectId, ticketId)
  }
  async setTicketState(ticketId, stateId) {
    await this.page.cmd.setTicketState.fire({ ticketId, stateId })
    this.refresh()
  }
  async deleteTicket(ticketId) {
    if (!window.confirm(`Видалити тікет ${ticketId}?`)) return
    await this.page.cmd.deleteTicket.fire(ticketId)
    this.refresh()
  }

  // ---- вкладення ----
  toggleUpload() {
    this.uploadOpen = !this.uploadOpen
  }
  setAttachmentType(type) {
    this.attachmentType = type
  }
  async upload(files) {
    const list = Array.from(files ?? []).filter((file) => {
      if (file.size <= MAX_UPLOAD) return true
      toast.error(`"${file.name}" більший за 10 МБ`)
      return false
    })
    if (list.length === 0) return
    const projectId = this.projectId
    this.uploading = true
    for (const file of list) {
      try {
        await attachFileToProject(projectId, file, this.attachmentType)
        toast.success(`Файл "${file.name}" успішно прикріплено.`)
      } catch (error) {
        toast.error(error.message)
      }
    }
    this.setUploading(false)
    this.refresh()
  }
  setUploading(value) {
    this.uploading = value
  }
  async detach(attachmentId) {
    if (!window.confirm('Ви впевнені, що хочете відкріпити це вкладення від проєкту?')) return
    try {
      await detachFromProject(this.projectId, attachmentId)
      toast.success('Вкладення відкріплено від проєкту')
      this.refresh()
    } catch (error) {
      toast.error(error.message)
    }
  }
  download(attachment) {
    downloadProjectAttachment(attachment.id, attachment.originalName || attachment.filename).catch(() => toast.error('Не вдалося завантажити вкладення'))
  }
  openPhoto(attachment) {
    const photos = (this.view?.attachments ?? NONE).filter((item) => item.type === 'photo')
    this.page.openPhoto(
      photos.map((item) => ({ ...item, url: item.fileUrl || `/public-file?path=${encodeURIComponent(item.file_path || item.filePath || '')}`, name: item.originalName || item.filename })),
      Math.max(0, photos.indexOf(attachment)),
    )
  }
}
