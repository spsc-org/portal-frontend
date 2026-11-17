import { observable } from 'mobx'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { ANALYSED_FIELDS, ROW_FIELDS, analysisKey, normalizeResults } from '../model/liveAnalysisModel.js'

const NOT_CHECKED = (key) => ({ status: 'not-checked', message: `Поле ${key} не було проаналізовано`, completedLayers: [] })

/**
 * Стан живого аналізу одного екрана (картка або форма) — заміна DOM-контейнерів
 * `.analysis-container` legacy LiveAnalysisManager: результати за ключем поле[:objectId],
 * поля, що зараз аналізуються, і поля з помилкою запиту. Запит виконує власник
 * (ProjectCardViewModel / ProjectFormViewModel), тут — лише стан.
 */
export class LiveAnalysisState {
  results = {} // key → result
  pending = [] // поля, що аналізуються
  failed = [] // поля, запит для яких упав
  stale = [] // поля, змінені після аналізу (підсвітка тексту ховається)
  checked = [] // поля, для яких аналіз завершився
  requestId = 0

  constructor() {
    this.latest = {} // поле → id останнього запиту, що його аналізує
    makeViewModel(this, { latest: false, results: observable.ref, pending: observable.ref, failed: observable.ref, stale: observable.ref, checked: observable.ref })
  }

  reset() {
    this.results = {}
    this.pending = []
    this.failed = []
    this.stale = []
    this.checked = []
    this.latest = {}
    this.requestId += 1
  }

  /** Початок запиту по `fields`: повний аналіз (усі поля) скидає попередні результати. */
  begin(fields = ANALYSED_FIELDS) {
    const full = fields.length === ANALYSED_FIELDS.length
    if (full) {
      this.results = {}
      this.checked = []
    }
    else this.results = Object.fromEntries(Object.entries(this.results).filter(([key]) => !fields.includes(key.split(':')[0])))
    this.pending = [...new Set([...this.pending, ...fields])]
    this.failed = this.failed.filter((field) => !fields.includes(field))
    this.stale = this.stale.filter((field) => !fields.includes(field))
    this.requestId += 1
    for (const field of fields) this.latest[field] = this.requestId
    return this.requestId
  }

  /** Поля запиту, для яких він досі останній (пізні відповіді старіших запитів ігноруються). */
  ownFields(requestId, fields) {
    return fields.filter((field) => this.latest[field] === requestId)
  }

  apply(requestId, data, fields, rowKeys) {
    const own = this.ownFields(requestId, fields)
    if (own.length === 0) return
    const fresh = Object.entries(normalizeResults(data, rowKeys)).filter(([key]) => own.includes(key.split(':')[0]))
    this.results = { ...this.results, ...Object.fromEntries(fresh) }
    this.pending = this.pending.filter((field) => !own.includes(field))
    this.checked = [...new Set([...this.checked, ...own])]
  }

  fail(requestId, fields) {
    const own = this.ownFields(requestId, fields)
    this.pending = this.pending.filter((field) => !own.includes(field))
    this.failed = [...new Set([...this.failed, ...own])]
  }

  markStale(field) {
    if (!this.stale.includes(field) && ANALYSED_FIELDS.includes(field)) this.stale = [...this.stale, field]
  }

  /**
   * Стан значка поля: { status: 'loading' | 'error' | 'idle' } або результат
   * (поле проаналізоване, але без відповіді для цього ключа → "не перевірено").
   */
  badge(field, objectId = null) {
    if (this.pending.includes(field)) return { status: 'loading' }
    if (this.failed.includes(field)) return { status: 'error' }
    const key = analysisKey(field, objectId)
    const result = this.results[key]
    if (result) return result
    return this.checked.includes(field) ? NOT_CHECKED(key) : { status: 'idle' }
  }

  /** Результат текстового поля для підсвітки (не для рядків і не застарілий). */
  textResult(field) {
    if (ROW_FIELDS.includes(field) || this.stale.includes(field)) return null
    return this.results[field] ?? null
  }
}
