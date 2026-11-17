import { keepPreviousData } from '@tanstack/react-query'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommands } from '../../../shared/mvvm/commands.js'
import {
  canImportBirthdays,
  canManageBirthdayEntry,
  canManageDefaultBirthdays,
  canManageGroups,
  canReadBirthdays,
  canShareBirthdayEntry,
} from '../shared/lib/permissions.js'
import { fetchBirthday, fetchBirthdayOptions, fetchBirthdays } from '../model/birthdayApi.js'
import { BIRTHDAY_COMMANDS, BIRTHDAY_KEYS } from '../model/handbookCommands.js'
import { createUserGroup, fetchUserGroupOptions, fetchUserGroups } from '../../../entities/userGroup/api.js'
import { USER_GROUP_KEYS } from '../../../entities/userGroup/userGroupKeys.js'

/** /handbook-birthdays — список, фільтри (пошук/scope/місяць), вибір, модалки. */
export class BirthdaysViewModel {
  q = undefined
  scopeFilter = 'all'
  month = undefined
  selectedId = null
  createOpen = false
  importOpen = false

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.optionsQuery = scope.query({ queryKey: BIRTHDAY_KEYS.options, queryFn: fetchBirthdayOptions, staleTime: Infinity })
    this.listQuery = scope.infiniteQuery({
      queryKey: () => BIRTHDAY_KEYS.list(this.requestFilters),
      queryFn: ({ pageParam = 0, queryKey }) => fetchBirthdays({ ...queryKey[1], page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => (lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined),
      placeholderData: keepPreviousData,
    })
    this.cmd = createCommands(scope, { remove: BIRTHDAY_COMMANDS.remove })
  }

  get auth() {
    return this.stores.session.auth
  }

  get canRead() { return canReadBirthdays(this.auth) }
  get canImport() { return canImportBirthdays(this.auth) }

  get requestFilters() {
    return { q: this.q, month: this.month, scope: this.scopeFilter === 'all' ? undefined : this.scopeFilter, limit: 50 }
  }

  get scopeOptions() {
    return (this.optionsQuery.data?.scopes || []).filter((option) => option.value !== 'all')
  }

  get entries() {
    return (this.listQuery.data?.pages || []).flatMap((page) => page?.data || [])
  }

  setQ(value) { this.q = value }
  setScope(value) { this.scopeFilter = value }
  setMonth(value) { this.month = value }
  select(id) { this.selectedId = id }
  closeDetail() { this.selectedId = null }
  openCreate() { this.createOpen = true }
  closeCreate() { this.createOpen = false }
  openImport() { this.importOpen = true }
  closeImport() { this.importOpen = false }

  clearFilters() {
    this.q = undefined
    this.scopeFilter = 'all'
    this.month = undefined
  }

  async remove(id) {
    try {
      await this.cmd.remove.run(id)
      if (this.selectedId === id) this.selectedId = null
    } catch {
      // toast уже показано
    }
  }
}

/** Права панель: перегляд/редагування інлайн, розшарювання (лише власник особистого запису). */
export class BirthdayDetailViewModel {
  isEditing = false
  nameDraft = ''
  dateDraft = ''
  noteDraft = ''
  confirmDelete = false

  constructor({ scope, stores, entryId }) {
    this.scope = scope
    this.stores = stores
    this.entryId = entryId
    makeViewModel(this, { entryId: false })
    this.query = scope.query({ queryKey: BIRTHDAY_KEYS.detail(entryId), queryFn: () => fetchBirthday(entryId), enabled: Boolean(entryId) })
    this.cmd = createCommands(scope, { update: BIRTHDAY_COMMANDS.update, remove: BIRTHDAY_COMMANDS.remove, share: BIRTHDAY_COMMANDS.share })
  }

  get entry() { return this.query.data ?? null }
  get canManage() { return canManageBirthdayEntry(this.stores.session.auth, this.entry) }
  get canShare() { return canShareBirthdayEntry(this.stores.session.auth, this.entry) }

  startEdit() {
    const entry = this.entry
    this.nameDraft = entry?.name || ''
    this.dateDraft = entry?.date_of_birth || ''
    this.noteDraft = entry?.note || ''
    this.isEditing = true
  }

  cancelEdit() { this.isEditing = false }
  setNameDraft(value) { this.nameDraft = value }
  setDateDraft(value) { this.dateDraft = value }
  setNoteDraft(value) { this.noteDraft = value }
  askDelete() { this.confirmDelete = true }
  cancelDelete() { this.confirmDelete = false }

  async save() {
    await this.cmd.update
      .run({ id: this.entryId, data: { name: this.nameDraft.trim(), dateOfBirth: this.dateDraft, note: this.noteDraft.trim() } })
      .then(() => { this.isEditing = false }, () => {})
  }

  share(groups) {
    return this.cmd.share.fire({ id: this.entryId, userIds: groups.map((group) => group.id) })
  }

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

/** Новий запис дня народження (спільний список — лише з правом manage). */
export class BirthdayFormViewModel {
  name = ''
  dateOfBirth = ''
  note = ''
  isDefault = false

  constructor({ scope, stores, onDone, onCreated }) {
    this.scope = scope
    this.stores = stores
    this.onDone = onDone
    this.onCreated = onCreated
    makeViewModel(this, { onDone: false, onCreated: false })
    this.cmd = createCommands(scope, { create: BIRTHDAY_COMMANDS.create })
  }

  get canDefault() { return canManageDefaultBirthdays(this.stores.session.auth) }
  get isValid() { return this.name.trim().length > 0 && Boolean(this.dateOfBirth) }

  setName(value) { this.name = value }
  setDateOfBirth(value) { this.dateOfBirth = value }
  setNote(value) { this.note = value }
  setIsDefault(value) { this.isDefault = value }

  async submit() {
    if (!this.isValid) return
    try {
      const entry = await this.cmd.create.run({
        name: this.name.trim(),
        dateOfBirth: this.dateOfBirth,
        note: this.note.trim(),
        isDefault: this.canDefault && this.isDefault,
      })
      this.onCreated?.(entry?.id)
      this.onDone()
    } catch {
      // toast уже показано
    }
  }
}

/** Розшарювання групам + швидке створення групи (право admin-groups.manage). */
export class SharePickerViewModel {
  showCreate = false
  newGroupName = ''
  newGroupMembers = []

  constructor({ scope, stores, onAdd }) {
    this.scope = scope
    this.stores = stores
    this.onAdd = onAdd
    makeViewModel(this, { onAdd: false })

    this.groupsQuery = scope.query({ queryKey: USER_GROUP_KEYS.list, queryFn: fetchUserGroups })
    this.optionsQuery = scope.query({ queryKey: USER_GROUP_KEYS.options, queryFn: fetchUserGroupOptions, staleTime: Infinity })
    this.cmd = createCommands(scope, {
      createGroup: {
        mutationFn: createUserGroup,
        invalidate: () => [USER_GROUP_KEYS.list],
        success: 'Групу створено',
        error: 'Не вдалося створити групу',
      },
    })
  }

  get groups() { return this.groupsQuery.data ?? [] }
  get users() { return this.optionsQuery.data?.users || [] }
  get canManageGroups() { return canManageGroups(this.stores.session.auth) }

  setShowCreate(value) { this.showCreate = value }
  setNewGroupName(value) { this.newGroupName = value }
  setNewGroupMembers(value) { this.newGroupMembers = value || [] }

  async createGroup() {
    const name = this.newGroupName.trim()
    if (!name) return
    try {
      const group = await this.cmd.createGroup.run({ name, memberIds: this.newGroupMembers.map((user) => user.id) })
      this.onAdd(group)
      this.showCreate = false
      this.newGroupName = ''
      this.newGroupMembers = []
    } catch {
      // toast уже показано
    }
  }
}
