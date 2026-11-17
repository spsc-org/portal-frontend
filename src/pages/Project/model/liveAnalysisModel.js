/**
 * Живий аналіз полів проєкту (порт legacy LiveAnalysisManager + LiveAnalysisTooltipComponent,
 * підсвітка з SimpleTextBlockComponent / ReasoningHighlightComponent). Без React і MobX.
 *
 * Картка: POST /api/project/{id}/liveAnalysis { fields } — аналіз збереженого проєкту.
 * Форма:  POST /api/project/json/{id|0}/liveAnalysis { project: payload, fields } — аналіз незбережених даних.
 * Відповідь: { field: result } і для identifier/attribute — [{ objectId, ...result }].
 */
import axios from 'axios'
import { rootStore } from '../../../stores/RootStore.js'

const headers = () => ({ userId: rootStore.session.userId })

export const ANALYSED_FIELDS = ['drsId', 'nameUk', 'nameRu', 'nameEn', 'birthDate', 'reasoning', 'identifier', 'attribute']
export const ROW_FIELDS = ['identifier', 'attribute']

async function post(url, body) {
  const { data } = await axios.post(url, body, { headers: headers() })
  if (!data?.success) throw new Error(data?.message || 'Помилка живого аналізу')
  return data.data ?? {}
}

export const analyzeProject = (projectId, fields = ANALYSED_FIELDS) => post(`/api/project/${projectId}/liveAnalysis`, { fields })
export const analyzeFormPayload = (projectId, payload, fields = ANALYSED_FIELDS) =>
  post(`/api/project/json/${projectId ?? 0}/liveAnalysis`, { project: payload, fields })

/** Ключ результату: поле або поле:objectId (рядки ідентифікаторів/атрибутів). */
export const analysisKey = (field, objectId = null) => (objectId == null ? field : `${field}:${objectId}`)

/**
 * Відповідь → { key: result }. Рядки без objectId (нові в формі) зіставляються за порядком
 * у payload з `rowKeys[field]` → `tmp-{rowKey}` (legacy _fixNullIdentifierObjectIds).
 */
export function normalizeResults(data, rowKeys = {}) {
  const results = {}
  for (const [field, result] of Object.entries(data ?? {})) {
    if (ROW_FIELDS.includes(field) && Array.isArray(result)) {
      result.forEach((item, index) => {
        const objectId = item.objectId ?? (rowKeys[field]?.[index] != null ? `tmp-${rowKeys[field][index]}` : null)
        if (objectId != null) results[analysisKey(field, objectId)] = item
      })
    } else if (result && typeof result === 'object' && !Array.isArray(result)) {
      results[field] = result
    }
  }
  return results
}

// ---- підсвітка тексту ----

/** Що підсвічувати в тексті поля картки (legacy SimpleTextBlockComponent.extractHighlightableItems). */
export function highlightItems(validationData, text = '') {
  const vd = validationData && !Array.isArray(validationData) ? validationData : {}
  const items = []
  for (const phrase of vd.warning?.foundPhrases ?? []) items.push({ text: phrase.phrase, type: phrase.isGlobal ? 'warning' : 'warningPersonal', severity: 'warning' })
  for (const phrase of vd.forbidden?.foundPhrases ?? []) items.push({ text: phrase.phrase, type: phrase.isGlobal ? 'forbidden' : 'forbiddenPersonal', severity: 'error' })
  for (const item of Array.isArray(vd.subjectType) ? vd.subjectType : []) {
    for (const char of item.invalidCharacters ?? []) items.push({ text: char, type: 'invalidChar', severity: 'error' })
    if (item.word) items.push({ text: item.word, type: 'invalidFormat', severity: 'warning' })
  }
  if (vd.layerResults?.syntax === false && text) items.push({ text, type: 'syntaxError', severity: 'error' })
  return items.filter((item, index, all) => item.text && index === all.findIndex((other) => other.text === item.text && other.type === item.type))
}

const HIGHLIGHT_TITLES = {
  warning: 'Системний маркер уваги',
  warningPersonal: 'Мій маркер уваги',
  forbidden: 'Системне заборонене формулювання',
  forbiddenPersonal: 'Моє заборонене формулювання',
  invalidChar: 'Недозволений символ',
  invalidFormat: 'Некоректний формат слова',
  syntaxError: 'Синтаксична помилка',
}
export const highlightTitle = (type) => HIGHLIGHT_TITLES[type] ?? 'Проблема валідації'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Текст → сегменти [{ text, mark? }] без перетинів (довші фрази мають пріоритет).
 * `wholeWords` — межі слів Unicode (legacy ReasoningHighlightComponent).
 */
export function highlightSegments(text, items, { wholeWords = false } = {}) {
  const source = String(text ?? '')
  if (!source || items.length === 0) return [{ text: source }]
  const ranges = []
  for (const item of [...items].sort((a, b) => b.text.length - a.text.length)) {
    const pattern = wholeWords ? `(?<![\\p{L}])${escapeRegex(item.text)}(?![\\p{L}])` : escapeRegex(item.text)
    const regex = new RegExp(pattern, wholeWords ? 'giu' : 'gi')
    let match
    while ((match = regex.exec(source)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex += 1
        continue
      }
      const start = match.index
      const end = start + match[0].length
      if (!ranges.some((range) => start < range.end && end > range.start)) ranges.push({ start, end, item })
    }
  }
  ranges.sort((a, b) => a.start - b.start)
  const segments = []
  let position = 0
  for (const range of ranges) {
    if (range.start > position) segments.push({ text: source.slice(position, range.start) })
    segments.push({ text: source.slice(range.start, range.end), mark: range.item })
    position = range.end
  }
  if (position < source.length) segments.push({ text: source.slice(position) })
  return segments
}

/** Обґрунтування у формі: заборонені — червоним, маркери уваги — жовтим. */
export function reasoningItems(validationData) {
  const vd = validationData && !Array.isArray(validationData) ? validationData : {}
  return [
    ...(vd.forbidden?.foundPhrases ?? []).map((phrase) => ({ text: phrase.phrase, type: 'forbidden', severity: 'error' })),
    ...(vd.warning?.foundPhrases ?? []).map((phrase) => ({ text: phrase.phrase, type: 'warning', severity: 'warning' })),
  ].filter((item) => item.text)
}

export const missingPhrases = (result) => {
  const vd = result?.validationData
  return vd && !Array.isArray(vd) ? vd.required?.missingPhrases ?? [] : []
}

// ---- підказка результату (legacy LiveAnalysisTooltipComponent) ----

export const STATUS_CONFIG = {
  valid: { icon: 'fas fa-check-circle', color: 'text-green-600 dark:text-green-400', box: 'bg-green-50 border-green-200 text-green-800 dark:bg-[#262524] dark:border-green-700 dark:text-green-200', title: 'Успішно перевірено' },
  invalid: { icon: 'fas fa-times-circle', color: 'text-red-600 dark:text-red-400', box: 'bg-red-50 border-red-200 text-red-800 dark:bg-[#262524] dark:border-red-700 dark:text-red-200', title: 'Знайдені помилки' },
  warning: { icon: 'fas fa-exclamation-triangle', color: 'text-yellow-600 dark:text-yellow-400', box: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-[#262524] dark:border-yellow-700 dark:text-yellow-200', title: 'Потребує уваги' },
  'not-checked': { icon: 'fas fa-question-circle', color: 'text-gray-500 dark:text-gray-400', box: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-[#262524] dark:border-gray-700 dark:text-gray-200', title: 'Не перевірено' },
}
export const statusConfig = (status) => STATUS_CONFIG[status] ?? STATUS_CONFIG['not-checked']

export const LAYER_CONFIG = {
  success: { icon: 'fas fa-check-circle', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  failed: { icon: 'fas fa-times-circle', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  warning: { icon: 'fas fa-exclamation-triangle', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
}
export const layerConfig = (status) => LAYER_CONFIG[status] ?? { icon: 'fas fa-question-circle', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' }

const FIELD_NAMES = { drsId: 'DRS ID', nameUk: 'Назва (укр)', nameRu: 'Назва (рос)', nameEn: 'Назва (англ)', birthDate: 'Дата народження', identifier: 'Ідентифікатор', attribute: 'Атрибут', reasoning: 'Обґрунтування' }
export const fieldDisplayName = (field) => FIELD_NAMES[field] ?? field

const LAYER_NAMES = {
  syntax: 'Синтаксис', database: 'База даних', context: 'Контекст', 'code-conflict': 'Конфлікт коду', format: 'Формат',
  range: 'Діапазон', business: 'Бізнес-логіка', base: 'Базова перевірка', warning: 'Маркери уваги',
  forbidden: 'Заборонені формулювання', required: "Обов'язкові фрази",
}
export const layerDisplayName = (layer) => LAYER_NAMES[layer] ?? layer

/** "Речення. Речення" → окремі рядки (legacy formatLayerMessage). */
export const layerMessageLines = (message) =>
  String(message || 'Без повідомлення')
    .split('. ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.endsWith('.') ? part : `${part}.`))

export const similarityClass = (similarity) =>
  similarity >= 90
    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
    : similarity >= 70
      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'

const NAME_LABELS = { nameUk: 'Назва (укр)', nameRu: 'Назва (рос)', nameEn: 'Назва (англ)' }
export const nameFieldLabel = (field) => NAME_LABELS[field] ?? field

/** Дані валідації шару (порожні — null). */
export function layerData(result, layer) {
  const vd = result?.validationData
  if (!vd || Array.isArray(vd)) return null
  const data = vd[layer]
  if (data == null) return null
  if (Array.isArray(data) && data.length === 0) return null
  if (typeof data === 'object' && Object.keys(data).length === 0) return null
  return data
}
