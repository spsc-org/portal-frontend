import { observable, reaction } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import { createCommand } from '../../../shared/mvvm/commands.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import {
  INVENTORY_KEYS,
  addInventoryComment,
  addNodeItem,
  attachInventoryFiles,
  cloneInventory,
  createInventory,
  createNode,
  deleteInventory,
  deleteInventoryAttachment,
  deleteInventoryComment,
  deleteNode,
  editInventoryComment,
  fetchInventories,
  fetchInventory,
  fetchInventoryAudit,
  fetchInventoryForNode,
  fetchInventoryOptions,
  fetchNode,
  fetchNodes,
  inventoryExportUrl,
  removeNodeItem,
  restoreInventory,
  updateInventory,
  updateNode,
} from '../model/inventoryApi.js'

export const inventoryOptionsQuery = {
  queryKey: INVENTORY_KEYS.options,
  queryFn: fetchInventoryOptions,
  staleTime: 5 * 60 * 1000,
}

const dictionaryLists = (dictionary) => ({
  inventoryLocation: dictionary?.inventoryLocation ?? [],
  inventoryType: dictionary?.inventoryType ?? [],
  users: dictionary?.user ?? [],
  responsibleUsers: dictionary?.responsibleUser ?? [],
})

const INITIAL_FILTERS = {
  fBaileeUser: [],
  fLocation: [],
  fResponsibleUser: [],
  fText: '',
  fType: [],
  fNode: [],
  from: undefined,
  to: undefined,
  hideDeleted: false,
  hideNonInventory: false,
  page: 0,
  limit: 50,
}

/** /inventory: реєстр (фільтри persist), друк/експорт, модалки, коментарі. */
export class InventoryListViewModel {
  pinnedRows = []
  selectedId = null
  isEditOpen = false
  isCloneOpen = false
  isDetailsOpen = false
  commentModal = null // { mode: 'add'|'edit', inventoryId, comment? }

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { pinnedRows: observable.ref, commentModal: observable.ref })

    this.table = new TableState({ storageKey: '/inventory', initialFilters: INITIAL_FILTERS, signal: scope.signal, dirField: 'direction' })
    this.optionsQuery = scope.query(inventoryOptionsQuery)
    this.listQuery = scope.query({
      queryKey: () => INVENTORY_KEYS.list(this.table.snapshot),
      queryFn: ({ queryKey }) => fetchInventories(queryKey[1], this.userId),
      placeholderData: keepPreviousData,
    })
    const list = () => [INVENTORY_KEYS.all]
    this.deleteCmd = createCommand(scope, {
      mutationFn: (id) => deleteInventory(id, this.userId),
      invalidate: list,
      success: 'Успішно видалено',
      error: 'Помилка видалення',
    })
    this.restoreCmd = createCommand(scope, {
      mutationFn: (id) => restoreInventory(id, this.userId),
      invalidate: list,
      success: 'Успішно відновлено',
      error: 'Помилка відновлення',
    })
    this.deleteCommentCmd = createCommand(scope, {
      mutationFn: (vars) => deleteInventoryComment(vars, this.userId),
      invalidate: list,
      success: 'Видалено',
      error: 'Помилка',
    })
  }

  /** Insert — додати (коли не відкрито модалок і є право create). */
  mount() {
    const onKeyUp = (event) => {
      if (event.key === 'Insert' && this.canCreate && !this.isEditOpen && !this.isDetailsOpen) {
        this.selectedId = null
        this.isDetailsOpen = false
        this.openAdd()
      }
    }
    window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }

  get userId() {
    return this.stores.session.userId
  }
  get auth() {
    return this.stores.session.auth
  }
  get permissions() {
    return this.stores.session.pagePermissions.inventory ?? {}
  }
  get canCreate() {
    return Boolean(this.permissions.create)
  }
  /** Відновлення: повне право — будь-який видалений рядок, 'individual' — лише власний. */
  canRestore(row) {
    if (!row?.original?.deletedAt) return false
    const restore = this.permissions.restore
    return restore === true || (restore === 'individual' && this.userId === row.original.createdUserId)
  }

  get dictionary() {
    return this.optionsQuery.data
  }
  get lists() {
    return dictionaryLists(this.dictionary)
  }
  get filters() {
    return this.table.filters
  }
  get inventories() {
    return this.listQuery.data
  }
  get isFetching() {
    return this.listQuery.isFetching
  }
  get pagination() {
    return {
      onLimitChange: this.table.setLimit,
      onPageChange: this.table.setPageFromPaginator,
      currentPage: this.table.page,
      pageSize: this.inventories?.limit,
      totalCount: this.inventories?.total,
    }
  }
  get hasActiveFilters() {
    const f = this.filters
    return Boolean(
      f.fBaileeUser.length || f.fLocation.length || f.fResponsibleUser.length || f.fText.trim() ||
        f.fType.length || f.fNode.length || f.from || f.to || f.hideDeleted || f.hideNonInventory,
    )
  }

  changeOptions(key) {
    return (selected) => this.table.setFilter(key, selected)
  }
  changeText(event) {
    this.table.patchFilters({ fText: event.target.value }, { resetPage: false })
  }
  toggleSwitch({ target }) {
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
  setPinnedRows(rows = []) {
    this.pinnedRows = rows
  }

  // ---- друк/експорт (columns — видимі колонки таблиці, їх рахує View) ----
  exportAll(columns) {
    const f = this.filters
    const query = {
      fBaileeUser: f.fBaileeUser?.map((u) => u?.value),
      fLocation: f.fLocation?.map((u) => u?.value),
      fResponsibleUser: f.fResponsibleUser?.map((u) => u?.value),
      fText: f.fText,
      fType: f.fType?.map((u) => u?.value),
    }
    window.open(inventoryExportUrl(query, columns, f.hideNonInventory), '_blank')
  }
  exportSelected(columns) {
    window.open(inventoryExportUrl({ fId: this.pinnedRows }, columns, this.filters.hideNonInventory), '_blank')
  }

  // ---- дії ----
  remove(id) {
    return this.deleteCmd.fire(id)
  }
  restore(id) {
    return this.restoreCmd.fire(id)
  }
  deleteComment(inventoryId, commentId) {
    return this.deleteCommentCmd.fire({ inventoryId, commentId })
  }

  // ---- модалки ----
  openDetails(id) {
    this.selectedId = id
    this.isDetailsOpen = true
  }
  closeDetails() {
    this.isDetailsOpen = false
    this.selectedId = null
  }
  openAdd() {
    this.isEditOpen = true
  }
  openEdit(id) {
    if (!id) return
    this.selectedId = id
    this.isEditOpen = true
  }
  openClone(id) {
    if (!id) return
    this.selectedId = id
    this.isCloneOpen = true
  }
  closeEdit() {
    this.isEditOpen = false
    this.isCloneOpen = false
    this.selectedId = null
  }
  openCommentModal(modal) {
    this.commentModal = modal
  }
  closeCommentModal() {
    this.commentModal = null
  }
}

const emptyForm = (locations) => ({
  inventoryId: '',
  inventoryNum: '',
  registryNum: '',
  serial: '',
  caption: '',
  details: '',
  amount: 1,
  cost: '',
  note: '',
  valueTypeId: '',
  baileeUserId: '',
  responsibleUserId: '',
  locationId: locations?.find((l) => l.id === 1) ?? '',
  invoice: '',
})

/** Форма інвентарю: створення / редагування (id) / копія (id + isClone). */
export class InventoryFormViewModel {
  form
  errors = null

  constructor({ scope, stores, id = null, isClone = false, dictionary }) {
    this.scope = scope
    this.stores = stores
    this.id = id
    this.isClone = isClone
    this.lists = dictionaryLists(dictionary)
    this.requiredFields = dictionary?.requiredFields ?? []
    this.form = emptyForm(this.lists.inventoryLocation)
    makeViewModel(this, { id: false, isClone: false, lists: false, requiredFields: false, errors: observable.ref })

    this.saveCmd = createCommand(scope, {
      mutationFn: (body) => {
        if (this.isClone) return cloneInventory(this.id, body, this.userId)
        if (this.id) return updateInventory(this.id, body, this.userId)
        return createInventory(body, this.userId)
      },
      // Редагування оновлює рядок у кеші (isUpdated — підсвітка), решта — рефетч списку.
      onSuccess: (data, _vars, sc) => {
        if (!this.id || this.isClone || !data?.success || !data?.data) return
        sc.queryClient.setQueriesData({ queryKey: INVENTORY_KEYS.all }, (old) => {
          if (!Array.isArray(old?.data)) return old
          return { ...old, data: old.data.map((item) => (item.id === data.data.id ? { ...item, ...data.data, isUpdated: true } : item)) }
        })
      },
      invalidate: () => (this.id && !this.isClone ? [] : [INVENTORY_KEYS.all]),
      success: () => (this.isClone ? 'Копію створено успішно' : this.id ? 'Оновлено успішно' : 'Створено успішно'),
      error: false,
    })

    if (id) {
      this.editQuery = scope.query({ queryKey: INVENTORY_KEYS.edit(id), queryFn: () => fetchInventory(id, this.userId) })
      const stop = reaction(() => this.editQuery.data?.data, (item) => item && this.fillFrom(item), { fireImmediately: true })
      scope.signal.addEventListener('abort', stop, { once: true })
    }
  }

  get userId() {
    return this.stores.session.userId
  }
  get source() {
    return this.editQuery?.data?.data
  }
  get isPending() {
    return this.saveCmd.isPending
  }
  get dialogTitle() {
    if (this.isClone) return `Створити копію: ${this.source?.caption}`
    if (this.id) return `Редагувати інвентар: ${this.source?.caption}`
    return 'Створити новий інвентар'
  }
  get submitText() {
    if (this.isClone) return 'Створити копію'
    if (this.id) return 'Редагувати'
    return 'Створити'
  }
  isRequired(field) {
    return this.requiredFields.includes(field)
  }

  fillFrom(item) {
    const { responsibleUsers, users, inventoryType, inventoryLocation } = this.lists
    this.form = {
      inventoryNum: item.inventoryNum,
      registryNum: item.registryNum,
      serial: item.serial,
      note: item.note,
      cost: item.cost,
      caption: item.caption,
      amount: item.amount,
      details: item.details,
      invoice: item.invoice,
      responsibleUserId: responsibleUsers.find((d) => d.id === item.responsibleUserId),
      baileeUserId: users.find((d) => d.id === item.baileeUserId),
      valueTypeId: inventoryType.find((d) => d.id === item.valueTypeId),
      locationId: inventoryLocation.find((d) => d.id === item.locationId),
    }
  }

  changeField({ target }) {
    this.errors = { ...this.errors, [target.name]: '' }
    this.form = { ...this.form, [target.name]: target.value }
  }
  changeOptions(key) {
    return (selected) => {
      this.errors = { ...this.errors, [key]: '' }
      this.form = { ...this.form, [key]: selected }
    }
  }

  async submit() {
    const body = {
      ...this.form,
      locationId: this.form.locationId?.id,
      valueTypeId: this.form.valueTypeId?.id,
      baileeUserId: this.form.baileeUserId?.id,
      responsibleUserId: this.form.responsibleUserId?.id,
    }
    try {
      await this.saveCmd.run(body)
      this.form = emptyForm(this.lists.inventoryLocation)
      return true
    } catch (error) {
      if (error?.status === 422) this.errors = error.payload?.unvalidFields ?? null
      else if (error?.status === 204) toast.error('Зміни не були внесені, оскільки дані залишилися незмінними')
      else toast.error(error?.payload?.message || 'Помилка збереження')
      return false
    }
  }
}

/** Деталі інвентарю: картка, історія змін (вкладка), вкладення. */
export class InventoryDetailsViewModel {
  tab = 'info'
  auditPage = 1

  constructor({ scope, stores, id }) {
    this.scope = scope
    this.stores = stores
    this.id = id
    makeViewModel(this, { id: false })
    this.query = scope.query({ queryKey: INVENTORY_KEYS.details(id), queryFn: () => fetchInventory(id, this.userId) })
    this.auditQuery = scope.query({
      queryKey: () => INVENTORY_KEYS.audit(id, this.auditPage),
      queryFn: () => fetchInventoryAudit(id, this.auditPage, this.userId),
      options: () => ({ enabled: this.tab === 'history' }),
    })
    // Кількість вкладень у списку оновлюється рефетчем inventories.
    const refresh = () => [INVENTORY_KEYS.details(id), ['inventory-audit', id], INVENTORY_KEYS.all]
    const filesToast = (response) =>
      (response?.files ?? []).map(({ fileName }) => `Вкладення ${fileName} успішно завантажено`).join('\n') || undefined
    this.attachCmd = createCommand(scope, {
      mutationFn: (attachments) => attachInventoryFiles(id, attachments, this.userId),
      invalidate: refresh,
      success: filesToast,
      error: 'Помилка завантаження вкладення',
    })
    this.deleteAttachmentCmd = createCommand(scope, {
      mutationFn: (attachment) => deleteInventoryAttachment(attachment, this.userId),
      invalidate: refresh,
      success: (response) => `Вкладення ${response?.fileName ?? ''} видалено успішно`,
      error: 'Помилка видалення вкладення',
    })
  }

  get userId() {
    return this.stores.session.userId
  }
  get data() {
    return this.query.data
  }
  get isFetching() {
    return this.query.isFetching
  }
  get auditData() {
    return this.auditQuery.data
  }
  get auditLoading() {
    return this.auditQuery.isFetching
  }
  /** Редагування: 'individual' — лише власний, видалений — ніколи. */
  get canUpdateRow() {
    const item = this.data?.data
    if (!item) return undefined
    const permission = this.stores.session.pagePermissions.inventory?.update
    if (item.deletedAt) return false
    if (permission === 'individual') return item.createdUserId === this.userId
    return permission === true
  }

  setTab(value) {
    this.tab = value
  }
  setAuditPage(value) {
    this.auditPage = typeof value === 'function' ? value(this.auditPage) : value
  }
  attach(list = []) {
    if (list.length) this.attachCmd.fire(list)
  }
  deleteAttachment(attachment) {
    return this.deleteAttachmentCmd.fire(attachment)
  }
}

/** Модалка коментаря рядка (додати / редагувати). */
export class InventoryCommentViewModel {
  text = ''

  constructor({ scope, stores, modal }) {
    this.scope = scope
    this.stores = stores
    this.modal = modal
    this.text = modal?.mode === 'edit' ? modal.comment.comment : ''
    makeViewModel(this, { modal: false })
    const userId = () => this.stores.session.userId
    this.addCmd = createCommand(scope, {
      mutationFn: (vars) => addInventoryComment(vars, userId()),
      invalidate: () => [INVENTORY_KEYS.all],
      success: 'Коментар додано',
      error: 'Помилка',
    })
    this.editCmd = createCommand(scope, {
      mutationFn: (vars) => editInventoryComment(vars, userId()),
      invalidate: () => [INVENTORY_KEYS.all],
      success: 'Збережено',
      error: 'Помилка',
    })
  }

  get isPending() {
    return this.addCmd.isPending || this.editCmd.isPending
  }
  setText(value) {
    this.text = value
  }
  submit(onClose) {
    const comment = this.text.trim()
    if (!comment) return
    const { modal } = this
    if (modal.mode === 'add') this.addCmd.mutate({ inventoryId: modal.inventoryId, comment }, { onSuccess: onClose })
    else this.editCmd.mutate({ inventoryId: modal.inventoryId, commentId: modal.comment.id, comment }, { onSuccess: onClose })
  }
}

const EMPTY_NODE = { name: '', notes: '', network_connection: 'not_connected', type: 'workplace', responsible_user_id: null }
const EMPTY_ITEM_FILTERS = { search: '', type: [], user: [] }

/** /inventory/nodes: вузли (комплекти) — список, картка, склад, створення/редагування. */
export class InventoryNodesViewModel {
  selectedNodeId = null
  nodeSearch = ''
  itemFilters = EMPTY_ITEM_FILTERS
  isCreating = false
  isEditing = false
  nodeForm = { ...EMPTY_NODE }
  showAddItems = false

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { itemFilters: observable.ref })

    // inventoryType, networkConnections — колишні Inertia props.
    this.pageOptionsQuery = scope.query(pageOptionsQuery('inventory-nodes'))
    this.optionsQuery = scope.query(inventoryOptionsQuery)
    this.nodesQuery = scope.query({
      queryKey: () => INVENTORY_KEYS.nodes(this.nodeSearch),
      queryFn: () => fetchNodes(this.nodeSearch, this.userId),
    })
    this.nodeQuery = scope.query({
      queryKey: () => INVENTORY_KEYS.node(this.selectedNodeId),
      queryFn: () => fetchNode(this.selectedNodeId, this.userId),
      options: () => ({ enabled: Boolean(this.selectedNodeId) }),
    })
    this.addListQuery = scope.query({
      queryKey: () => INVENTORY_KEYS.addToNode(this.itemFilters),
      queryFn: () => fetchInventoryForNode(this.itemFilters, this.userId),
      options: () => ({ enabled: this.showAddItems }),
    })

    const all = () => [INVENTORY_KEYS.nodesAll, INVENTORY_KEYS.all]
    const detail = () => [INVENTORY_KEYS.node(this.selectedNodeId), INVENTORY_KEYS.nodesAll, INVENTORY_KEYS.all]
    this.createCmd = createCommand(scope, {
      mutationFn: (data) => createNode(data, this.userId),
      invalidate: all,
      success: 'Вузол створено',
      error: 'Помилка створення вузла',
    })
    this.updateCmd = createCommand(scope, {
      mutationFn: (vars) => updateNode(vars, this.userId),
      invalidate: detail,
      success: 'Вузол оновлено',
      error: 'Помилка оновлення вузла',
    })
    this.deleteCmd = createCommand(scope, {
      mutationFn: (id) => deleteNode(id, this.userId),
      invalidate: all,
      success: 'Вузол видалено',
      error: 'Помилка видалення вузла',
    })
    this.addItemCmd = createCommand(scope, {
      mutationFn: (inventoryId) => addNodeItem({ nodeId: this.selectedNodeId, inventoryId }, this.userId),
      invalidate: detail,
      success: 'Елемент додано до вузла',
      error: 'Помилка додавання елемента',
    })
    this.removeItemCmd = createCommand(scope, {
      mutationFn: (inventoryId) => removeNodeItem({ nodeId: this.selectedNodeId, inventoryId }, this.userId),
      invalidate: detail,
      success: 'Елемент прибрано з вузла',
      error: 'Помилка видалення елемента',
    })
  }

  get userId() {
    return this.stores.session.userId
  }
  get inventoryType() {
    return this.pageOptionsQuery.data?.inventoryType ?? []
  }
  get networkConnections() {
    return this.pageOptionsQuery.data?.networkConnections ?? []
  }
  get dictionary() {
    return this.optionsQuery.data
  }
  get nodes() {
    return this.nodesQuery.data?.data ?? []
  }
  get isNodesFetching() {
    return this.nodesQuery.isFetching
  }
  get nodeDetail() {
    return this.nodeQuery.data
  }
  get isDetailFetching() {
    return this.nodeQuery.isFetching
  }
  get currentItems() {
    return this.nodeDetail?.data?.items ?? []
  }
  get currentItemIds() {
    return new Set(this.currentItems.map((i) => i.id))
  }
  get searchItems() {
    return this.addListQuery.data?.data ?? []
  }
  get isInventoryFetching() {
    return this.addListQuery.isFetching
  }

  setNodeSearch(value) {
    this.nodeSearch = value
  }
  setItemFilters(value) {
    this.itemFilters = typeof value === 'function' ? value(this.itemFilters) : value
  }
  setNodeForm(value) {
    this.nodeForm = typeof value === 'function' ? value(this.nodeForm) : value
  }
  setShowAddItems(value) {
    this.showAddItems = typeof value === 'function' ? value(this.showAddItems) : value
  }
  setIsCreating(value) {
    this.isCreating = value
  }
  setIsEditing(value) {
    this.isEditing = value
  }

  selectNode(id) {
    this.selectedNodeId = id
    this.isEditing = false
    this.isCreating = false
    this.showAddItems = false
    this.itemFilters = EMPTY_ITEM_FILTERS
  }
  startCreate() {
    this.isCreating = true
    this.isEditing = false
    this.selectedNodeId = null
    this.showAddItems = false
    this.nodeForm = { ...EMPTY_NODE }
  }
  startEdit() {
    const node = this.nodeDetail?.data
    this.isEditing = true
    this.nodeForm = {
      name: node?.name ?? '',
      notes: node?.notes ?? '',
      network_connection: node?.network_connection ?? 'not_connected',
      type: node?.type ?? 'workplace',
      responsible_user_id: node?.responsible_user_id ?? null,
    }
  }

  async create(data) {
    try {
      const response = await this.createCmd.run(data)
      this.isCreating = false
      this.nodeForm = { ...EMPTY_NODE }
      const id = response?.data?.id
      if (id) this.selectedNodeId = id
    } catch {
      // тост уже показано
    }
  }
  async update(id, data) {
    try {
      await this.updateCmd.run({ id, data })
      this.isEditing = false
    } catch {
      // тост уже показано
    }
  }
  async remove() {
    try {
      await this.deleteCmd.run(this.selectedNodeId)
      this.selectedNodeId = null
    } catch {
      // тост уже показано
    }
  }
  addItem(inventoryId) {
    return this.addItemCmd.fire(inventoryId)
  }
  removeItem(inventoryId) {
    return this.removeItemCmd.fire(inventoryId)
  }
}
