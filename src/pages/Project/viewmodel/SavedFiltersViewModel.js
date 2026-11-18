import { observable, toJS } from 'mobx'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { emptyFilterValues } from '../features/filter-projects/model/filterConfig.js'
import {
  compactValues,
  describeValues,
  findDefault,
  newSetId,
  normalizeValues,
  pluralFilters,
  readSavedFilters,
  sameValues,
  validateSetName,
  withDefault,
  writeSavedFilters,
} from '../features/saved-filters/model/savedFilters.js'

/**
 * Збережені набори фільтрів /project (макет «Проєкти v2 — фільтри зверху»): меню «Збережені:»,
 * бейдж «змінено», «Зберегти фільтри» (новий / оновити поточний) і «Керувати наборами».
 * Сховище — localStorage на користувача (features/saved-filters/model/savedFilters.js).
 * Значення фільтрів — у page.values; цей VM лише знає, який набір активний.
 */
export class SavedFiltersViewModel {
  sets = []
  activeId = null
  // меню «Збережені:»
  menuOpen = false
  query = ''
  // модалка «Зберегти фільтри»: { mode: 'new' | 'update', name, isDefault, error } | null
  saveDraft = null
  // «Керувати наборами»: { [id]: name } для перейменування
  manageOpen = false
  renames = {}
  renameErrors = {}

  constructor({ page, storage = window.localStorage }) {
    this.page = page
    this.storage = storage
    const saved = readSavedFilters(storage, page.userId, emptyFilterValues())
    this.sets = saved.sets
    this.activeId = saved.activeId
    makeViewModel(this, { page: false, storage: false, sets: observable.ref, renames: observable.ref, renameErrors: observable.ref })
  }

  // ---- похідне ----
  get active() {
    return this.sets.find((set) => set.id === this.activeId) ?? null
  }
  get defaultSet() {
    return findDefault(this.sets)
  }
  /** Поточні фільтри відрізняються від вибраного набору → бейдж «змінено». */
  get isModified() {
    return Boolean(this.active) && !sameValues(this.active.values, this.page.values)
  }
  get hasActiveFilters() {
    return Object.keys(compactValues(this.page.values)).length > 0
  }
  /** Є набір за замовчуванням, а поточні фільтри від нього відрізняються — «Скинути все» має сенс. */
  get canResetToDefault() {
    return Boolean(this.defaultSet) && !sameValues(this.defaultSet.values, this.page.values)
  }
  /** «Зберегти фільтри» видно, коли є що зберегти: немає вибраного набору або його змінено. */
  get canSave() {
    return this.hasActiveFilters && (!this.active || this.isModified)
  }
  get currentSummary() {
    const { count, captions } = describeValues(this.page.values)
    return count ? `${pluralFilters(count)} · ${captions.join(', ')}` : 'Без фільтрів'
  }
  get items() {
    const q = this.query.trim().toLocaleLowerCase('uk')
    return this.sets
      .filter((set) => !q || set.name.toLocaleLowerCase('uk').includes(q))
      .map((set) => {
        const { count, captions } = describeValues(set.values)
        return {
          id: set.id,
          name: set.name,
          isDefault: set.isDefault,
          isActive: set.id === this.activeId,
          summary: count ? `${pluralFilters(count)} · ${captions.join(', ')}` : 'Без фільтрів',
        }
      })
  }

  // ---- persist ----
  persist() {
    writeSavedFilters(this.storage, this.page.userId, { sets: toJS(this.sets), activeId: this.activeId })
  }

  // ---- меню ----
  setMenuOpen(open) {
    this.menuOpen = open
    if (!open) this.query = ''
  }
  setQuery(value) {
    this.query = value
  }

  /** Застосувати набір: значення фільтрів сторінки = значення набору. */
  apply(id) {
    const set = this.sets.find((item) => item.id === id)
    if (!set) return
    this.page.applyFilterValues(normalizeValues(set.values, emptyFilterValues()))
    this.activeId = id
    this.menuOpen = false
    this.query = ''
    this.persist()
  }

  remove(id) {
    this.sets = this.sets.filter((set) => set.id !== id)
    if (this.activeId === id) this.activeId = null
    this.persist()
  }

  /** Фільтри очищено / застосовано не з набору — набір більше не активний. */
  detach() {
    if (this.activeId === null) return
    this.activeId = null
    this.persist()
  }

  /** «Скинути все»: набір за замовчуванням, якщо він є; інакше — порожні фільтри. */
  resetToDefault() {
    const def = this.defaultSet
    if (def) {
      this.apply(def.id)
      return true
    }
    this.detach()
    return false
  }

  // ---- «Зберегти фільтри» ----
  /** Відкрити збереження: якщо вибраний набір змінено — пропонуємо оновити його. */
  openSave(mode) {
    const update = mode === 'update' || (mode === undefined && this.isModified)
    this.saveDraft = update && this.active
      ? { mode: 'update', name: this.active.name, isDefault: this.active.isDefault, error: null }
      : { mode: 'new', name: '', isDefault: false, error: null }
    this.menuOpen = false
  }
  closeSave() {
    this.saveDraft = null
  }
  setSaveMode(mode) {
    if (!this.saveDraft) return
    if (mode === 'update' && this.active) {
      this.saveDraft = { mode, name: this.active.name, isDefault: this.active.isDefault, error: null }
    } else {
      this.saveDraft = { mode: 'new', name: '', isDefault: false, error: null }
    }
  }
  setSaveName(name) {
    if (this.saveDraft) this.saveDraft = { ...this.saveDraft, name, error: null }
  }
  setSaveDefault(isDefault) {
    if (this.saveDraft) this.saveDraft = { ...this.saveDraft, isDefault }
  }
  get canUpdateActive() {
    return Boolean(this.active)
  }
  submitSave() {
    const draft = this.saveDraft
    if (!draft) return
    const values = compactValues(this.page.values)
    const now = new Date().toISOString()
    if (draft.mode === 'update' && this.active) {
      const id = this.active.id
      let sets = this.sets.map((set) => (set.id === id ? { ...set, values, updatedAt: now } : set))
      if (draft.isDefault !== this.active.isDefault) sets = withDefault(sets, draft.isDefault ? id : null)
      this.sets = sets
      this.activeId = id
    } else {
      const error = validateSetName(draft.name, this.sets)
      if (error) {
        this.saveDraft = { ...draft, error }
        return
      }
      const id = newSetId()
      let sets = [...this.sets, { id, name: draft.name.trim(), values, isDefault: false, updatedAt: now }]
      if (draft.isDefault) sets = withDefault(sets, id)
      this.sets = sets
      this.activeId = id
    }
    this.saveDraft = null
    this.persist()
  }

  // ---- «Керувати наборами» ----
  openManage() {
    this.menuOpen = false
    this.manageOpen = true
    this.renames = Object.fromEntries(this.sets.map((set) => [set.id, set.name]))
    this.renameErrors = {}
  }
  closeManage() {
    this.manageOpen = false
    this.renames = {}
    this.renameErrors = {}
  }
  setRename(id, name) {
    this.renames = { ...this.renames, [id]: name }
    if (this.renameErrors[id]) this.renameErrors = { ...this.renameErrors, [id]: null }
  }
  /** Зберегти назву (blur / Enter); невалідна — лишаємо в полі з помилкою. */
  commitRename(id) {
    const set = this.sets.find((item) => item.id === id)
    const name = this.renames[id]
    if (!set || name === undefined || name.trim() === set.name) return
    const error = validateSetName(name, this.sets, id)
    if (error) {
      this.renameErrors = { ...this.renameErrors, [id]: error }
      return
    }
    this.sets = this.sets.map((item) => (item.id === id ? { ...item, name: name.trim(), updatedAt: new Date().toISOString() } : item))
    this.renames = { ...this.renames, [id]: name.trim() }
    this.persist()
  }
  toggleDefault(id) {
    const set = this.sets.find((item) => item.id === id)
    if (!set) return
    this.sets = withDefault(this.sets, set.isDefault ? null : id)
    this.persist()
  }
  /** Перезаписати набір поточними фільтрами сторінки. */
  overwrite(id) {
    const values = compactValues(this.page.values)
    this.sets = this.sets.map((set) => (set.id === id ? { ...set, values, updatedAt: new Date().toISOString() } : set))
    this.activeId = id
    this.persist()
  }
  removeFromManage(id) {
    this.remove(id)
    const { [id]: _removed, ...rest } = this.renames
    this.renames = rest
  }

  /** Escape: закрити верхнє (меню / модалки). */
  closeTop() {
    if (this.saveDraft) {
      this.closeSave()
      return true
    }
    if (this.manageOpen) {
      this.closeManage()
      return true
    }
    if (this.menuOpen) {
      this.setMenuOpen(false)
      return true
    }
    return false
  }
}
