import { apiFetch } from '../../../lib/api.js'

export const REPORT_KEYS = {
  validation: (report, showValid) => ['report-validation', report, showValid],
  duplicates: ['report-duplicates'],
}

/** { data: rows[], meta: { summary } } */
export const fetchValidation = (report, showValid) =>
  apiFetch('/api/report/validation', { params: { report, showValid } })

export const fetchDuplicates = () => apiFetch('/api/report/duplicates').then((payload) => payload?.data ?? [])

/** Коротка інфа про судна + належність до санкційних списків за списком IMO. */
export const fetchImoLookup = (imos) =>
  apiFetch('/api/report/imo-lookup', { method: 'POST', body: { imos } }).then((payload) => payload?.data)

const IMO_CHUNK_SIZE = 300

/**
 * Великий список б'ємо на частини й прогресивно віддаємо накопичений результат
 * через onProgress по мірі надходження частин.
 */
export async function fetchImoLookupChunked(imos, onProgress) {
  let details = []
  let sanctions = {}
  let lists = []

  for (let i = 0; i < imos.length; i += IMO_CHUNK_SIZE) {
    const result = await fetchImoLookup(imos.slice(i, i + IMO_CHUNK_SIZE))
    details = details.concat(result.details)
    sanctions = { ...sanctions, ...result.sanctions }
    lists = result.lists
    onProgress?.({ details, sanctions, lists })
  }

  return { details, sanctions, lists }
}

/** Таблиця для Excel (HTML-таблиця з MIME ms-excel, як у Inertia-версії). */
export function buildImoExcelHtml({ imoList, detailsByImo, sanctionsByImo, lists, duplicateFlags, notes }) {
  const headers = ['#', 'IMO', 'Дублікат', 'Назва', 'Позивний', 'MMSI', 'Тип судна', 'Прапор', 'Статус', 'Власник',
    ...lists.map((l) => l.country || l.code), 'Примітка']

  const rowsHtml = imoList.map((imo, index) => {
    const detail = detailsByImo[imo]
    const imoLists = sanctionsByImo[imo] ?? []
    const cells = [
      index + 1, imo, duplicateFlags[index] ? 'так' : '',
      detail?.name || '', detail?.callSign || '', detail?.mmsi || '', detail?.shipType || '',
      detail?.flagCode || '', detail?.status || '', detail?.ownerName || '',
      ...lists.map((l) => (imoLists.includes(l.code) ? (l.country || l.code) : '')),
      notes[imo] ?? '',
    ]
    return `<tr>${cells.map((c) => `<td>${String(c)}</td>`).join('')}</tr>`
  }).join('')

  return `<html><head><meta charset="UTF-8"></head><body><table>`
    + `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>${rowsHtml}</table></body></html>`
}
