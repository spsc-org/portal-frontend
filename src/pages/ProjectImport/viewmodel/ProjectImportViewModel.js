import { observable, reaction } from 'mobx'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommand } from '../../../shared/mvvm/commands.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import { fetchDocument } from '../../../entities/document/documentApi.js'
import {
  downloadLayout,
  fetchDuplicateProjects,
  fetchProjectsByIds,
  findDuplicates,
  importProjects,
  validateImportFile,
} from '../model/projectImportApi.js'
import { SUBJECT_ITEM_TYPE_COLUMN_INDEX } from '../utils.js'

/**
 * /project/upload/v2?documentId=…: шаблон → завантаження Excel (валідація
 * бекендом) → перевірка дублікатів → імпорт (з підтвердженням при попередженнях)
 * → підсумок імпортованих проєктів.
 */
export class ProjectImportViewModel {
  // результат валідації файлу: { data: rows[], errors, warnings }
  projects = null
  errors = null
  warnings = null
  duplicate = null
  isModal = false
  confirmImportOpen = false
  selectedItemTypeId = null
  duplicateDialog = null // { nameUk: [...ids], ... }
  invalidFieldsDialog = null // { message, invalidFields }
  importedProjectIds = []
  importedProjectsData = []
  importedItemTypeId = null
  isImportDetailsLoading = false

  constructor({ scope, stores, documentId }) {
    this.scope = scope
    this.stores = stores
    this.documentId = documentId || null
    makeViewModel(this, {
      documentId: false,
      projects: observable.ref,
      errors: observable.ref,
      warnings: observable.ref,
      duplicate: observable.ref,
      duplicateDialog: observable.ref,
      invalidFieldsDialog: observable.ref,
      importedProjectsData: observable.ref,
    })

    // Колишні Inertia props: itemType, units, types, users, terms, projectActionType, projectState.
    this.optionsQuery = scope.query(pageOptionsQuery('project-upload-v2', documentId ? { documentId } : {}))
    this.documentQuery = scope.query({
      queryKey: ['document-update', this.documentId],
      queryFn: () => fetchDocument(this.documentId, this.userId).then((data) => ({ data })),
      options: () => ({ enabled: Boolean(this.documentId) }),
    })

    this.layoutCmd = createCommand(scope, {
      mutationFn: (subjectTypeId) => downloadLayout({ documentId: this.documentId, subjectTypeId }),
      error: 'Не вдалося завантажити шаблон',
    })
    this.uploadCmd = createCommand(scope, {
      mutationFn: (file) =>
        validateImportFile({ file, documentId: this.documentId, itemTypeId: this.selectedItemTypeId }, this.userId),
      error: false,
    })
    this.duplicatesCmd = createCommand(scope, {
      mutationFn: (body) => findDuplicates(body, this.userId),
      error: 'Помилка відновлення',
    })
    this.importCmd = createCommand(scope, {
      mutationFn: (body) => importProjects({ ...body, documentId: this.documentId }, this.userId),
      error: 'Помилка імпорту',
    })

    // За замовчуванням — другий тип суб'єкта (як в Inertia-версії).
    const stop = reaction(
      () => this.itemType,
      (types) => {
        this.selectedItemTypeId = types?.[1]?.id ?? types?.[0]?.id ?? null
      },
      { fireImmediately: true },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  get userId() {
    return this.stores.session.userId
  }
  get options() {
    return this.optionsQuery.data ?? {}
  }
  get itemType() {
    return this.options.itemType ?? []
  }
  get projectActionType() {
    return this.options.projectActionType ?? []
  }
  get projectState() {
    return this.options.projectState ?? []
  }
  get users() {
    return this.options.users ?? []
  }
  get terms() {
    return this.options.terms ?? []
  }
  get document() {
    return this.documentQuery.data
  }
  get isFetching() {
    return this.documentQuery.isFetching
  }
  /** "Назад": імпорт у документ відкривають зі сторінки документів. */
  get backUrl() {
    return this.documentId ? '/document' : '/project'
  }
  get hasWarnings() {
    return Boolean(this.warnings && Object.keys(this.warnings).length)
  }
  get importedCount() {
    return this.importedProjectIds.length
  }
  get isImported() {
    return this.importCmd.isSuccess
  }

  setSelectedItemTypeId(id) {
    this.selectedItemTypeId = id
  }
  downloadTemplate(typeId) {
    return this.layoutCmd.fire(typeId)
  }

  // ---- файл ----
  openImport() {
    this.isModal = true
  }
  closeImport() {
    this.uploadCmd.reset()
    this.isModal = false
  }

  async upload(file) {
    if (this.projects) this.projects = null
    try {
      const result = await this.uploadCmd.run(file)
      this.isModal = false
      this.projects = result
      if (Object.keys(result?.warnings || {}).length > 0) this.warnings = result.warnings
      this.errors = Object.keys(result?.errors || {}).length > 0 ? result.errors : null
    } catch (error) {
      const responseData = error?.payload || {}
      const responseErrors = responseData?.errors || {}
      if (error?.status === 422) {
        const message = responseErrors?.message || responseData?.message || 'Некоректні параметри запиту'
        toast.error(`422 Невалідні дані. ${message}`)
        // invadiFields — помилка в назві ключа на бекенді, підтримуємо обидва.
        const invalidFields = responseErrors?.invadiFields || responseErrors?.invalidFields
        if (invalidFields) {
          this.invalidFieldsDialog = {
            message,
            invalidFields: Array.isArray(invalidFields) ? invalidFields : [invalidFields],
          }
        }
        return
      }
      toast.error(error?.message || 'Помилка завантаження')
    }
  }
  closeInvalidFields() {
    this.invalidFieldsDialog = null
  }

  // ---- дублікати ----
  async findDuplicates() {
    const body = {}
    if (this.projects?.data?.length) {
      const columns = SUBJECT_ITEM_TYPE_COLUMN_INDEX[this.selectedItemTypeId] || []
      columns.forEach(({ column, index }) => {
        body[column] = this.projects.data.map((item) => item[index])
      })
    }
    try {
      const response = await this.duplicatesCmd.run(body)
      if (!response?.success) return
      if (Object.values(response.duplicates).every((list) => list.length === 0)) {
        toast.error('Дублікатів не знайдено')
        return
      }
      this.duplicateDialog = response.duplicates
      this.duplicate = response.duplicates
    } catch {
      // тост уже показано
    }
  }
  closeDuplicates() {
    this.duplicateDialog = null
  }

  // ---- імпорт ----
  submit() {
    if (this.hasWarnings) {
      this.confirmImportOpen = true
      return
    }
    this.performImport(false)
  }
  confirmImport() {
    this.confirmImportOpen = false
    this.performImport(true)
  }
  cancelImport() {
    this.confirmImportOpen = false
  }

  async performImport(forceImport) {
    const itemTypeId = this.selectedItemTypeId ?? undefined
    let response
    try {
      response = await this.importCmd.run({
        projects: this.projects.data,
        warnings: this.warnings,
        duplicate: this.duplicate,
        itemTypeId,
        forceImport,
      })
    } catch {
      return
    }
    this.uploadCmd.reset()
    this.errors = null
    this.projects = null

    const insertedIds = response?.insertedProjectIds || []
    this.importedProjectIds = insertedIds
    this.importedItemTypeId = itemTypeId ?? null
    this.importedProjectsData = []
    if (!insertedIds.length) return

    this.isImportDetailsLoading = true
    try {
      const details = await fetchProjectsByIds(insertedIds, { limit: Math.max(insertedIds.length, 100), page: 0 }, this.userId)
      this.importedProjectsData = details?.data || []
    } catch {
      toast.error('Не вдалося отримати деталі імпорту')
    } finally {
      this.isImportDetailsLoading = false
    }
  }

  /** Після імпорту — до списку проєктів (legacy /project, з фільтром документа). */
  openProjects() {
    window.open(this.documentId ? `/project?documentId=${this.documentId}` : '/project', '_self')
  }
}

const DUPLICATE_TABS = [
  { value: 'nameUk', label: 'Назва українською' },
  { value: 'nameRu', label: 'Назва російською' },
  { value: 'nameEn', label: 'Назва іноземною' },
  { value: 'drsId', label: 'Код в ДРС' },
  { value: 'tax', label: 'Tax' },
  { value: 'reg', label: 'Reg' },
  { value: 'doc', label: 'Doc' },
  { value: 'imo', label: 'IMO' },
  { value: 'mmsi', label: 'MMSI' },
]

/** Модалка дублікатів: вкладка = поле збігу, у ній — знайдені проєкти (сторінками). */
export class DuplicateProjectsViewModel {
  params = { limit: 10, page: 0 }
  tab

  constructor({ scope, stores, duplicates }) {
    this.scope = scope
    this.stores = stores
    this.duplicates = duplicates
    this.tab = this.tabs[0]?.value
    makeViewModel(this, { duplicates: false })
    this.query = scope.query({
      queryKey: () => ['projects-calcSearch', { ...this.params }, this.tab],
      queryFn: () => (this.ids ? fetchDuplicateProjects(this.ids, this.params, this.stores.session.userId) : undefined),
      options: () => ({ enabled: Boolean(this.ids?.length) }),
    })
  }

  get tabs() {
    return DUPLICATE_TABS.filter((item) => Boolean(this.duplicates?.[item.value]))
  }
  get ids() {
    return this.duplicates?.[this.tab]
  }
  get projects() {
    return this.query.data
  }
  get isLoading() {
    return this.query.isLoading
  }

  setTab(value) {
    this.tab = value
  }
  setLimit(limit) {
    this.params = { ...this.params, page: 0, limit }
  }
  setPage(oneBasedPage) {
    this.params = { ...this.params, page: oneBasedPage - 1 }
  }
}
