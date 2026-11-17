import { observable } from 'mobx'
import { format } from 'date-fns'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommands } from '../../../shared/mvvm/commands.js'
import {
  canAssignResponsibleUser,
  canCreateAnyResponsibleAssignment,
  canManageResponsibleFunctions,
  canViewFullResponsibleRegistry,
  canViewUsersReport,
} from '../shared/lib/responsiblePermissions.js'
import { RESPONSIBLE_COMMANDS, responsibleQueries } from '../model/staffCommands.js'

const toDateString = (date) => format(date, 'yyyy-MM-dd')
const toOption = (user) => ({ id: user.id, caption: user.name })

/**
 * /staff/responsible: повний реєстр (функції ↔ призначення, master-detail)
 * або — без повного доступу — лише "мої відповідальності".
 */
export class ResponsibleRegistryViewModel {
  selectedFunctionId = null
  reportOpen = false

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    const full = () => ({ enabled: this.hasFullAccess })
    this.optionsQuery = scope.query({ ...responsibleQueries.options, options: full })
    this.functionsQuery = scope.query({ ...responsibleQueries.functions, options: full })
    this.functionsTable = new ResponsibleFunctionsViewModel({ scope, registry: this })
    this.assignmentsTable = new ResponsibleAssignmentsViewModel({ scope, registry: this })
  }

  get auth() { return this.stores.session.auth }
  get hasFullAccess() { return canViewFullResponsibleRegistry(this.auth) }
  get canReport() { return canViewUsersReport(this.auth) }
  get users() { return this.optionsQuery.data?.users || [] }
  get functions() { return this.functionsQuery.data || [] }
  get userOptions() { return this.users.filter((user) => !user.deleted_at).map(toOption) }

  /** Клік по функції фільтрує призначення; повторний — знімає фільтр. */
  selectFunction(id) { this.selectedFunctionId = id }
  openReport() { this.reportOpen = true }
  closeReport() { this.reportOpen = false }
}

/** Таблиця функцій: фільтри, CRUD (право functionsManage). */
export class ResponsibleFunctionsViewModel {
  q = ''
  onlyUnassigned = false
  selectedUsersFilter = []
  editingFunction = null
  isCreateOpen = false
  deletingFunction = null

  constructor({ scope, registry }) {
    this.scope = scope
    this.registry = registry
    makeViewModel(this, {
      registry: false,
      selectedUsersFilter: observable.ref,
      editingFunction: observable.ref,
      deletingFunction: observable.ref,
    })
    this.cmd = createCommands(scope, { deleteFunction: RESPONSIBLE_COMMANDS.deleteFunction })
  }

  get canManage() { return canManageResponsibleFunctions(this.registry.auth) }
  get hasActive() { return Boolean(this.q || this.onlyUnassigned || this.selectedUsersFilter.length) }

  get filtered() {
    const userIds = this.selectedUsersFilter.map((user) => user.id)
    const q = this.q.toLowerCase()
    return this.registry.functions.filter((func) => {
      const assigned = (func.active_assignments || []).flatMap((a) => (a.users || []).map((u) => u.id))
      if (this.onlyUnassigned && assigned.length > 0) return false
      if (userIds.length && !assigned.some((id) => userIds.includes(id))) return false
      if (q && !func.name.toLowerCase().includes(q)) return false
      return true
    })
  }

  setQ(value) { this.q = value || '' }
  setOnlyUnassigned(value) { this.onlyUnassigned = typeof value === 'function' ? value(this.onlyUnassigned) : value }
  setSelectedUsersFilter(value) { this.selectedUsersFilter = value || [] }
  setEditingFunction(value) { this.editingFunction = value }
  setIsCreateOpen(value) { this.isCreateOpen = value }
  setDeletingFunction(value) { this.deletingFunction = value }

  resetFilters() {
    this.q = ''
    this.onlyUnassigned = false
    this.selectedUsersFilter = []
  }
}

/** Таблиця призначень: фільтр за обраною функцією + "лише діючі". */
export class ResponsibleAssignmentsViewModel {
  onlyActive = false
  isCreateOpen = false
  editingAssignment = null

  constructor({ scope, registry }) {
    this.scope = scope
    this.registry = registry
    makeViewModel(this, { registry: false, editingAssignment: observable.ref })
    this.query = scope.query({ ...responsibleQueries.assignments, options: () => ({ enabled: registry.hasFullAccess }) })
    this.cmd = createCommands(scope, { endAssignment: RESPONSIBLE_COMMANDS.endAssignment })
  }

  get rows() { return this.query.data || [] }
  get functionOptions() { return this.registry.functions.map((f) => ({ id: f.id, caption: f.name })) }
  get canCreate() { return canCreateAnyResponsibleAssignment(this.registry.auth) }

  get assignableUserOptions() {
    if (!this.canCreate) return []
    return this.registry.userOptions.filter((user) => canAssignResponsibleUser(this.registry.auth, user.id))
  }

  get filtered() {
    const fid = this.registry.selectedFunctionId
    return this.rows.filter((row) => {
      if (fid != null && Number(row.function_id) !== Number(fid)) return false
      if (this.onlyActive && row.ended_at) return false
      return true
    })
  }

  setOnlyActive(value) { this.onlyActive = typeof value === 'function' ? value(this.onlyActive) : value }
  setIsCreateOpen(value) { this.isCreateOpen = value }
  setEditingAssignment(value) { this.editingAssignment = value }
}

/** Форма функції (створення/редагування). */
export class ResponsibleFunctionFormViewModel {
  name = ''
  description = ''

  constructor({ scope, func }) {
    this.scope = scope
    this.func = func ?? null
    this.name = func?.name || ''
    this.description = func?.description || ''
    makeViewModel(this, { func: false })
    this.cmd = createCommands(scope, {
      createFunction: RESPONSIBLE_COMMANDS.createFunction,
      updateFunction: RESPONSIBLE_COMMANDS.updateFunction,
    })
  }

  get isEditing() { return Boolean(this.func) }
  get isPending() { return this.cmd.createFunction.isPending || this.cmd.updateFunction.isPending }
  setName(value) { this.name = value }
  setDescription(value) { this.description = value }

  save(onSuccess) {
    if (!this.name.trim()) return
    const { name, description } = this
    if (this.isEditing) this.cmd.updateFunction.mutate({ functionId: this.func.id, name, description }, { onSuccess })
    else this.cmd.createFunction.mutate({ name, description }, { onSuccess })
  }
}

/** Форма призначення (створення/редагування). */
export class AssignmentFormViewModel {
  func = null
  selectedUsers = []
  reason = ''
  startedAt = undefined
  endedAt = undefined

  constructor({ scope, assignment, functionOptions, defaultFunctionId }) {
    this.scope = scope
    this.assignment = assignment ?? null
    if (assignment) {
      this.func = functionOptions.find((f) => Number(f.id) === Number(assignment.function_id)) || null
      this.selectedUsers = (assignment.users || []).map(toOption)
      this.reason = assignment.reason || ''
      this.startedAt = assignment.started_at ? new Date(assignment.started_at) : undefined
      this.endedAt = assignment.ended_at ? new Date(assignment.ended_at) : undefined
    } else {
      this.func = functionOptions.find((f) => Number(f.id) === Number(defaultFunctionId)) || null
      this.startedAt = new Date()
    }
    makeViewModel(this, { assignment: false, func: observable.ref, selectedUsers: observable.ref })
    this.cmd = createCommands(scope, { assign: RESPONSIBLE_COMMANDS.assign, updateAssignment: RESPONSIBLE_COMMANDS.updateAssignment })
  }

  get isEditing() { return Boolean(this.assignment) }
  get isPending() { return this.cmd.assign.isPending || this.cmd.updateAssignment.isPending }
  setFunc(value) { this.func = value }
  setSelectedUsers(value) { this.selectedUsers = value || [] }
  setReason(value) { this.reason = value }
  setStartedAt(value) { this.startedAt = value }
  setEndedAt(value) { this.endedAt = value }

  save(onSuccess) {
    if (!this.func || this.selectedUsers.length === 0 || !this.startedAt) return
    const userIds = this.selectedUsers.map((user) => user.id)
    if (this.isEditing) {
      this.cmd.updateAssignment.mutate({
        assignmentId: this.assignment.id,
        functionId: this.func.id,
        userIds,
        reason: this.reason,
        startedAt: toDateString(this.startedAt),
        endedAt: this.endedAt ? toDateString(this.endedAt) : null,
      }, { onSuccess })
    } else {
      this.cmd.assign.mutate({ functionId: this.func.id, userIds, startedAt: toDateString(this.startedAt), reason: this.reason }, { onSuccess })
    }
  }
}

/**
 * Звіт "користувачі ↔ функції" (на вимогу). Бере вже наявний запит призначень
 * реєстру: другий Query на той самий ключ, створений у рендері модалки,
 * запускав рефетч і оновлював таблицю посеред рендеру.
 */
export class UsersReportViewModel {
  q = ''
  status = 'active'

  constructor({ scope, assignmentsQuery }) {
    this.scope = scope
    this.query = assignmentsQuery
    makeViewModel(this, { query: false })
  }

  get assignments() { return this.query.data || [] }
  setQ(value) { this.q = value }
  setStatus(value) { this.status = value }
}

/** "Мої відповідальності" (без повного доступу до реєстру). */
export class MyResponsibilitiesViewModel {
  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query(responsibleQueries.my)
  }

  get assignments() { return this.query.data || [] }
}
