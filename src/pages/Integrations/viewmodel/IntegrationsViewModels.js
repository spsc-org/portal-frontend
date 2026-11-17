import { observable, reaction } from 'mobx'
import axios from 'axios'
import { keepPreviousData } from '@tanstack/react-query'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { downloadFile } from '../../../lib/utils.js'
import { filenameFromDisposition } from '../../../entities/file/fileApi.js'
import {
  canReadIntegrationsDatasets,
  canReadIntegrationsExport,
  canReadIntegrationsVesselImo,
} from '../shared/lib/permissions.js'
import {
  INTEGRATION_KEYS,
  deleteExportFile,
  fetchDatasetLogs,
  fetchDatasets,
  fetchExportFiles,
  fetchImportLogDetails,
  fetchImportLogs,
  fetchVesselImoDetails,
  fetchVesselImoLists,
  fetchVesselImoLogs,
  importDataset,
  runLegacyExport,
} from '../model/integrationsApi.js'

/** Повідомлення помилки axios/ApiError для Alert-ів діалогів. */
export const errorText = (error) => error?.response?.data?.message ?? error?.payload?.message ?? error?.message

/**
 * Пагінований список (журнали, деталі суден): page + опційний пошук з дебаунсом
 * + розгорнутий/обраний рядок. fetcher({ page, limit, search }) → { data, meta|pagination }.
 */
export class PagedListViewModel {
  page = 1
  search = ''
  debouncedSearch = ''
  expandedId = null

  constructor({ scope, key, fetcher, limit = 15, debounce = 500, enabled = () => true }) {
    this.scope = scope
    this.limit = limit
    makeViewModel(this, { limit: false })

    this.query = scope.query({
      queryKey: () => [...key, { page: this.page, limit, search: this.debouncedSearch }],
      queryFn: ({ queryKey }) => fetcher(queryKey[queryKey.length - 1]),
      placeholderData: keepPreviousData,
      options: () => ({ enabled: enabled() }),
    })

    const stop = reaction(() => this.search, (value) => this.setDebouncedSearch(value), { delay: debounce })
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  get rows() { return this.query.data?.data ?? [] }
  get meta() { return this.query.data?.meta ?? this.query.data?.pagination }

  setDebouncedSearch(value) { this.debouncedSearch = value }
  /** Приймає значення або updater (p) => p + 1 — як setState у JSX origin. */
  setPage(value) { this.page = typeof value === 'function' ? value(this.page) : value }
  setExpanded(value) { this.expandedId = typeof value === 'function' ? value(this.expandedId) : value }
  setSearch(value) {
    this.search = value
    this.page = 1
  }
  toggleExpanded(id) { this.expandedId = this.expandedId === id ? null : id }
}

/**
 * Діалог імпорту файлу: (опційно) аналіз без запису → підтвердження.
 * Mutation-и mobx-tanstack-query мають той самий API, що й react-query
 * (isPending/isSuccess/isError/data/error/reset), тож View читає їх напряму.
 */
export class FileImportViewModel {
  file = null
  error = null

  constructor({ scope, previewFn, commitFn, invalidate = [], requiresFile = true, onDone }) {
    this.scope = scope
    this.requiresFile = requiresFile
    this.onDone = onDone
    makeViewModel(this, { file: observable.ref, requiresFile: false, onDone: false })

    this.previewMutation = previewFn ? scope.mutation({ mutationFn: previewFn }) : null
    this.importMutation = scope.mutation({
      mutationFn: commitFn,
      onSuccess: () => Promise.all(invalidate.map((queryKey) => scope.invalidate(queryKey))),
    })
  }

  get isImportSettled() { return this.importMutation.isSuccess || this.importMutation.isError }
  get showAnalyzeButton() { return !this.previewMutation?.isSuccess && !this.previewMutation?.isPending && !this.isImportSettled }
  get showConfirmButton() { return Boolean(this.previewMutation?.isSuccess) && !this.isImportSettled }

  setFile(fileList) {
    if (!fileList) return
    this.file = fileList[0] ?? null
    this.error = null
    this.previewMutation?.reset()
  }

  validate() {
    if (this.requiresFile && !this.file) {
      this.error = 'Будь ласка, виберіть файл.'
      return false
    }
    return true
  }

  analyze() {
    if (this.validate()) this.previewMutation.mutate(this.file).catch(() => {})
  }

  /** Підтвердити імпорт; payload — файл (за замовчуванням) або підготовлені дані (FormData). */
  confirm(payload = this.file) {
    if (!this.previewMutation && !this.validate()) return
    this.importMutation
      .mutate(payload)
      .then(() => this.onDone?.())
      .catch(() => {})
  }
}

/** /integrations-datasets: датасети, журнал імпорту, діалоги імпорту/історії/деталей. */
export class DatasetsViewModel {
  importDataset = null
  historyDataset = null
  detailsLogId = null
  sortConfig = { key: 'caption', direction: 'ascending' }

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { importDataset: observable.ref, historyDataset: observable.ref })

    this.datasetsQuery = scope.query({ queryKey: INTEGRATION_KEYS.datasets, queryFn: fetchDatasets, staleTime: Infinity })
    this.logs = new PagedListViewModel({ scope, key: INTEGRATION_KEYS.importLogs, fetcher: fetchImportLogs, limit: 15 })
    this.historyLogs = new PagedListViewModel({
      scope,
      key: INTEGRATION_KEYS.datasetLogs,
      fetcher: (params) => fetchDatasetLogs({ ...params, datasetId: this.historyDataset?.id }),
      limit: 10,
      enabled: () => Boolean(this.historyDataset?.id),
    })
  }

  get canRead() { return canReadIntegrationsDatasets(this.stores.session.auth) }
  get datasets() { return this.datasetsQuery.data?.datasets ?? [] }

  get sortedDatasets() {
    const { key, direction } = this.sortConfig
    const sorted = [...this.datasets].sort((a, b) => {
      const av = a[key] ?? ''
      const bv = b[key] ?? ''
      if (av < bv) return direction === 'ascending' ? -1 : 1
      if (av > bv) return direction === 'ascending' ? 1 : -1
      return 0
    })
    return sorted
  }

  requestSort(key) {
    if (!key) return
    const direction = this.sortConfig.key === key && this.sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
    this.sortConfig = { key, direction }
  }

  openImport(dataset) { this.importDataset = dataset }
  closeImport() { this.importDataset = null }
  openHistory(dataset) {
    this.historyDataset = dataset
    this.historyLogs.setPage(1)
  }
  closeHistory() { this.historyDataset = null }
  openDetails(logId) { this.detailsLogId = logId }
  closeDetails() { this.detailsLogId = null }

  createImport(scope) {
    const dataset = this.importDataset
    return new FileImportViewModel({
      scope,
      commitFn: (file) => importDataset({ datasetId: dataset?.id, file }),
      requiresFile: dataset?.id !== 1,
      invalidate: [INTEGRATION_KEYS.datasets, INTEGRATION_KEYS.importLogs],
    })
  }
}

/** Деталі одного запису журналу імпорту. */
export class ImportLogDetailsViewModel {
  constructor({ scope, logId }) {
    this.scope = scope
    makeViewModel(this)
    this.query = scope.query({ queryKey: INTEGRATION_KEYS.logDetails(logId), queryFn: () => fetchImportLogDetails(logId), enabled: Boolean(logId) })
  }

  get log() { return this.query.data ?? null }
}

/** /integrations-export: файли експорту legacy-даних. */
export class ExportViewModel {
  exportResult = null

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this, { exportResult: observable.ref })

    this.filesQuery = scope.query({ queryKey: INTEGRATION_KEYS.exportFiles, queryFn: fetchExportFiles })
    this.exportMutation = scope.mutation({ mutationFn: runLegacyExport, invalidateQueries: { queryKey: INTEGRATION_KEYS.exportFiles } })
    this.deleteMutation = scope.mutation({ mutationFn: deleteExportFile, invalidateQueries: { queryKey: INTEGRATION_KEYS.exportFiles } })
  }

  get canRead() { return canReadIntegrationsExport(this.stores.session.auth) }
  get files() { return this.filesQuery.data ?? [] }

  async runExport() {
    try {
      const data = await this.exportMutation.mutateAsync()
      this.exportResult = { success: data.status === 'success', message: data.message, details: data.details }
    } catch (error) {
      this.exportResult = { success: false, message: 'Помилка експорту', details: error?.response?.data ?? error?.message }
    }
  }

  closeResult() {
    this.exportResult = null
    this.exportMutation.reset()
  }

  async download(downloadUrl, fileName) {
    if (!downloadUrl) return
    try {
      const response = await axios.get(downloadUrl, { responseType: 'blob' })
      downloadFile(response.data, fileName)
    } catch {
      window.alert('Не вдалося завантажити файл. Спробуйте пізніше.')
    }
  }

  /** Файл результату експорту: ім'я — з Content-Disposition або останнього сегмента URL. */
  async downloadResult(downloadUrl) {
    if (!downloadUrl) return
    try {
      const response = await axios.get(downloadUrl, { responseType: 'blob' })
      const fallback = downloadUrl.split('/').pop() || 'export.sql'
      downloadFile(response.data, filenameFromDisposition(response.headers['content-disposition'], fallback))
    } catch {
      window.alert('Не вдалося завантажити файл. Спробуйте пізніше.')
    }
  }

  remove(filename) {
    if (!window.confirm(`Ви впевнені, що хочете видалити файл ${filename}?`)) return
    this.deleteMutation.mutate(filename).catch((error) => {
      window.alert(`Помилка видалення файлу: ${error?.response?.data?.message || error?.message}`)
    })
  }
}

/** /integrations-vessel-imo: списки, деталі суден, спільний журнал, два діалоги імпорту. */
export class VesselImoViewModel {
  listsImportOpen = false
  detailsImportOpen = false

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.listsQuery = scope.query({
      queryKey: INTEGRATION_KEYS.vesselLists,
      queryFn: fetchVesselImoLists,
      options: () => ({ enabled: this.canRead }),
    })
    this.logs = new PagedListViewModel({ scope, key: INTEGRATION_KEYS.vesselLogs, fetcher: fetchVesselImoLogs, limit: 15 })
    this.details = new PagedListViewModel({ scope, key: INTEGRATION_KEYS.vesselDetails, fetcher: fetchVesselImoDetails, limit: 50 })
  }

  get canRead() { return canReadIntegrationsVesselImo(this.stores.session.auth) }
  get lists() { return this.listsQuery.data }

  openListsImport() { this.listsImportOpen = true }
  closeListsImport() { this.listsImportOpen = false }
  openDetailsImport() { this.detailsImportOpen = true }
  closeDetailsImport() { this.detailsImportOpen = false }
}
