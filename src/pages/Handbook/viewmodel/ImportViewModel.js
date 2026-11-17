import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommand } from '../../../shared/mvvm/commands.js'

/**
 * Двокроковий імпорт з Excel-заготовки: файл → превʼю розпарсених рядків
 * з чекбоксами → коміт обраних. Бекенд між кроками нічого не зберігає —
 * рядки живуть у VM. canMarkDefault — лише Дні народження (спільний список).
 */
export class ImportViewModel {
  fileName = ''
  rows = []
  selected = {}
  isDefault = false
  previewed = false

  constructor({ scope, previewSpec, commitSpec, canMarkDefault = false, onImported, onDone }) {
    this.scope = scope
    this.canMarkDefault = canMarkDefault
    this.onImported = onImported
    this.onDone = onDone
    makeViewModel(this, { canMarkDefault: false, onImported: false, onDone: false })

    this.preview = createCommand(scope, previewSpec)
    this.commit = createCommand(scope, commitSpec)
  }

  /** previewed однозначно розрізняє "ще не завантажували" від "завантажили, рядків нуль". */
  get step() {
    return this.previewed ? 'preview' : 'pick'
  }

  get validCount() {
    return this.rows.filter((row) => row.valid).length
  }

  get selectedRows() {
    return this.rows.filter((_, index) => this.selected[index])
  }

  async pickFile(file) {
    if (!file) return
    this.fileName = file.name
    try {
      const result = await this.preview.run(file)
      this.applyPreview(result.rows || [])
    } catch {
      // toast уже показано командою
    }
  }

  applyPreview(rows) {
    this.rows = rows
    this.selected = Object.fromEntries(rows.map((row, index) => [index, row.valid]))
    this.previewed = true
  }

  toggleRow(index) {
    this.selected = { ...this.selected, [index]: !this.selected[index] }
  }

  selectAllValid() {
    this.selected = Object.fromEntries(this.rows.map((row, index) => [index, row.valid]))
  }

  clearAll() {
    this.selected = {}
  }

  setIsDefault(value) {
    this.isDefault = value
  }

  back() {
    this.rows = []
    this.selected = {}
    this.previewed = false
  }

  async submit() {
    if (!this.selectedRows.length) return
    try {
      const entries = await this.commit.run({ rows: this.selectedRows, isDefault: this.canMarkDefault && this.isDefault })
      this.onImported?.(entries)
      this.onDone()
    } catch {
      // toast уже показано командою
    }
  }
}
