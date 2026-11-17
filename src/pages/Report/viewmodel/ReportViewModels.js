import { observable, reaction } from 'mobx'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import { downloadFile } from '../../../lib/utils.js'
import {
  REPORT_KEYS,
  buildImoExcelHtml,
  fetchDuplicates,
  fetchImoLookupChunked,
  fetchValidation,
} from '../model/reportApi.js'

/** /report — плитки звітів; легасі-валідації (reports) — з /api/spa/pages/report/options. */
export class ReportIndexViewModel {
  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
    this.optionsQuery = scope.query(pageOptionsQuery('report'))
  }

  get reports() {
    return this.optionsQuery.data?.reports ?? []
  }
}

/** /report/validation/:report */
export class ValidationViewModel {
  showValid = false

  constructor({ scope, report }) {
    this.scope = scope
    this.report = report
    makeViewModel(this, { report: false })

    this.query = scope.query({
      queryKey: () => REPORT_KEYS.validation(this.report, this.showValid),
      queryFn: ({ queryKey }) => fetchValidation(queryKey[1], queryKey[2]),
    })
  }

  get rows() {
    return this.query.data?.data ?? []
  }

  get summary() {
    return this.query.data?.meta?.summary ?? null
  }

  get isFetching() {
    return this.query.isFetching
  }

  toggleShowValid() {
    this.showValid = !this.showValid
  }
}

/** /report/duplicates */
export class DuplicatesViewModel {
  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query({ queryKey: REPORT_KEYS.duplicates, queryFn: fetchDuplicates })
  }

  get rows() {
    return this.query.data ?? []
  }

  get isFetching() {
    return this.query.isFetching
  }
}

const NOTES_KEY = 'report-imo-analysis-notes'

function readNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')
  } catch {
    return {}
  }
}

/**
 * /report/imo-analysis — перевірка списку IMO: деталі суден + санкційні списки
 * (частинами), примітки за IMO (localStorage), експорт у Excel.
 */
export class ImoAnalysisViewModel {
  modalOpen = false
  text = ''
  imoList = null
  lookupData = null
  notes = readNotes()

  constructor({ scope }) {
    this.scope = scope
    // Великі масиви з відповіді — за посиланням.
    makeViewModel(this, { imoList: observable.ref, lookupData: observable.ref })

    this.lookupMutation = scope.mutation({
      mutationFn: ({ imos, onProgress }) => fetchImoLookupChunked(imos, onProgress),
    })

    const stop = reaction(
      () => JSON.stringify(this.notes),
      (json) => {
        try {
          localStorage.setItem(NOTES_KEY, json)
        } catch {
          // не критично
        }
      },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  // ---- derived ------------------------------------------------------------

  get detailsByImo() {
    const map = {}
    for (const detail of this.lookupData?.details ?? []) map[detail.imo] = detail
    return map
  }

  get lists() {
    return this.lookupData?.lists ?? []
  }

  get sanctionsByImo() {
    return this.lookupData?.sanctions ?? {}
  }

  /** "Дублікат" — з другого й наступних входжень того самого IMO. */
  get duplicateFlags() {
    if (!this.imoList) return []
    const seen = {}
    return this.imoList.map((imo) => {
      seen[imo] = (seen[imo] ?? 0) + 1
      return seen[imo] > 1
    })
  }

  get notFoundImos() {
    if (!this.imoList) return []
    return [...new Set(this.imoList.filter((imo) => !this.detailsByImo[imo]))]
  }

  get isLoading() {
    return this.lookupMutation.isPending
  }

  get hasList() {
    return Boolean(this.imoList && this.imoList.length > 0)
  }

  isNotFound(imo) {
    return this.lookupData !== null && !this.detailsByImo[imo]
  }

  // ---- actions ------------------------------------------------------------

  openModal() {
    this.modalOpen = true
  }

  closeModal() {
    this.modalOpen = false
  }

  setText(value) {
    this.text = value
  }

  setNote(imo, value) {
    this.notes = { ...this.notes, [imo]: value }
  }

  setLookupData(data) {
    this.lookupData = data
  }

  accept() {
    const list = this.text.split('\n').map((line) => line.trim()).filter(Boolean)
    this.imoList = list
    this.lookupData = null
    this.modalOpen = false
    if (list.length > 0) {
      this.lookupMutation.mutate({ imos: [...new Set(list)], onProgress: this.setLookupData }).catch(() => {
        toast.error('Не вдалося отримати дані суден')
      })
    }
  }

  async copyNotFound() {
    if (this.notFoundImos.length === 0) {
      toast('Незнайдених IMO немає')
      return
    }
    await navigator.clipboard.writeText(this.notFoundImos.join('\n'))
    toast.success(`Скопійовано ${this.notFoundImos.length} IMO в буфер`)
  }

  exportExcel() {
    const html = buildImoExcelHtml({
      imoList: this.imoList,
      detailsByImo: this.detailsByImo,
      sanctionsByImo: this.sanctionsByImo,
      lists: this.lists,
      duplicateFlags: this.duplicateFlags,
      notes: this.notes,
    })
    downloadFile(new Blob([html], { type: 'application/vnd.ms-excel' }), `imo-analysis-${new Date().toISOString().slice(0, 10)}.xls`)
  }
}
