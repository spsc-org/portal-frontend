import { observable } from 'mobx'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  CONSOLIDATED_DEBOUNCE_MS,
  CONSOLIDATED_MIN_QUERY,
  mergeResults,
  searchConsolidated,
  sortFieldRecords,
} from '../model/consolidatedSearchModel.js'

/**
 * Пошук збігів у консолідованій базі по полях форми проєкту (legacy _fieldSearchResults):
 * ключ — поле (nameUk/nameRu/nameEn) або рядок ідентифікатора (identifier-{id|tmp-key}).
 * Стан значка: undefined (ще не шукали) | 'loading' | 'result' | 'empty'.
 */
export class ConsolidatedSearchState {
  results = {} // key → { query, data: { total, data, time } }
  status = {} // key → 'loading' | 'result' | 'empty'
  modal = null // { kind: 'field', key } | { kind: 'all' } | null

  constructor({ excludeProjectId }) {
    // () => id проєкту, що редагується (його не показуємо серед збігів)
    this.excludeProjectId = excludeProjectId
    this.timers = new Map()
    this.requests = new Map()
    makeViewModel(this, { excludeProjectId: false, timers: false, requests: false, results: observable.ref, status: observable.ref, modal: observable.ref })
  }

  get all() {
    return mergeResults(this.results)
  }
  get total() {
    return this.all.length
  }
  count(key) {
    return this.results[key]?.data.total ?? 0
  }
  /** Модалка одного поля: { label key, query, time, records } */
  get fieldModal() {
    if (this.modal?.kind !== 'field') return null
    const result = this.results[this.modal.key]
    return result ? { key: this.modal.key, query: result.query, time: result.data.time, records: sortFieldRecords(result.data.data) } : null
  }

  /** Введення в поле → пошук через 900 мс (legacy handleFlightSearch). */
  schedule(key, value) {
    clearTimeout(this.timers.get(key))
    this.timers.set(key, setTimeout(() => {
      this.timers.delete(key)
      this.search(key, String(value ?? '').trim())
    }, CONSOLIDATED_DEBOUNCE_MS))
  }

  async search(key, query) {
    if (!query || query.length < CONSOLIDATED_MIN_QUERY) {
      this.setResult(key, null, query ? 'empty' : undefined)
      return
    }
    const requestId = (this.requests.get(key) ?? 0) + 1
    this.requests.set(key, requestId)
    this.setStatus(key, 'loading')
    try {
      const data = await searchConsolidated(query, this.excludeProjectId())
      if (this.requests.get(key) !== requestId) return
      this.setResult(key, data.total > 0 ? { query, data } : null, data.total > 0 ? 'result' : 'empty')
    } catch {
      if (this.requests.get(key) === requestId) this.setResult(key, null, 'empty')
    }
  }

  setStatus(key, value) {
    this.status = { ...this.status, [key]: value }
  }
  setResult(key, result, status) {
    const results = { ...this.results }
    if (result) results[key] = result
    else delete results[key]
    this.results = results
    const next = { ...this.status }
    if (status) next[key] = status
    else delete next[key]
    this.status = next
  }

  /** Рядок ідентифікатора прибрали — його збіги більше не враховуються. */
  remove(key) {
    clearTimeout(this.timers.get(key))
    this.timers.delete(key)
    this.requests.set(key, (this.requests.get(key) ?? 0) + 1)
    this.setResult(key, null)
  }

  reset() {
    this.timers.forEach(clearTimeout)
    this.timers.clear()
    this.requests.clear()
    this.results = {}
    this.status = {}
    this.modal = null
  }

  openField(key) {
    if (this.results[key]) this.modal = { kind: 'field', key }
  }
  openAll() {
    if (this.total > 0) this.modal = { kind: 'all' }
  }
  closeModal() {
    this.modal = null
  }
}
