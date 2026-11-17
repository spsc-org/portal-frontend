import { observable, reaction } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import { format } from 'date-fns'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import { createCommand } from '../../../shared/mvvm/commands.js'
import { BOOLEANS, SANC_DECREE_TYPES } from '../../../lib/utils.js'
import {
  DECREE_KEYS,
  booleanLabel,
  buildDecreeFormData,
  createDecree,
  decreeAttachments,
  decreeMainFile,
  decreeTypeLabel,
  deleteDecree,
  deleteDecreeFile,
  fetchDecree,
  fetchDecrees,
  updateDecree,
} from '../model/decreeApi.js'

export const INITIAL_FILTERS = { limit: 50, page: 0, code: '', from: undefined, to: undefined, isActive: undefined }

/** Після створення/оновлення — підсвітити рядок у кешованих сторінках списку. */
function patchDecreeList(queryClient, data) {
  if (!data?.success || !data.data) return
  queryClient.setQueriesData({ queryKey: DECREE_KEYS.all }, (old) => {
    if (!Array.isArray(old?.data)) return old
    return { ...old, data: old.data.map((item) => (item.id === data.data.id ? { ...data.data, isUpdated: true } : item)) }
  })
}

/** /decree: реєстр указів + модалки створення/редагування/деталей. */
export class DecreeListViewModel {
  selectedId = null
  isDetailsOpen = false
  isEditOpen = false
  isCreateOpen = false

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.table = new TableState({
      storageKey: '/decree',
      initialFilters: INITIAL_FILTERS,
      signal: scope.signal,
      dirField: 'direction',
    })
    this.listQuery = scope.query({
      queryKey: () => DECREE_KEYS.list(this.table.snapshot),
      queryFn: ({ queryKey }) => fetchDecrees(queryKey[2], this.stores.session.userId),
      placeholderData: keepPreviousData,
    })
    this.deleteCmd = createCommand(scope, {
      mutationFn: (id) => deleteDecree(id, this.stores.session.userId),
      invalidate: () => [DECREE_KEYS.all],
      success: 'Успішно видалено',
      error: 'Помилка видалення',
    })
  }

  /** Insert — створення (лише коли не відкрито деталей/редагування). */
  mount() {
    const onKeyUp = (event) => {
      if (event.key === 'Insert' && this.canCreate && !this.isEditOpen && !this.isDetailsOpen) {
        this.selectedId = null
        this.openCreate()
      }
    }
    window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }

  get permissions() {
    return this.stores.session.pagePermissions.decree ?? {}
  }
  get canCreate() {
    return Boolean(this.permissions.create)
  }
  get canUpdate() {
    return Boolean(this.permissions.update)
  }
  get canDelete() {
    return Boolean(this.permissions.delete)
  }

  get filters() {
    return this.table.filters
  }
  get isFetching() {
    return this.listQuery.isFetching
  }
  get decrees() {
    const data = this.listQuery.data
    if (!data) return undefined
    return {
      ...data,
      data: data.data?.map((row) => ({ ...row, typeId: decreeTypeLabel(row.typeId), isActive: booleanLabel(row.isActive) })),
    }
  }
  get pagination() {
    return {
      onLimitChange: this.table.setLimit,
      onPageChange: this.table.setPageFromPaginator,
      currentPage: this.table.page,
      pageSize: this.decrees?.limit,
      totalCount: this.decrees?.total,
    }
  }

  changeOption(key) {
    return (option) => this.table.setFilter(key, option)
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

  deleteDecree(id) {
    return this.deleteCmd.fire(id)
  }

  openDetails(id) {
    this.isDetailsOpen = !this.isDetailsOpen
    this.selectedId = id
  }
  closeDetails() {
    this.selectedId = null
    this.isDetailsOpen = false
  }
  openEdit(id) {
    this.isEditOpen = true
    this.selectedId = id
  }
  closeEdit() {
    this.selectedId = null
    this.isEditOpen = false
  }
  openCreate() {
    this.isCreateOpen = true
  }
  closeCreate() {
    this.isCreateOpen = false
  }
}

const EMPTY_FORM = { isActive: undefined, date: undefined, code: '', typeId: '', link: '', comment: '', rnboId: '' }

/**
 * Форма указу: створення (decreeId = null) або редагування. Файл указу (PDF)
 * і додатки йдуть multipart-запитом; у редагуванні поля форми надсилаються,
 * лише якщо змінились (як в Inertia-версії).
 */
export class DecreeFormViewModel {
  form = { ...EMPTY_FORM }
  decreeFile = null
  // [{ file: File | серверний файл { id, name, path } }]
  attachments = []
  errors = null
  isProtected = true
  isUploadOpen = false

  constructor({ scope, stores, decreeId = null }) {
    this.scope = scope
    this.stores = stores
    this.decreeId = decreeId
    makeViewModel(this, {
      decreeId: false,
      decreeFile: observable.ref,
      attachments: observable.ref,
      errors: observable.ref,
    })

    this.saveCmd = createCommand(scope, {
      mutationFn: (formData) =>
        this.isEditing ? updateDecree(this.decreeId, formData, this.userId) : createDecree(formData, this.userId),
      success: () => (this.isEditing ? 'Оновлено успішно' : 'Створено успішно'),
      error: false,
    })
    this.deleteFileCmd = createCommand(scope, {
      mutationFn: (vars) => deleteDecreeFile(vars, this.userId),
      invalidate: () => [DECREE_KEYS.edit(this.decreeId)],
      success: 'Успішно видалено',
      error: 'Помилка видалення',
    })

    if (this.isEditing) {
      this.detailQuery = scope.query({
        queryKey: DECREE_KEYS.edit(decreeId),
        queryFn: () => fetchDecree(decreeId, this.userId),
      })
      const stop = reaction(() => this.detailQuery.data, (data) => data && this.fillFrom(data), { fireImmediately: true })
      scope.signal.addEventListener('abort', stop, { once: true })
    }
  }

  get userId() {
    return this.stores.session.userId
  }
  get isEditing() {
    return this.decreeId != null
  }
  get decree() {
    return this.detailQuery?.data?.data ?? null
  }
  get isLoading() {
    return this.detailQuery?.isLoading ?? false
  }
  get isPending() {
    return this.saveCmd.isPending
  }
  /** Поля, доступні для редагування (у редагуванні — після "Зняти блокування"). */
  get isLocked() {
    return this.isEditing && this.isProtected
  }

  fillFrom({ data, files }) {
    if (files) {
      this.attachments = decreeAttachments(files).map((file) => ({ file }))
      this.decreeFile = decreeMainFile(files)
    }
    if (data) {
      this.form = {
        code: data.code,
        isActive: BOOLEANS.find((b) => b.value === data.isActive?.toString()),
        comment: data.comment,
        typeId: SANC_DECREE_TYPES.find((i) => i.value === data.typeId),
        rnboId: data.rnboId,
        link: data.link,
        date: data.date ? format(data.date, 'yyyy-MM-dd') : '',
      }
    }
  }

  // ---- поля ----
  clearError(key) {
    this.errors = { ...this.errors, [key]: '' }
  }
  changeSelect(key) {
    return (selected) => {
      this.clearError(key)
      this.form = { ...this.form, [key]: selected }
    }
  }
  changeInput({ target: { name, value } }) {
    this.clearError(name)
    this.form = { ...this.form, [name]: value }
  }
  changeDate(date) {
    if (date) {
      this.form = { ...this.form, date: format(date, 'yyyy-MM-dd') || '' }
      this.clearError('date')
    } else {
      this.form = { ...this.form, date: undefined }
    }
  }
  setProtected(value) {
    this.isProtected = value
  }

  // ---- файли ----
  openUpload() {
    this.isUploadOpen = true
  }
  closeUpload() {
    this.isUploadOpen = false
  }
  setDecreeFile(file) {
    this.isUploadOpen = false
    this.decreeFile = file
  }
  /** Сумісно з UploadFileList: setAttachments(updater | масив). */
  setAttachments(value) {
    this.attachments = typeof value === 'function' ? value(this.attachments) : value
  }
  uploadAttachment({ file, index }) {
    this.attachments =
      index >= 0 && index < this.attachments.length
        ? this.attachments.map((item, idx) => (idx === index ? { ...item, file } : item))
        : [...this.attachments, { file, attached: false }]
  }
  /** Видалення вже збереженого файлу на сервері (указ або додаток). */
  async deleteStoredFile(fileId) {
    try {
      await this.deleteFileCmd.run({ id: this.decreeId, fileId })
      if (this.decreeFile?.id === fileId) this.decreeFile = null
    } catch {
      // тост уже показано
    }
  }

  // ---- збереження ----
  get hasFormChanges() {
    const original = this.decree
    if (!original) return true
    return Object.keys(this.form).some((key) => {
      const value = this.form[key]
      if (key === 'isActive') return original.isActive?.toString() !== value?.value
      if (key === 'typeId') return original.typeId !== value?.value
      if (key === 'date') return (original.date ? format(original.date, 'yyyy-MM-dd') : '') !== value
      return original[key] !== value
    })
  }

  async submit() {
    const formData = buildDecreeFormData({
      form: this.form,
      decreeFile: this.decreeFile,
      attachments: this.attachments.filter((item) => item?.file || item?.id),
      includeForm: !this.isEditing || this.hasFormChanges,
    })
    try {
      const data = await this.saveCmd.run(formData)
      patchDecreeList(this.scope.queryClient, data)
      this.form = { ...EMPTY_FORM }
      return data
    } catch (error) {
      if (error?.status === 422) this.errors = error.payload?.unvalidFields ?? null
      return null
    }
  }
}

/** Деталі указу (модалка) та список файлів у дропдауні рядка (enabled — коли відкрито). */
export class DecreeFilesViewModel {
  open = false

  constructor({ scope, stores, decreeId, lazy = false }) {
    this.scope = scope
    this.stores = stores
    this.lazy = lazy
    makeViewModel(this, { lazy: false })
    this.query = scope.query({
      // Дропдаун рядка — окремий підключ: спільний із модалкою деталей ключ змушував
      // запит модалки (створений у рендері) синхронно оновлювати дропдаун.
      queryKey: lazy ? [...DECREE_KEYS.detail(decreeId), 'files'] : DECREE_KEYS.detail(decreeId),
      queryFn: () => fetchDecree(decreeId, stores.session.userId),
      options: () => ({ enabled: !this.lazy || this.open }),
    })
  }

  setOpen(value) {
    this.open = typeof value === 'function' ? value(this.open) : value
  }
  get decree() {
    return this.query.data?.data ?? null
  }
  get files() {
    return this.query.data?.files ?? []
  }
  get decreeFile() {
    return decreeMainFile(this.files)
  }
  get attachmentFiles() {
    return decreeAttachments(this.files)
  }
  get isPending() {
    return this.query.isPending
  }
}
