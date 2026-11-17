/**
 * Пошук збігів у консолідованій базі для форми проєкту (порт legacy ProjectModalManagerV2
 * handleFlightSearch / _buildAllResults / модалки #modalConsolidatedSearch, #modalAllConsolidatedResults).
 * Без React і MobX.
 */
import axios from 'axios'
import { rootStore } from '../../../stores/RootStore.js'

export const CONSOLIDATED_MIN_QUERY = 2
export const CONSOLIDATED_DEBOUNCE_MS = 900
export const PROJECTS_DATASET_ID = 1

/** POST /api/project/consolidatedFlightSearch → { total, data: [record], time }; поточний проєкт відкидається. */
export async function searchConsolidated(query, excludeProjectId = null) {
  const { data } = await axios.post('/api/project/consolidatedFlightSearch', { query }, { headers: { userId: rootStore.session.userId } })
  if (!data?.success) throw new Error(data?.message || 'Помилка пошуку в консолідованій базі')
  let records = Array.isArray(data.data) ? data.data : []
  if (excludeProjectId) records = records.filter((record) => !(record.datasetId === PROJECTS_DATASET_ID && Number(record.id) === Number(excludeProjectId)))
  return { total: records.length, data: records, time: data.time ?? null }
}

const FIELD_LABELS = { nameUk: 'UA', nameRu: 'RU', nameEn: 'EN' }
/** Підпис поля, по якому знайдено збіг (UA/RU/EN або "Ідент."). */
export const fieldLabel = (key) => (key?.startsWith('identifier-') ? 'Ідент.' : FIELD_LABELS[key] ?? key ?? '')

export const TYPE_BADGES = {
  1: { label: 'Фіз. особа', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  2: { label: 'Юр. особа', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  3: { label: 'Судно', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  4: { label: 'Літак', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
}

/** Збіги одного поля: спершу проєкти порталу (датасет 1), далі — за вагою. */
export function sortFieldRecords(records) {
  return [...records].sort((a, b) => {
    const own = Number(b.datasetId === PROJECTS_DATASET_ID) - Number(a.datasetId === PROJECTS_DATASET_ID)
    return own || (b.weight ?? 0) - (a.weight ?? 0)
  })
}

/**
 * Зведена таблиця всіх полів без дублікатів (ключ datasetId-id): кількість полів, де знайдено
 * запис, домінує; датасет 1 — завжди нагорі; далі вага.
 */
export function mergeResults(results) {
  const merged = new Map()
  for (const [key, { query, data }] of Object.entries(results)) {
    for (const record of data.data) {
      const id = `${record.datasetId}-${record.id}`
      if (!merged.has(id)) merged.set(id, { key: id, record, matches: [] })
      merged.get(id).matches.push({ label: fieldLabel(key), query })
    }
  }
  const score = ({ matches, record }) => matches.length * 1_000_000 + Number(record.weight ?? 0) + (record.datasetId === PROJECTS_DATASET_ID ? 100_000_000 : 0)
  return [...merged.values()].sort((a, b) => score(b) - score(a))
}

/** Слова запиту (довші за 1 символ) для підсвітки знайденого. */
export const queryWords = (query) =>
  String(query ?? '')
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .map((word) => ({ text: word, type: 'match', severity: 'match' }))

/** Посилання на проєкт порталу зі збігу (датасет 1): картка і редагування. */
export const portalLinks = (record) =>
  record.datasetId === PROJECTS_DATASET_ID ? { card: `/project?card=${record.id}`, edit: `/project?edit=${record.id}` } : null
