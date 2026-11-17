import { observable, reaction, toJS } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommands } from '../../../shared/mvvm/commands.js'
import {
  canArchivePhoneEntry,
  canDeletePhoneEntry,
  canImportPhones,
  canManagePhoneComment,
  canReadPhoneAudit,
  canReadPhones,
  canUpdatePhoneEntry,
} from '../shared/lib/permissions.js'
import { fetchPhone, fetchPhoneAuditHistory, fetchPhoneComments, fetchPhoneOptions, fetchPhones } from '../model/phoneApi.js'
import { PHONE_COMMANDS, PHONE_KEYS } from '../model/handbookCommands.js'

// Пошук/фільтри — у localStorage (пряма вимога: не скидати при новому візиті).
const FILTERS_STORAGE_KEY = 'handbook-phones-filters'
const DEFAULT_FILTERS = {
  q: undefined,
  department: [],
  status: 'active',
  sort: 'name',
  direction: 'asc',
  onlyFavorite: false,
  onlyConfirmed: false,
}

function loadStoredFilters() {
  try {
    const stored = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || '{}')
    return { ...DEFAULT_FILTERS, ...stored, department: Array.isArray(stored.department) ? stored.department : [] }
  } catch {
    return { ...DEFAULT_FILTERS }
  }
}

/** /handbook-phones — список (групований за підрозділом), фільтри, вибір запису, модалки. */
export class PhonesViewModel {
  filters = loadStoredFilters()
  selectedId = null
  createOpen = false
  importOpen = false
  editingEntry = null

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { editingEntry: observable.ref })

    this.optionsQuery = scope.query({ queryKey: PHONE_KEYS.options, queryFn: fetchPhoneOptions, staleTime: Infinity })
    this.listQuery = scope.infiniteQuery({
      queryKey: () => PHONE_KEYS.list(this.requestFilters),
      queryFn: ({ pageParam = 0, queryKey }) => fetchPhones({ ...queryKey[1], page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => (lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined),
      placeholderData: keepPreviousData,
    })
    this.cmd = createCommands(scope, { toggleFavorite: PHONE_COMMANDS.toggleFavorite })

    const stop = reaction(
      () => toJS(this.filters),
      (filters) => {
        try {
          localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
        } catch {
          // не критично
        }
      },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  get auth() {
    return this.stores.session.auth
  }

  get canRead() {
    return canReadPhones(this.auth)
  }

  get canImport() {
    return canImportPhones(this.auth)
  }

  get requestFilters() {
    const f = this.filters
    return {
      q: f.q,
      department: f.department.length ? f.department : undefined,
      status: f.status,
      sort: f.sort,
      direction: f.direction,
      onlyFavorite: f.onlyFavorite,
      onlyConfirmed: f.onlyConfirmed,
      limit: 200,
    }
  }

  get statusOptions() {
    return this.optionsQuery.data?.statuses || []
  }

  get departmentOptions() {
    return this.optionsQuery.data?.departments || []
  }

  get sortOptions() {
    return (this.optionsQuery.data?.sorts || []).map((option) => ({ value: option.value, label: option.label }))
  }

  get entries() {
    return (this.listQuery.data?.pages || []).flatMap((page) => page?.data || [])
  }

  setFilter(name, value) {
    this.filters = { ...this.filters, [name]: value }
  }

  toggleDirection() {
    this.setFilter('direction', this.filters.direction === 'asc' ? 'desc' : 'asc')
  }

  clearFilters() {
    this.filters = { ...DEFAULT_FILTERS }
  }

  select(id) { this.selectedId = id }
  closeDetail() { this.selectedId = null }
  openCreate() { this.createOpen = true }
  closeCreate() { this.createOpen = false }
  openImport() { this.importOpen = true }
  closeImport() { this.importOpen = false }
  edit(entry) { this.editingEntry = entry }
  closeEdit() { this.editingEntry = null }

  toggleFavorite(id) {
    return this.cmd.toggleFavorite.fire(id)
  }
}

/** Права панель: перегляд, дублювання, архів, обране, підтвердження номерів, видалення. */
export class PhoneDetailViewModel {
  editOpen = false
  auditOpen = false
  confirmDelete = false

  constructor({ scope, stores, entryId }) {
    this.scope = scope
    this.stores = stores
    this.entryId = entryId
    makeViewModel(this, { entryId: false })

    this.query = scope.query({ queryKey: PHONE_KEYS.detail(entryId), queryFn: () => fetchPhone(entryId), enabled: Boolean(entryId) })
    this.cmd = createCommands(scope, PHONE_COMMANDS)
  }

  get entry() {
    return this.query.data ?? null
  }

  get auth() {
    return this.stores.session.auth
  }

  get canUpdate() { return canUpdatePhoneEntry(this.auth, this.entry) }
  get canDelete() { return canDeletePhoneEntry(this.auth, this.entry) }
  get canArchive() { return canArchivePhoneEntry(this.auth, this.entry) }
  get canAudit() { return canReadPhoneAudit(this.auth) }

  openEdit() { this.editOpen = true }
  closeEdit() { this.editOpen = false }
  openAudit() { this.auditOpen = true }
  closeAudit() { this.auditOpen = false }
  askDelete() { this.confirmDelete = true }
  cancelDelete() { this.confirmDelete = false }

  toggleFavorite() { return this.cmd.toggleFavorite.fire(this.entryId) }
  duplicate() { return this.cmd.duplicate.fire(this.entryId) }
  archive() { return this.cmd.archive.fire(this.entryId) }
  restore() { return this.cmd.restore.fire(this.entryId) }
  confirmNumber(numberId) { return this.cmd.confirmNumber.fire({ numberId, entryId: this.entryId }) }

  async remove() {
    try {
      await this.cmd.remove.run(this.entryId)
      this.confirmDelete = false
      return true
    } catch {
      return false
    }
  }
}

/** Коментарі до запису: лише автор редагує/видаляє свій коментар. */
export class PhoneCommentsViewModel {
  draft = ''
  editingId = null
  editDraft = ''
  confirmDeleteId = null

  constructor({ scope, stores, entryId }) {
    this.scope = scope
    this.stores = stores
    this.entryId = entryId
    makeViewModel(this, { entryId: false })

    this.query = scope.query({
      queryKey: PHONE_KEYS.comments(entryId),
      queryFn: () => fetchPhoneComments(entryId),
      enabled: Boolean(entryId),
    })
    this.cmd = createCommands(scope, {
      add: PHONE_COMMANDS.addComment,
      update: PHONE_COMMANDS.updateComment,
      remove: PHONE_COMMANDS.deleteComment,
    })
  }

  get comments() {
    return this.query.data ?? []
  }

  isOwn(comment) {
    return canManagePhoneComment(this.stores.session.auth, comment)
  }

  setDraft(value) { this.draft = value }
  setEditDraft(value) { this.editDraft = value }
  askDelete(id) { this.confirmDeleteId = id }
  cancelDelete() { this.confirmDeleteId = null }
  cancelEdit() { this.editingId = null }

  startEdit(comment) {
    this.editingId = comment.id
    this.editDraft = comment.body
  }

  async send() {
    const body = this.draft.trim()
    if (!body || this.cmd.add.isPending) return
    await this.cmd.add.fire({ entryId: this.entryId, body })
    this.draft = ''
  }

  async saveEdit(commentId) {
    const body = this.editDraft.trim()
    if (!body) return
    await this.cmd.update.run({ entryId: this.entryId, commentId, body }).then(() => { this.editingId = null }, () => {})
  }

  async confirmDelete() {
    if (this.confirmDeleteId == null) return
    await this.cmd.remove.run({ entryId: this.entryId, commentId: this.confirmDeleteId }).then(() => { this.confirmDeleteId = null }, () => {})
  }
}

/** Створення (entry = null) або редагування телефонного запису. */
export class PhoneFormViewModel {
  name = ''
  phones = [{ phone: '', note: '' }]
  department = ''
  note = ''

  constructor({ scope, entry, onDone, onCreated }) {
    this.scope = scope
    this.entry = entry ?? null
    this.onDone = onDone
    this.onCreated = onCreated
    if (entry) {
      this.name = entry.name || ''
      this.phones = entry.phones?.length ? entry.phones.map((p) => ({ phone: p.phone, note: p.note })) : [{ phone: '', note: '' }]
      this.department = entry.department || ''
      this.note = entry.note || ''
    }
    makeViewModel(this, { entry: false, onDone: false, onCreated: false })
    this.cmd = createCommands(scope, { create: PHONE_COMMANDS.create, update: PHONE_COMMANDS.update })
  }

  get isEditing() {
    return Boolean(this.entry)
  }

  get validPhones() {
    return this.phones.filter((p) => p.phone.trim().length > 0)
  }

  get isValid() {
    return this.name.trim().length > 0 && this.validPhones.length > 0
  }

  get isPending() {
    return this.cmd.create.isPending || this.cmd.update.isPending
  }

  setName(value) { this.name = value }
  setPhones(value) { this.phones = value }
  setDepartment(value) { this.department = value }
  setNote(value) { this.note = value }

  async submit() {
    if (!this.isValid) return
    const data = {
      name: this.name.trim(),
      phones: this.validPhones.map((p) => ({ phone: p.phone.trim(), note: p.note?.trim() || undefined })),
      department: this.department.trim(),
      note: this.note.trim(),
    }
    try {
      if (this.isEditing) {
        await this.cmd.update.run({ id: this.entry.id, data })
      } else {
        const created = await this.cmd.create.run(data)
        this.onCreated?.(created?.id)
      }
      this.onDone()
    } catch {
      // toast уже показано командою
    }
  }
}

/** Історія змін запису (сторінки по 50). */
export class PhoneAuditViewModel {
  page = 1

  constructor({ scope, entryId }) {
    this.scope = scope
    this.entryId = entryId
    makeViewModel(this, { entryId: false })
    this.query = scope.query({
      queryKey: () => PHONE_KEYS.audit(this.entryId, this.page, 50),
      queryFn: ({ queryKey }) => fetchPhoneAuditHistory(queryKey[1], { page: queryKey[2], limit: queryKey[3] }),
      enabled: Boolean(entryId),
      placeholderData: keepPreviousData,
    })
  }

  get history() { return this.query.data?.data ?? [] }
  get total() { return this.query.data?.meta?.total ?? 0 }
  get pages() { return this.query.data?.meta?.pages ?? 1 }
  prev() { this.page = Math.max(1, this.page - 1) }
  next() { this.page = Math.min(this.pages, this.page + 1) }
}
