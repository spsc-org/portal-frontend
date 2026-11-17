import { observable, reaction, toJS } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { apiErrorMessage, createCommand, createCommands } from '../../../shared/mvvm/commands.js'
import { downloadFile } from '../../../lib/utils.js'
import { blobErrorMessage } from '../../../entities/file/fileApi.js'
import {
  TASK_KEYS,
  addTaskComment,
  buildTaskFilterParams,
  createTaskDraft,
  discardTaskDraft,
  exportTasks,
  fetchProjectPicker,
  fetchProjectPickerVoc,
  fetchTask,
  fetchTaskAudit,
  fetchTaskComments,
  fetchTaskOptions,
  fetchTasksPage,
  finalizeTaskDraft,
  nextTasksPage,
  patchTaskField,
  updateLinkedProjects,
} from '../model/taskApi.js'
import { TASK_COMMANDS, taskFieldCommands } from '../model/taskCommands.js'

const STORAGE = '/task'
const INITIAL_FILTERS = {
  limit: 100,
  page: 0,
  title: undefined,
  statusId: undefined,
  typeId: undefined,
  createdUserId: undefined,
  assignedUserId: undefined,
  projectId: undefined,
  priorityId: undefined,
  onlyFavorite: undefined,
  hideDeleted: undefined,
  onlyMine: undefined,
}

export const SORT_OPTIONS = [
  { id: 'created_at', caption: 'Створено' },
  { id: 'dueDate', caption: 'Термін' },
  { id: 'priorityId', caption: 'Пріоритет' },
  { id: 'title', caption: 'Назва' },
]

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ?? fallback
  } catch {
    return fallback
  }
}
function writeStored(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // сховище недоступне — налаштування не збережуться
  }
}

/** Словники /api/task/options — спільний запит для сторінки, картки й форм. */
export const taskOptionsQuery = (session) => ({
  queryKey: TASK_KEYS.options,
  queryFn: () => fetchTaskOptions(session.userId),
  staleTime: Infinity,
  retry: false,
})

const listOf = (options, key) => options?.[key] ?? []

// ============================================================================
// Сторінка /task
// ============================================================================

/**
 * /task: панель фільтрів (persist), нескінченний список із групуванням,
 * панель перегляду (?view=id), створення/злиття/видалення/відновлення.
 */
export class TaskPageViewModel {
  filters
  groupBy
  viewId = null
  createDialog = null // { cloneFromTaskId? } | null
  confirmDeleteId = null
  mergeConfirm = null // { donorId, baseId } | null
  navigateView = null

  constructor({ scope, stores, viewId }) {
    this.scope = scope
    this.stores = stores
    let restored
    try {
      const stored = readStored(`${STORAGE}-filters`, null)
      // Мерж з INITIAL_FILTERS: у старих збережених фільтрах можуть бути відсутні нові ключі
      restored = stored ? { ...INITIAL_FILTERS, ...JSON.parse(stored) } : INITIAL_FILTERS
    } catch {
      restored = INITIAL_FILTERS
    }
    this.filters = restored
    this.groupBy = readStored(`${STORAGE}-groupBy`, 'status')
    this.viewId = viewId ? Number(viewId) : null
    makeViewModel(this, {
      filters: observable.ref,
      createDialog: observable.ref,
      mergeConfirm: observable.ref,
      navigateView: false,
    })

    this.optionsQuery = scope.query(taskOptionsQuery(stores.session))
    this.listQuery = scope.infiniteQuery({
      queryKey: () => TASK_KEYS.infinite(buildTaskFilterParams(this.filters)),
      queryFn: ({ pageParam, queryKey }) => fetchTasksPage(queryKey[2], pageParam, this.userId),
      initialPageParam: 0,
      getNextPageParam: nextTasksPage,
      retry: false,
    })
    this.cmd = createCommands(scope, TASK_COMMANDS)
    this.exportCmd = createCommand(scope, {
      mutationFn: () => exportTasks(this.filters, this.userId),
      error: false,
    })

    const stops = [
      reaction(() => toJS(this.filters), (filters) => writeStored(`${STORAGE}-filters`, JSON.stringify(filters))),
      reaction(() => this.groupBy, (value) => writeStored(`${STORAGE}-groupBy`, value)),
    ]
    scope.signal.addEventListener('abort', () => stops.forEach((stop) => stop()), { once: true })
  }

  /** Insert — створити (поза полями вводу), Escape — закрити панель перегляду. */
  mount() {
    const onKeyDown = (event) => {
      if (event.key === 'Insert' || event.code === 'Insert') {
        const active = document.activeElement
        const isInput = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable
        if (!isInput && !this.createDialog && this.canCreate) {
          event.preventDefault()
          this.openCreate()
        }
      }
      if (event.key === 'Escape' && this.viewId && !this.createDialog) this.closeView()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }

  get userId() {
    return this.stores.session.userId
  }
  get auth() {
    return this.stores.session.auth
  }
  get permissions() {
    return this.stores.session.pagePermissions.task ?? {}
  }
  get canCreate() {
    return Boolean(this.permissions.create)
  }
  /** "Тільки мої" має сенс лише за повного task.read (за 'individual' бекенд і так фільтрує). */
  get showOnlyMineToggle() {
    return this.permissions.read === true
  }

  get options() {
    return this.optionsQuery.data
  }
  get types() {
    return listOf(this.options, 'types')
  }
  get projects() {
    return listOf(this.options, 'projects')
  }
  get statuses() {
    return listOf(this.options, 'statuses')
  }
  get users() {
    return listOf(this.options, 'users')
  }
  get priorities() {
    return listOf(this.options, 'priorities')
  }

  get tasks() {
    return this.listQuery.data?.pages?.flatMap((page) => page?.data || []) || []
  }
  get total() {
    return this.listQuery.data?.pages?.[0]?.meta?.total || 0
  }
  get isListLoading() {
    return this.listQuery.isLoading
  }
  get hasNextPage() {
    return this.listQuery.hasNextPage
  }
  get isFetchingNextPage() {
    return this.listQuery.isFetchingNextPage
  }
  fetchNextPage() {
    return this.listQuery.fetchNextPage()
  }

  get sortValue() {
    return SORT_OPTIONS.find((option) => option.id === (this.filters.sort || 'created_at'))
  }
  get direction() {
    return this.filters.direction || 'desc'
  }

  // ---- фільтри ----
  patch(values, resetPage = true) {
    this.filters = { ...this.filters, ...values, ...(resetPage ? { page: 0 } : {}) }
  }
  changeOption(key) {
    return (option) => this.patch({ [key]: option })
  }
  changeTitle(value) {
    this.patch({ title: value })
  }
  clearFilters() {
    this.filters = { ...INITIAL_FILTERS, limit: this.filters.limit }
  }
  toggleFavoritesOnly(value) {
    this.patch({ onlyFavorite: value || undefined })
  }
  toggleHideDeleted(value) {
    this.patch({ hideDeleted: value || undefined })
  }
  toggleOnlyMine(value) {
    this.patch({ onlyMine: value || undefined })
  }
  setSort(option) {
    this.patch({ sort: option?.id || 'created_at' })
  }
  toggleDirection() {
    this.patch({ direction: this.filters.direction === 'asc' ? 'desc' : 'asc' }, false)
  }
  setGroupBy(value) {
    this.groupBy = value
  }

  // ---- експорт (blob; помилка теж приходить Blob-ом) ----
  async exportList() {
    try {
      const response = await this.exportCmd.run()
      const disposition = response.headers?.['content-disposition'] || ''
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
      downloadFile(response.data, match ? decodeURIComponent(match[1]) : `tasks_${Date.now()}.xlsx`)
    } catch (error) {
      toast.error((await blobErrorMessage(error)) || apiErrorMessage(error, 'Не вдалося експортувати задачі'))
    }
  }
  get isExporting() {
    return this.exportCmd.isPending
  }

  // ---- панель перегляду: джерело істини — ?view=id у URL (deep-link, кнопка "Назад"),
  // View пише параметр через router і викликає syncView; openView/closeView — навігація. ----
  syncView(param) {
    this.viewId = param ? Number(param) : null
  }
  setNavigator(navigateView) {
    this.navigateView = navigateView
  }
  openView(id) {
    this.navigateView?.(id)
  }
  closeView() {
    this.navigateView?.(null)
  }

  // ---- дії над рядками ----
  toggleFavorite(id) {
    return this.cmd.toggleFavorite.fire(id)
  }
  changeStatus(id, statusId) {
    return this.cmd.changeStatus.fire({ id, statusId })
  }
  restore(id) {
    return this.cmd.restoreTask.fire(id)
  }
  requestDelete(id) {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    this.confirmDeleteId = id
  }
  closeDelete() {
    this.confirmDeleteId = null
  }
  /** Модалка закривається одразу (без очікування відповіді) — помилка прийде тостом. */
  confirmDelete() {
    if (!this.confirmDeleteId || this.cmd.deleteTask.isPending) return
    const id = this.confirmDeleteId
    this.confirmDeleteId = null
    this.cmd.deleteTask.fire({ id, force: false })
  }

  requestMerge(donorId, baseId) {
    this.mergeConfirm = { donorId, baseId }
  }
  closeMerge() {
    this.mergeConfirm = null
  }
  confirmMerge() {
    if (!this.mergeConfirm || this.cmd.mergeTask.isPending) return
    const { donorId, baseId } = this.mergeConfirm
    this.mergeConfirm = null
    this.cmd.mergeTask.fire({ baseId, donorId })
  }
  get mergeMessage() {
    const { donorId, baseId } = this.mergeConfirm ?? {}
    const donor = this.tasks.find((t) => t.id === donorId)
    const base = this.tasks.find((t) => t.id === baseId)
    return `Задачу #${donorId}${donor ? ` «${donor.title}»` : ''} буде злито в задачу #${baseId}${base ? ` «${base.title}»` : ''}: теги, учасники, проєкти, обговорення, вкладення й опис перенесуться в базову задачу, а задача-донор буде видалена.`
  }

  openCreate(props = {}) {
    this.createDialog = props
  }
  closeCreate() {
    this.createDialog = null
  }
}

// ============================================================================
// Картка задачі (панель перегляду)
// ============================================================================

const optionCaption = (option) => option?.caption || option?.name || option?.label || ''

/** Спільні правила полів задачі (картка й чернетка). */
function taskEditing(vm) {
  return {
    addTag(selected) {
      const option = selected?.[selected.length - 1]
      if (!option) return
      const current = (vm.task?.tags || []).map((t) => t.id)
      const addition = option.__isNew__ ? option.value : (option.id ?? option.value)
      if (!option.__isNew__ && current.includes(addition)) return
      vm.cmd.updateTags.mutate([...current, addition])
    },
    removeTag(tagId) {
      vm.cmd.updateTags.mutate((vm.task?.tags || []).filter((t) => t.id !== tagId).map((t) => t.id))
    },
    addAssignee(selected) {
      const option = selected?.[selected.length - 1]
      if (!option) return
      const current = vm.assignedUsers.map((u) => u.id)
      if (current.includes(option.id)) return
      vm.cmd.updateAssignees.mutate([...current, option.id])
    },
    removeAssignee(userId) {
      vm.cmd.updateAssignees.mutate(vm.assignedUsers.filter((u) => u.id !== userId).map((u) => u.id))
    },
  }
}

export class TaskDetailsViewModel {
  isProjectsModalOpen = false
  isMergeModalOpen = false
  isAuditModalOpen = false
  isCloneModalOpen = false

  constructor({ scope, stores, taskId }) {
    this.scope = scope
    this.stores = stores
    this.taskId = taskId
    makeViewModel(this, { taskId: false })

    this.optionsQuery = scope.query(taskOptionsQuery(stores.session))
    // Бекенд у цьому GET сам гасить пов'язані нотифікації й штовхає бейдж у сокет.
    this.showQuery = scope.query({
      queryKey: TASK_KEYS.show(taskId),
      queryFn: () => fetchTask(taskId, this.userId),
      placeholderData: keepPreviousData,
    })
    this.cmd = createCommands(scope, { ...taskFieldCommands(() => this.taskId), toggleFavorite: TASK_COMMANDS.toggleFavorite })
    Object.assign(this, taskEditing(this))
  }

  get userId() {
    return this.stores.session.userId
  }
  get auth() {
    return this.stores.session.auth
  }
  get options() {
    return this.optionsQuery.data
  }
  get projects() {
    return listOf(this.options, 'projects')
  }
  get statuses() {
    return listOf(this.options, 'statuses')
  }
  get types() {
    return listOf(this.options, 'types')
  }
  get priorities() {
    return listOf(this.options, 'priorities')
  }
  get users() {
    return listOf(this.options, 'users')
  }
  get availableTags() {
    return listOf(this.options, 'tags')
  }

  get data() {
    return this.showQuery.data
  }
  get task() {
    return this.data?.data
  }
  get isLoading() {
    return this.showQuery.isLoading
  }
  get isFetching() {
    return this.showQuery.isFetching
  }
  get attachments() {
    return (this.data?.attachments || []).filter((a) => !a.isResult)
  }
  get resultAttachments() {
    return (this.data?.attachments || []).filter((a) => a.isResult)
  }
  get linkedProjects() {
    return this.data?.linkedProjects || []
  }
  get linkedProjectIds() {
    return this.linkedProjects.map((project) => project.id)
  }
  /** getById віддає camelCase assignedUsers; snake_case — фолбек. */
  get assignedUsers() {
    return this.task?.assignedUsers || this.task?.assigned_users || []
  }
  get projectName() {
    return optionCaption(this.projects.find((p) => p.id === this.task?.projectId))
  }
  get tagOptions() {
    return this.availableTags.filter((tag) => !(this.task?.tags || []).some((t) => t.id === tag.id))
  }
  get assigneeOptions() {
    return this.users.filter((user) => !this.assignedUsers.some((u) => u.id === user.id))
  }

  get updatePermission() {
    return this.stores.session.pagePermissions.task?.update
  }
  get canReadAudit() {
    return Boolean(this.stores.session.pagePermissions.task?.readAudit)
  }
  /** 'individual' — власник або учасник (як authorizeTaskModification на бекенді). */
  get canEdit() {
    const task = this.task
    if (!task || task.deleted_at) return false
    if (this.updatePermission === 'individual') {
      return task.createdUserId === this.userId || this.assignedUsers.some((user) => user.id === this.userId)
    }
    return this.updatePermission === true
  }
  /** Всіма тегами керує власник або повне право update; учасник — лише своїми. */
  get canManageAllTags() {
    const task = this.task
    if (!task || task.deleted_at) return false
    if (this.updatePermission === true) return true
    return this.updatePermission === 'individual' && task.createdUserId === this.userId
  }
  canRemoveTag(tag) {
    return this.canManageAllTags || (this.canEdit && tag.pivot?.addedByUserId === this.userId)
  }

  toggleFavorite() {
    return this.cmd.toggleFavorite.fire(this.taskId)
  }
  changeStatus(statusId) {
    if (statusId === this.task?.statusId) return
    this.cmd.changeStatus.fire(statusId)
  }
  copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?view=${this.taskId}`
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success('Посилання скопійовано'))
      .catch(() => toast.error('Не вдалося скопіювати посилання'))
  }
  attach(newAttachments = []) {
    if (newAttachments.length) this.cmd.attachFiles.fire(newAttachments)
  }
  attachResult(newAttachments = []) {
    if (newAttachments.length) this.cmd.attachResultFiles.fire(newAttachments)
  }
  deleteAttachment(attachment) {
    return this.cmd.deleteAttachment.fire(attachment)
  }

  setProjectsModalOpen(value) {
    this.isProjectsModalOpen = value
  }
  setMergeModalOpen(value) {
    this.isMergeModalOpen = value
  }
  setAuditModalOpen(value) {
    this.isAuditModalOpen = value
  }
  setCloneModalOpen(value) {
    this.isCloneModalOpen = value
  }
}

// ============================================================================
// Створення задачі (чернетка)
// ============================================================================

const ADVANCED_KEY = 'task-create-modal-advanced'

/**
 * Чернетка (isDraft=1) створюється одразу при відкритті; поля зберігаються
 * тими самими PATCH, що й у картці. "Створити" — finalize, закриття без
 * нього — discard. cloneFromTaskId — підставити дані іншої задачі.
 */
export class CreateTaskViewModel {
  draftId = null
  titleDraft = ''
  descriptionDraft = ''
  isAdvanced = readStored(ADVANCED_KEY, 'false') === 'true'
  cloneStatus = 'idle' // idle | pending | done

  constructor({ scope, stores, view = 'task', cloneFromTaskId = null, onCreated, onClose }) {
    this.scope = scope
    this.stores = stores
    this.view = view
    this.cloneFromTaskId = cloneFromTaskId
    this.onCreated = onCreated
    this.onClose = onClose
    makeViewModel(this, { view: false, cloneFromTaskId: false, onCreated: false, onClose: false })

    this.optionsQuery = scope.query(taskOptionsQuery(stores.session))
    this.draftQuery = scope.query({
      queryKey: () => TASK_KEYS.show(this.draftId),
      queryFn: () => fetchTask(this.draftId, this.userId),
      options: () => ({ enabled: Boolean(this.draftId) }),
    })
    this.cmd = createCommands(scope, taskFieldCommands(() => this.draftId))
    this.createDraftCmd = createCommand(scope, {
      mutationFn: (typeId) => createTaskDraft(typeId, this.userId),
      error: 'Не вдалося підготувати задачу',
    })
    this.finalizeCmd = createCommand(scope, {
      mutationFn: () => finalizeTaskDraft(this.draftId, this.userId),
      invalidate: () => [TASK_KEYS.all],
      success: 'Задачу створено',
      error: 'Не вдалося створити задачу',
    })
    this.discardCmd = createCommand(scope, {
      mutationFn: (id) => discardTaskDraft(id, this.userId),
      error: 'Не вдалося прибрати чернетку',
    })
    Object.assign(this, taskEditing(this))

    // Тексти назви/опису — з чернетки після її першого GET (далі редагуються локально).
    const stop = reaction(
      () => this.task?.id,
      () => {
        if (!this.task) return
        this.titleDraft = this.task.title || ''
        this.descriptionDraft = this.task.description || ''
      },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  /** Чернетка — один раз при монтуванні (модалка монтується лише відкритою). */
  mount() {
    let cancelled = false
    const start = async () => {
      // Тип за замовчуванням потребує словника типів.
      if (!this.optionsQuery.data) await this.optionsQuery.refetch()
      if (cancelled) return
      try {
        const response = await this.createDraftCmd.run(this.defaultTypeId)
        if (cancelled) return
        this.setDraftId(response?.data?.id)
        if (this.cloneFromTaskId) await this.applyClone()
        else if (this.defaultAssigneeId) this.cmd.updateAssignees.fire([this.defaultAssigneeId])
      } catch {
        // тост уже показано
      }
    }
    start()
    return () => {
      cancelled = true
    }
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
  get types() {
    return listOf(this.options, 'types')
  }
  get projects() {
    return listOf(this.options, 'projects')
  }
  get users() {
    return listOf(this.options, 'users')
  }
  get priorities() {
    return listOf(this.options, 'priorities')
  }
  get availableTags() {
    return listOf(this.options, 'tags')
  }
  /** "Мої задачі" — учасник за замовчуванням; баг-сторінка — тип "Помилка". */
  get defaultAssigneeId() {
    return this.view === 'assigned' ? this.userId : null
  }
  get defaultTypeId() {
    return this.types.find((t) => (this.view === 'bug' ? t.id === 1 : t.name === 'Звичайна'))?.id
  }

  get draftData() {
    return this.draftQuery.data
  }
  get task() {
    return this.draftData?.data
  }
  get draftAttachments() {
    return this.draftData?.attachments || []
  }
  get assignedUsers() {
    return this.task?.assignedUsers || this.task?.assigned_users || []
  }
  get tagOptions() {
    return this.availableTags.filter((tag) => !(this.task?.tags || []).some((t) => t.id === tag.id))
  }
  get assigneeOptions() {
    return this.users.filter((user) => !this.assignedUsers.some((u) => u.id === user.id))
  }
  /** Форма — лише після першого GET чернетки (і підстановки донора при клонуванні). */
  get isReady() {
    return Boolean(this.draftId) && Boolean(this.draftData) && !this.draftQuery.isLoading &&
      (!this.cloneFromTaskId || this.cloneStatus === 'done')
  }

  setDraftId(id) {
    this.draftId = id
  }
  setTitleDraft(value) {
    this.titleDraft = value
  }
  setDescriptionDraft(value) {
    this.descriptionDraft = value
  }
  toggleAdvanced() {
    this.isAdvanced = !this.isAdvanced
    writeStored(ADVANCED_KEY, String(this.isAdvanced))
  }

  saveTitle() {
    const value = this.titleDraft.trim()
    if (value && value !== (this.task?.title || '')) this.cmd.updateTitle.fire(value)
  }
  saveDescription() {
    if (this.descriptionDraft !== (this.task?.description || '')) this.cmd.updateDescription.fire(this.descriptionDraft)
  }
  attach(attachments = []) {
    if (attachments.length) this.cmd.attachFiles.fire(attachments)
  }
  deleteAttachment(attachment) {
    return this.cmd.deleteAttachment.fire(attachment)
  }

  /**
   * Дані донора — тими самими PATCH-ендпоінтами, але без потоку тостів
   * "Тип оновлено", "Теги оновлено"… — один зведений тост наприкінці.
   */
  async applyClone() {
    this.cloneStatus = 'pending'
    const id = this.draftId
    const patch = (segment, key, value) => patchTaskField(id, segment, key, value, this.userId)
    try {
      const donorResponse = await fetchTask(this.cloneFromTaskId, this.userId)
      const donor = donorResponse?.data ?? {}
      const donorAssigned = donor.assignedUsers || donor.assigned_users || []
      await patch('title', 'title', donor.title ?? '')
      await patch('description', 'description', donor.description ?? '')
      if (donor.typeId) await patch('type', 'typeId', donor.typeId)
      if (donor.priorityId) await patch('priority', 'priorityId', donor.priorityId)
      if (donor.projectId) await patch('project', 'projectId', donor.projectId)
      if (donor.dueDate) await patch('due-date', 'dueDate', donor.dueDate)
      await patch('tags', 'tags', (donor.tags || []).map((t) => t.id))
      await patch('assignees', 'userIds', donorAssigned.map((u) => u.id))
      await updateLinkedProjects(id, (donorResponse?.linkedProjects ?? []).map((p) => p.id), this.userId)
      this.titleDraft = donor.title || ''
      this.descriptionDraft = donor.description || ''
      await this.scope.invalidate(TASK_KEYS.show(id))
      toast.success(`Дані підставлено з задачі #${this.cloneFromTaskId}`)
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Не вдалося підставити дані донора'))
    } finally {
      this.cloneStatus = 'done'
    }
  }

  async finalize() {
    this.saveTitle()
    try {
      const response = await this.finalizeCmd.run()
      this.onCreated?.(response?.data?.id)
      this.onClose()
    } catch {
      // тост уже показано
    }
  }

  /** Закриття без "Створити" — чернетка (з вкладеннями) видаляється, не блокуючи закриття. */
  cancel() {
    if (this.draftId) this.discardCmd.fire(this.draftId)
    this.onClose()
  }
}

// ============================================================================
// Обговорення, злиття, набір проєктів, аудит
// ============================================================================

export class TaskDiscussionViewModel {
  commentDraft = ''

  constructor({ scope, stores, taskId }) {
    this.scope = scope
    this.stores = stores
    this.taskId = taskId
    makeViewModel(this, { taskId: false })
    this.query = scope.query({
      queryKey: TASK_KEYS.comments(taskId),
      queryFn: () => fetchTaskComments(taskId, this.userId),
      refetchInterval: 20000,
    })
    this.addCmd = createCommand(scope, {
      mutationFn: (body) => addTaskComment(taskId, body, this.userId),
      invalidate: () => [TASK_KEYS.comments(taskId)],
      error: 'Не вдалося надіслати повідомлення',
    })
  }

  get userId() {
    return this.stores.session.userId
  }
  get comments() {
    return this.query.data?.data || []
  }
  /** Писати можуть власник задачі та учасники. */
  canComment(createdUserId, assignedUsers = []) {
    return createdUserId === this.userId || assignedUsers.some((user) => user.id === this.userId)
  }
  setCommentDraft(value) {
    this.commentDraft = value
  }
  async send() {
    const body = this.commentDraft.trim()
    if (!body || this.addCmd.isPending) return
    try {
      await this.addCmd.run(body)
      this.commentDraft = ''
    } catch {
      // тост уже показано
    }
  }
}

export class MergeTaskViewModel {
  donorInput = ''
  donorId = '' // дебаунсене значення
  timer = null

  constructor({ scope, stores, baseId }) {
    this.scope = scope
    this.stores = stores
    this.baseId = Number(baseId)
    makeViewModel(this, { baseId: false, timer: false })
    this.previewQuery = scope.query({
      queryKey: () => TASK_KEYS.mergePreview(this.donorNumber),
      queryFn: () => fetchTask(this.donorNumber, this.stores.session.userId),
      options: () => ({ enabled: this.isValidDonor }),
      retry: false,
    })
    this.mergeCmd = createCommand(scope, TASK_COMMANDS.mergeTask)
  }

  /** Дебаунс 300 мс — без запиту на кожну цифру. */
  mount() {
    const stop = reaction(
      () => this.donorInput,
      (value) => {
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.setDonorId(value.trim()), 300)
      },
    )
    return () => {
      stop()
      clearTimeout(this.timer)
    }
  }

  get donorNumber() {
    return Number(this.donorId)
  }
  get isValidDonor() {
    return this.donorId !== '' && Number.isInteger(this.donorNumber) && this.donorNumber > 0 && this.donorNumber !== this.baseId
  }
  get isSelfMergeAttempt() {
    return this.donorId !== '' && this.donorNumber === this.baseId
  }
  get donorTask() {
    return this.previewQuery.data?.data
  }
  get isDonorLoading() {
    return this.previewQuery.isFetching
  }
  get isDonorNotFound() {
    return this.previewQuery.isError
  }

  setDonorInput(value) {
    this.donorInput = value
  }
  setDonorId(value) {
    this.donorId = value
  }
  confirm(onClose) {
    if (!this.donorTask) return
    this.mergeCmd.mutate({ baseId: this.baseId, donorId: this.donorTask.id }, { onSuccess: onClose })
  }
}

const EMPTY_PICKER = { fText: '', fDocument: '', fType: null, fAction: null, fProposal: null }

export class ProjectsSetViewModel {
  draft
  projectsSearch = ''
  pickerFilters = EMPTY_PICKER
  appliedFilters = EMPTY_PICKER
  timer = null

  constructor({ scope, stores, taskId, initialProjects }) {
    this.scope = scope
    this.stores = stores
    this.taskId = taskId
    this.draft = initialProjects ?? []
    makeViewModel(this, {
      taskId: false,
      timer: false,
      draft: observable.ref,
      pickerFilters: observable.ref,
      appliedFilters: observable.ref,
    })
    this.vocQuery = scope.query({
      queryKey: TASK_KEYS.pickerVoc,
      queryFn: () => fetchProjectPickerVoc(this.userId),
      staleTime: Infinity,
    })
    this.pickerQuery = scope.query({
      queryKey: () => TASK_KEYS.picker(this.appliedFilters),
      queryFn: () => fetchProjectPicker(this.appliedFilters, this.userId),
      options: () => ({ enabled: this.hasPickerCriteria }),
      placeholderData: keepPreviousData,
    })
    this.saveCmd = createCommand(scope, {
      mutationFn: (projectIds) => updateLinkedProjects(taskId, projectIds, this.userId),
      invalidate: () => [TASK_KEYS.show(taskId)],
      success: 'Набір проєктів оновлено',
      error: 'Не вдалося оновити набір проєктів',
    })
  }

  /** Дебаунс 350 мс критеріїв пікера. */
  mount() {
    const stop = reaction(
      () => this.pickerFilters,
      (filters) => {
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.applyFilters(filters), 350)
      },
    )
    return () => {
      stop()
      clearTimeout(this.timer)
    }
  }

  get userId() {
    return this.stores.session.userId
  }
  get draftIds() {
    return this.draft.map((project) => project.id)
  }
  get vocOptions() {
    const voc = this.vocQuery.data
    return {
      subjectType: Object.values(voc?.subjectType || {}),
      action: Object.values(voc?.action || {}),
      proposal: Object.values(voc?.proposal || {}),
    }
  }
  get hasPickerCriteria() {
    const f = this.appliedFilters
    return Boolean(f.fText.trim() || f.fDocument.trim() || f.fType || f.fAction || f.fProposal)
  }
  get pickerItems() {
    return this.pickerQuery.data?.items || []
  }
  get pickerTotal() {
    return this.pickerQuery.data?.total || 0
  }
  get isPickerLoading() {
    return this.pickerQuery.isFetching
  }

  setDraft(value) {
    this.draft = typeof value === 'function' ? value(this.draft) : value
  }
  setProjectsSearch(value) {
    this.projectsSearch = value
  }
  setPickerFilters(value) {
    this.pickerFilters = typeof value === 'function' ? value(this.pickerFilters) : value
  }
  applyFilters(filters) {
    this.appliedFilters = filters
  }
  addPicked(item) {
    if (!this.draft.some((project) => project.id === item.id)) this.draft = [...this.draft, { id: item.id, name: item.name }]
  }
  save(onClose) {
    this.saveCmd.mutate(this.draftIds, { onSuccess: onClose })
  }
}

export class TaskAuditViewModel {
  page = 1

  constructor({ scope, stores, taskId }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query({
      queryKey: () => TASK_KEYS.audit(taskId, this.page),
      queryFn: () => fetchTaskAudit(taskId, this.page, stores.session.userId),
      retry: false,
    })
  }

  setPage(value) {
    this.page = typeof value === 'function' ? value(this.page) : value
  }
  get history() {
    return this.query.data?.data ?? []
  }
  get total() {
    return this.query.data?.total ?? 0
  }
  get pages() {
    return this.query.data?.pages ?? 1
  }
  get isFetching() {
    return this.query.isFetching
  }
  get isError() {
    return this.query.isError
  }
}
