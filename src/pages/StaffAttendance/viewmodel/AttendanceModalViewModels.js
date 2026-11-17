import { observable } from 'mobx'
import { format } from 'date-fns'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommands } from '../../../shared/mvvm/commands.js'
import { staffOptionsQuery } from '../../Staff/model/staffCommands.js'
import { VALIDATION_MESSAGES } from '../constants/attendanceConfig.js'
import { summaryPrintUrl } from '../model/attendanceApi.js'
import { ATTENDANCE_COMMANDS, attendanceQueries, errorToast, validationToast } from '../model/attendanceCommands.jsx'

const today = () => format(new Date(), 'yyyy-MM-dd')

/** "Стройовка" на обрану дату (модалка монтується лише відкритою). */
export class StatisticsViewModel {
  date = today()

  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query({
      queryKey: () => attendanceQueries.statistics(this.date).queryKey,
      queryFn: () => attendanceQueries.statistics(this.date).queryFn(),
      staleTime: 0,
    })
  }

  get response() {
    return this.query.data
  }
  get statistics() {
    return this.response?.data || {}
  }
  get isLoading() {
    return this.query.isFetching
  }
  get isToday() {
    return this.response?.date === today()
  }
  setDate(value) {
    this.date = value
  }
}

/** Зведена таблиця днів відсутності: локальні фільтри стартують з фільтрів сторінки. */
export class SummaryViewModel {
  filters

  constructor({ scope, initialFilters }) {
    this.scope = scope
    this.filters = {
      startDate: initialFilters?.startDate || '',
      endDate: initialFilters?.endDate || '',
      users: initialFilters?.users || [],
      types: initialFilters?.types || [],
      statuses: initialFilters?.statuses || ['approved'],
    }
    makeViewModel(this, { filters: observable.ref })
    this.optionsQuery = scope.query(staffOptionsQuery)
    this.query = scope.query({
      queryKey: () => attendanceQueries.summary(this.filters).queryKey,
      queryFn: () => attendanceQueries.summary(this.filters).queryFn(),
      options: () => ({ enabled: Boolean(this.filters.startDate && this.filters.endDate) }),
      staleTime: 0,
    })
  }

  get users() {
    return this.optionsQuery.data?.data?.users || []
  }
  get allAbsenceTypes() {
    return this.optionsQuery.data?.data?.absence_types || []
  }
  get summary() {
    return this.query.data?.data || {}
  }
  get isLoading() {
    return this.query.isFetching
  }

  patch(values) {
    this.filters = { ...this.filters, ...values }
  }
  setDate(field, value) {
    this.patch({ [field]: value })
  }
  setUsers(selected) {
    this.patch({ users: selected ? selected.map((u) => u.id) : [] })
  }
  setTypes(selected) {
    this.patch({ types: selected ? selected.map((t) => t.value) : [] })
  }
  setStatuses(selected) {
    this.patch({ statuses: selected ? selected.map((s) => s.value) : [] })
  }
  /** Друк — Blade-сторінка бекенду в новій вкладці. */
  print() {
    window.open(summaryPrintUrl(this.filters), '_blank')
  }
}

const EMPTY_DOC = { document_number: '', document_date: '', description: '' }

/** Нормалізовані поля документа або null (з тостом), якщо форма неповна. */
function validateDocument(form) {
  const document_number = form.document_number?.trim()
  const document_date = form.document_date?.trim()
  if (!document_number) {
    validationToast(VALIDATION_MESSAGES.SPECIFY_DOCUMENT_NUMBER)
    return null
  }
  if (!document_date) {
    validationToast(VALIDATION_MESSAGES.SPECIFY_DOCUMENT_DATE)
    return null
  }
  return { document_number, document_date, description: form.description?.trim() || '' }
}

/**
 * Документи відсутності. Локальна копія списку оновлюється одразу після
 * успіху мутації (календар інвалідується командою паралельно).
 */
export class DocumentManagerViewModel {
  isAdding = false
  editingId = null
  formData = { ...EMPTY_DOC, document_date: today() }
  editingFormData = { ...EMPTY_DOC }
  documents = []

  constructor({ scope, absenceId, documents }) {
    this.scope = scope
    this.absenceId = absenceId
    this.documents = documents || []
    makeViewModel(this, { absenceId: false, documents: observable.ref })
    this.cmd = createCommands(scope, {
      addDocument: ATTENDANCE_COMMANDS.addDocument,
      updateDocument: ATTENDANCE_COMMANDS.updateDocument,
      deleteDocument: ATTENDANCE_COMMANDS.deleteDocument,
    })
  }

  get isBusy() {
    return this.cmd.addDocument.isPending || this.cmd.deleteDocument.isPending || this.cmd.updateDocument.isPending
  }
  get isRowBusy() {
    return this.cmd.deleteDocument.isPending || this.cmd.updateDocument.isPending
  }

  toggleAdding() {
    this.isAdding = !this.isAdding
  }
  setFormField(key, value) {
    this.formData = { ...this.formData, [key]: value }
  }
  setEditingField(key, value) {
    this.editingFormData = { ...this.editingFormData, [key]: value }
  }
  cancelAdd() {
    this.isAdding = false
    this.formData = { ...EMPTY_DOC, document_date: today() }
  }

  async add() {
    if (!this.absenceId) {
      validationToast(VALIDATION_MESSAGES.SAVE_ABSENCE_FIRST)
      return
    }
    const data = validateDocument(this.formData)
    if (!data) return
    try {
      const result = await this.cmd.addDocument.run({ absenceId: this.absenceId, data })
      if (result?.data) {
        this.documents = [...this.documents, result.data]
        this.cancelAdd()
      }
    } catch (error) {
      errorToast('Помилка додавання документа', error, 'Не вдалося додати документ')
    }
  }

  async remove(docId) {
    try {
      await this.cmd.deleteDocument.run(docId)
      this.documents = this.documents.filter((d) => d.id !== docId)
    } catch (error) {
      errorToast('Помилка видалення документа', error, 'Не вдалося видалити документ')
    }
  }

  startEdit(doc) {
    this.editingId = doc.id
    this.editingFormData = {
      document_number: doc.document_number,
      document_date: doc.document_date,
      description: doc.description || '',
    }
  }
  cancelEdit() {
    this.editingId = null
    this.editingFormData = { ...EMPTY_DOC }
  }

  async submitEdit() {
    const data = validateDocument(this.editingFormData)
    if (!data) return
    const docId = this.editingId
    try {
      const result = await this.cmd.updateDocument.run({ docId, data })
      if (result?.data) {
        this.documents = this.documents.map((d) => (d.id === docId ? result.data : d))
        this.editingId = null
      }
    } catch (error) {
      errorToast('Помилка оновлення документа', error, 'Не вдалося оновити документ')
    }
  }
}

/** Деталі відсутності в hover-тултипі (VM живе, лише поки тултип видно). */
export class AbsenceDetailsViewModel {
  constructor({ scope, absenceId }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query(attendanceQueries.absence(absenceId))
  }

  get data() {
    return this.query.data?.data
  }
  get isLoading() {
    return this.query.isLoading
  }
}
