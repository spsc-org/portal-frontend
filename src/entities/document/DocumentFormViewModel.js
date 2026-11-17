import { observable, reaction } from 'mobx'
import { format } from 'date-fns'
import { makeViewModel } from '../../shared/mvvm/makeViewModel.js'
import { createCommand } from '../../shared/mvvm/commands.js'
import { DOCUMENT_KEYS, createDocument, fetchDocument, updateDocument } from './documentApi.js'

const EMPTY_FORM = {
  caption: '',
  regNum: '',
  typeId: '',
  regDate: '',
  unitId: '',
  comments: '',
  performerId: '',
  path: '',
}

/**
 * Форма документа — створення (mode 'create', CreateDocumentModal) або
 * редагування (mode 'update', UpdateDocumentModal). Словники { types, units, users }
 * приходять з options сторінки, що відкрила модалку.
 *
 * Після успіху рядок списку документів оновлюється в кеші (isUpdated —
 * підсвітка в Table), без повного перезапиту, як в Inertia-версії.
 */
export class DocumentFormViewModel {
  form = { ...EMPTY_FORM }
  errors = null
  // Дата реєстрації заблокована, поки не знято прапорець (лише редагування).
  isProtected = true

  constructor({ scope, stores, mode = 'create', documentId = null, dictionaries }) {
    this.scope = scope
    this.stores = stores
    this.mode = mode
    this.documentId = documentId
    this.dictionaries = dictionaries
    makeViewModel(this, { mode: false, documentId: false, dictionaries: false, errors: observable.ref })

    if (!this.isEditing) this.form = { ...EMPTY_FORM, typeId: this.types[0] }

    this.save = createCommand(scope, {
      mutationFn: (body) =>
        this.isEditing
          ? updateDocument(this.documentId, body, this.userId)
          : createDocument(body, this.userId),
      success: () => (this.isEditing ? 'Оновлено успішно' : 'Створено успішно'),
      error: false,
    })

    if (this.isEditing) {
      this.detailQuery = scope.query({
        queryKey: ['document-update', documentId],
        queryFn: () => fetchDocument(documentId, this.userId),
      })
      const stop = reaction(
        () => this.detailQuery.data,
        (doc) => doc && this.fillFrom(doc),
        { fireImmediately: true },
      )
      scope.signal.addEventListener('abort', stop, { once: true })
    }
  }

  get userId() {
    return this.stores.session.userId
  }
  get isEditing() {
    return this.mode === 'update'
  }
  get types() {
    return this.dictionaries?.types ?? []
  }
  get units() {
    return this.dictionaries?.units ?? []
  }
  get users() {
    return this.dictionaries?.users ?? []
  }
  get document() {
    return this.detailQuery?.data ?? null
  }
  get isPending() {
    return this.save.isPending
  }

  fillFrom(doc) {
    this.form = {
      caption: doc.caption || '',
      regNum: doc.regNum || '',
      regDate: doc.regDate,
      path: doc.path || '',
      comments: doc.comments || '',
      typeId: this.types.find((t) => t.id === doc.typeId),
      unitId: this.units.find((u) => u.id === doc.unitId),
      performerId: this.users.find((u) => u.id === doc.performerId),
    }
  }

  clearError(key) {
    this.errors = { ...this.errors, [key]: '' }
  }

  /** Вибір підрозділу підставляє його шаблон номера (у створенні — лише в порожній номер). */
  changeSelect(key) {
    return (selected) => {
      this.clearError(key)
      const fillPattern = key === 'unitId' && (this.isEditing || this.form.regNum === '')
      this.form = { ...this.form, [key]: selected, ...(fillPattern ? { regNum: selected?.pattern || '' } : {}) }
    }
  }

  changeField({ target }) {
    this.clearError(target.name)
    this.form = { ...this.form, [target.name]: target.value }
  }

  changeDate(date) {
    if (date) {
      this.form = { ...this.form, regDate: format(date, 'yyyy-MM-dd') || '' }
      this.clearError('regDate')
    } else {
      this.form = { ...this.form, regDate: undefined }
    }
  }

  /** Номер, що збігся з шаблоном підрозділу, обирає цей підрозділ. */
  changeRegNum({ target }) {
    const unit = this.units.find((item) => item.pattern === target.value)
    this.form = { ...this.form, regNum: target.value, ...(target.value.length > 1 && unit ? { unitId: unit } : {}) }
    this.clearError('regNum')
  }

  setProtected(value) {
    this.isProtected = value
  }

  get body() {
    return {
      ...this.form,
      typeId: this.form.typeId?.id,
      unitId: this.form.unitId?.id,
      performerId: this.form.performerId?.id,
    }
  }

  /** @returns {Promise<object|null>} відповідь бекенду або null при помилці. */
  async submit() {
    try {
      const data = await this.save.run(this.body)
      this.patchListCache(data)
      this.form = this.isEditing ? { ...EMPTY_FORM } : { ...EMPTY_FORM, typeId: this.types[0] }
      return data
    } catch (error) {
      if (error?.status === 422 || error?.response?.status === 422) {
        this.errors = (error.payload ?? error.response?.data)?.unvalidFields ?? null
      }
      return null
    }
  }

  patchListCache(data) {
    if (!data?.success || !data.data) return
    this.scope.queryClient.setQueriesData({ queryKey: DOCUMENT_KEYS.all }, (old) => {
      if (!Array.isArray(old?.data)) return old
      const row = { ...data.data, isUpdated: true }
      const rows = this.isEditing
        ? old.data.map((item) => (item.id === row.id ? row : item))
        : [row, ...old.data]
      return { ...old, data: rows }
    })
  }
}
