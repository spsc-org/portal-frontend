import axios from 'axios'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { rootStore } from '../../../stores/RootStore.js'

// /api/reason-rules (особисті правила користувача) і /global (системні, лише перегляд) —
// авторизація заголовком userId, як legacy ReasonRulesModalManager.
const headers = () => ({ userId: rootStore.session.userId })
const unwrap = (response, fallback) => {
  if (!response.data?.success) throw new Error(response.data?.message || fallback)
  return response.data.data
}
const api = {
  personal: async () => unwrap(await axios.get('/api/reason-rules', { headers: headers() }), 'Помилка завантаження правил') ?? [],
  global: async () => unwrap(await axios.get('/api/reason-rules/global', { headers: headers() }), 'Помилка завантаження правил') ?? [],
  create: async (body) => unwrap(await axios.post('/api/reason-rules', body, { headers: headers() }), 'Помилка при додаванні'),
  update: async (id, body) => unwrap(await axios.put(`/api/reason-rules/${id}`, body, { headers: headers() }), 'Помилка збереження'),
  remove: async (id) => unwrap(await axios.delete(`/api/reason-rules/${id}`, { headers: headers() }), 'Помилка видалення'),
}

const PERSONAL_KEY = ['reason-rules-personal']
const GLOBAL_KEY = ['reason-rules-global']
const NONE = []
const EMPTY_DRAFT = { phrase: '', category: 'warning', countryId: '', caseSensitive: false }

export const RULE_CATEGORIES = [
  { id: 'warning', caption: 'Увага', icon: 'fa-triangle-exclamation', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700' },
  { id: 'forbidden', caption: 'Заборона', icon: 'fa-ban', badge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700' },
  { id: 'required', caption: "Обов'язково", icon: 'fa-circle-check', badge: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700' },
]

/** Підпис тоста за полем, яке змінилось (legacy saveRule). */
function savedMessage(patch, rule) {
  if ('is_active' in patch) return rule.is_active ? 'Правило активовано' : 'Правило деактивовано'
  if ('category' in patch) return 'Категорію змінено'
  if ('target_country_id' in patch) return 'Країну змінено'
  if ('is_case_sensitive' in patch) return 'Налаштування регістру змінено'
  if ('phrase' in patch) return 'Фразу оновлено'
  return 'Зміни збережено'
}

/** Модалка "Правила обґрунтувань" сторінки /project: особисті (CRUD) і системні (перегляд). */
export class PersonalReasonRulesViewModel {
  isOpen = false
  tab = 'personal'
  draft = EMPTY_DRAFT

  constructor({ scope, page }) {
    this.scope = scope
    this.page = page
    makeViewModel(this, { page: false })
    this.personalQuery = scope.query({ queryKey: PERSONAL_KEY, queryFn: api.personal, options: () => ({ enabled: this.isOpen }) })
    this.globalQuery = scope.query({ queryKey: GLOBAL_KEY, queryFn: api.global, options: () => ({ enabled: this.isOpen }) })
  }

  get personal() {
    return this.personalQuery.data ?? NONE
  }
  get global() {
    return this.globalQuery.data ?? NONE
  }
  get isLoading() {
    return this.tab === 'personal' ? this.personalQuery.isLoading : this.globalQuery.isLoading
  }
  get countries() {
    const list = Array.isArray(this.page.voc?.country) ? this.page.voc.country : NONE
    return list.map((item) => ({ id: item.id, caption: item.caption })).sort((a, b) => a.caption.localeCompare(b.caption))
  }
  countryName(id) {
    return this.countries.find((item) => Number(item.id) === Number(id))?.caption ?? ''
  }

  open() {
    this.isOpen = true
    this.scope.invalidate(PERSONAL_KEY)
    this.scope.invalidate(GLOBAL_KEY)
  }
  close() {
    this.isOpen = false
  }
  setTab(tab) {
    this.tab = tab
  }
  setDraft(patch) {
    this.draft = { ...this.draft, ...patch }
  }

  setPersonal(updater) {
    this.scope.queryClient.setQueryData(PERSONAL_KEY, (old) => updater(old ?? []))
  }

  async add() {
    const phrase = this.draft.phrase.trim()
    if (!phrase) return false
    try {
      const rule = await api.create({
        phrase,
        category: this.draft.category,
        is_case_sensitive: this.draft.caseSensitive,
        target_country_id: this.draft.countryId || null,
        field_type: 'reasoning',
      })
      this.setPersonal((rules) => [...rules, rule])
      this.setDraft(EMPTY_DRAFT)
      toast.success('Правило додано')
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    }
  }

  /** Оптимістичне оновлення з відкатом при помилці. */
  async update(id, patch) {
    const before = this.personal.find((rule) => rule.id === id)
    if (!before) return
    if ('phrase' in patch && patch.phrase === before.phrase) return
    this.setPersonal((rules) => rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)))
    try {
      const saved = await api.update(id, patch)
      const next = { ...before, ...patch, ...(saved ?? {}) }
      this.setPersonal((rules) => rules.map((rule) => (rule.id === id ? next : rule)))
      toast.success(savedMessage(patch, next))
    } catch (error) {
      this.setPersonal((rules) => rules.map((rule) => (rule.id === id ? before : rule)))
      toast.error(error.message)
    }
  }

  async remove(id) {
    if (!window.confirm('Ви впевнені, що хочете видалити це правило?')) return
    try {
      await api.remove(id)
      this.setPersonal((rules) => rules.filter((rule) => rule.id !== id))
      toast.success('Правило видалено')
    } catch (error) {
      toast.error(error.message)
    }
  }
}
