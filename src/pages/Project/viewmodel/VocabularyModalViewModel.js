import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { PROJECT_KEYS } from '../model/projectModel.js'
import { VOCABULARY_KINDS, addVocabularyItem } from '../model/vocabularyModel.js'

/**
 * Модалки "Додати ідентифікатор / атрибут / категорію" (legacy IdentifierModalManager,
 * AttributeModalManager, CategoryModalManager). Після збереження перечитується словник
 * /api/voc_project — нові значення одразу з'являються в селектах форми проєкту.
 */
export class VocabularyModalViewModel {
  kind = null // 'identifier' | 'attribute' | 'category' | null
  values = {}
  errors = {}
  general = []
  saving = false

  constructor({ scope, page }) {
    this.scope = scope
    this.page = page
    makeViewModel(this, { page: false })
  }

  get isOpen() {
    return this.kind != null
  }
  get title() {
    return this.kind ? VOCABULARY_KINDS[this.kind].title : ''
  }
  get countries() {
    const list = Array.isArray(this.page.voc?.country) ? this.page.voc.country : []
    return list.map((item) => ({ id: String(item.id), caption: item.caption }))
  }

  open(kind) {
    this.kind = kind
    this.values = { ...VOCABULARY_KINDS[kind].empty }
    this.errors = {}
    this.general = []
  }
  close() {
    this.kind = null
  }
  setValue(name, value) {
    this.values = { ...this.values, [name]: value }
    if (this.errors[name]) this.errors = { ...this.errors, [name]: undefined }
  }

  async submit(event) {
    event?.preventDefault?.()
    if (this.saving || !this.kind) return
    const kind = this.kind
    this.saving = true
    this.errors = {}
    this.general = []
    let result
    try {
      result = await addVocabularyItem(kind, this.values)
    } catch (error) {
      result = { ok: false, errors: {}, general: [error.message || 'Помилка мережі'] }
    }
    this.finish(kind, result)
  }

  finish(kind, result) {
    this.saving = false
    if (!result.ok) {
      this.errors = result.errors
      this.general = result.general
      return
    }
    toast.success(`${VOCABULARY_KINDS[kind].title.replace('Додати', 'Додано')}: ${result.data?.caption ?? result.data?.name_uk ?? ''}`.trim())
    this.scope.invalidate(PROJECT_KEYS.voc)
    this.kind = null
  }
}
