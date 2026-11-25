/**
 * Model форми проєкту (порт legacy ProjectModalManagerV2 + ProjectModalManager v1):
 * HTTP (GET /api/project/{id} — legacy-шейп, POST /api/project/json, PATCH /api/project/json/{id}),
 * канонічний знімок форми для threeWayMerge/чернеток, JSON-payload і чисті правила
 * (видимість панелей, опції селектів, кольори обмежень, підказки "project-settings").
 * Без React і MobX.
 */
import axios from 'axios'
import { rootStore } from '../../../stores/RootStore.js'
import { RESTRICTION_KEYS, normalizeSnapshot } from '../shared/lib/projectSnapshot.js'
import { resolveRestrictionColor } from '../shared/lib/restrictionColor.js'

const headers = () => ({ userId: rootStore.session.userId })

// ---- HTTP ----

/** Повний проєкт у legacy-шейпі (country/citizen/category*, r1..r25, identifiers/attributes/documents, attachments, version). */
export async function fetchProjectForForm(id) {
  const { data } = await axios.get(`/api/project/${id}`, { headers: headers() })
  if (!data?.success || !data.data) throw new Error(data?.message || 'Не вдалося завантажити проєкт')
  return data.data
}

/**
 * Збереження: { status, body } без винятку для 409/422 — їх форма розбирає сама
 * (конфлікт версій → злиття, помилки/попередження валідації → підсвітка полів).
 */
export async function saveProject({ id, payload, force }) {
  const url = id ? `/api/project/json/${id}` : '/api/project/json'
  const response = await axios.request({
    url,
    method: id ? 'PATCH' : 'POST',
    params: force ? { force: 1 } : undefined,
    data: payload,
    headers: headers(),
    validateStatus: () => true,
  })
  return { status: response.status, body: response.data ?? {} }
}

/** Підрозділ за реєстраційним номером документа: { success, unitId, unitCaption }. */
export async function lookupUnitByRegnum(text) {
  const { data } = await axios.get('/api/helper/validateNumber', { params: { text }, headers: headers() })
  return data ?? {}
}

/** Presence: "я редагую проєкт" (null — звільнити). Повертає оновлений список presence або null. */
export async function announceEditingProject(projectId) {
  try {
    const { data } = await axios.post('/api/helper/presence/editing-project', { projectId: projectId ?? null }, { headers: headers() })
    return Array.isArray(data?.userData) ? data.userData : null
  } catch {
    return null
  }
}

const unwrap = (data, fallback) => {
  if (!data?.success) throw new Error(data?.message || fallback)
  return data.data
}

export async function uploadProjectAttachment({ file, projectId, type }) {
  const body = new FormData()
  body.append('file', file)
  if (projectId != null) body.append('projectId', projectId)
  body.append('type', type)
  const { data } = await axios.post('/api/project/attachment/upload', body, {
    headers: { ...headers(), 'Content-Type': 'multipart/form-data' },
  })
  return unwrap(data, 'Помилка завантаження файлу')
}

export async function deleteProjectAttachment(id) {
  const { data } = await axios.delete(`/api/project/attachment/${id}`, { headers: headers() })
  return unwrap(data, 'Помилка видалення')
}

export async function updateAttachmentComment({ id, comment }) {
  const { data } = await axios.patch(`/api/project/attachment/${id}/comment`, { comment: comment || null }, { headers: headers() })
  return unwrap(data, 'Помилка збереження коментаря')
}

// ---- канонічний знімок ----

const INT_FIELDS = ['actionType', 'subjectTypeId', 'stateId', 'decreeId', 'drsId', 'termId', 'issuerId', 'performerId', 'validatorId', 'fix_annex', 'fix_index']
const STR_FIELDS = ['nameUk', 'nameRu', 'nameEn', 'birthDate', 'adrUk', 'adrRu', 'adrEn', 'reasoning', 'notes', 'fix_action_id', 'fix_decree', 'r25', 'r6Text']
const ID_LISTS = ['country', 'citizen', 'category1', 'category2', 'category3', 'proposal', 'reasons']
// Службові поля сервера: потрібні для злиття/підписів, форма їх не редагує
const PASSTHROUGH = ['id', 'version', 'updatedAt', 'updatedUserId']

export const toInt = (value) => {
  const n = parseInt(value, 10)
  return Number.isNaN(n) || n === 0 ? null : n
}
export const toStr = (value) => (value == null ? null : String(value).trim() || null)
const toIds = (value) => (Array.isArray(value) ? value : value == null || value === '' ? [] : String(value).split(','))
  .map(Number)
  .filter(Boolean)

const cleanIdentifier = (row) => {
  const identifierValue = String(row.identifierValue ?? '').trim()
  return {
    id: toInt(row.id),
    identifierId: toInt(row.identifierId),
    identifierCountryId: toInt(row.identifierCountryId),
    identifierValue,
    // "Не задано" і знайдене значення взаємовиключні (бек так само форсить false при непорожньому value)
    notSpecified: identifierValue === '' && Boolean(row.notSpecified),
  }
}
const cleanAttribute = (row) => ({ id: toInt(row.id), attributeId: toInt(row.attributeId), attributeValue: String(row.attributeValue ?? '').trim() })
const cleanDocument = (row) => ({
  id: toInt(row.id),
  typeId: toInt(row.typeId),
  unitId: toInt(row.unitId),
  regNum: toStr(row.regNum),
  regDate: toStr(row.regDate),
  listItem: toStr(row.listItem),
  caption: toStr(row.caption),
  path: toStr(row.path),
})
// Ті самі правила, що legacy build*Payload: порожні рядки не відправляються.
// "Не задано" — свідомо підтверджена відсутність, тож такий рядок лишається і з порожнім value.
const keepIdentifier = (row) => row.identifierValue !== '' || row.notSpecified
const keepAttribute = (row) => row.attributeValue !== ''
const keepDocument = (row) => Boolean(row.regNum && row.typeId)

/**
 * Канонічний знімок (і "мій" бік злиття, і база для "є незбережені дані"): типи значень
 * зведені (id → number, рядки → trim|null), порожні рядки таблиць відкинуті, `_key` прибрано.
 */
export function canonicalSnapshot(raw = {}) {
  const snap = {}
  for (const key of PASSTHROUGH) snap[key] = raw[key] ?? null
  for (const key of INT_FIELDS) snap[key] = toInt(raw[key])
  for (const key of STR_FIELDS) snap[key] = toStr(raw[key])
  for (const key of ID_LISTS) snap[key] = toIds(raw[key])
  for (const key of RESTRICTION_KEYS) snap[key] = Boolean(raw[key])
  snap.identifiers = (raw.identifiers ?? []).map(cleanIdentifier).filter(keepIdentifier)
  snap.attributes = (raw.attributes ?? []).map(cleanAttribute).filter(keepAttribute)
  snap.documents = (raw.documents ?? []).map(cleanDocument).filter(keepDocument)
  return normalizeSnapshot(snap)
}

/** Ключі рядків форми, що потрапили в payload (індекс помилки сервера → рядок форми). */
export function includedRowKeys(form) {
  return {
    identifiers: (form.identifiers ?? []).filter((row) => keepIdentifier(cleanIdentifier(row))).map((row) => row._key),
    attributes: (form.attributes ?? []).filter((row) => keepAttribute(cleanAttribute(row))).map((row) => row._key),
    documents: (form.documents ?? []).filter((row) => keepDocument(cleanDocument(row))).map((row) => row._key),
  }
}

let keySeq = 0
const nextKey = () => `row-${++keySeq}`
export const withRowKey = (row) => ({ ...row, _key: row._key ?? nextKey() })

export const emptyIdentifier = (patch = {}) => withRowKey({ id: null, identifierId: '', identifierCountryId: '', identifierValue: '', notSpecified: false, ...patch })
export const emptyAttribute = (patch = {}) => withRowKey({ id: null, attributeId: '', attributeValue: '', ...patch })
export const emptyDocument = () => withRowKey({ id: null, typeId: 1, unitId: '', regNum: '', regDate: '', listItem: '', caption: '', path: '' })

/** Знімок (сервер, злиття, чернетка) → стан форми: ті самі поля + `_key` у рядках таблиць. */
export function formFromSnapshot(snapshot) {
  const form = { ...snapshot }
  for (const key of STR_FIELDS) form[key] = snapshot[key] ?? ''
  form.identifiers = (snapshot.identifiers ?? []).map(withRowKey)
  form.attributes = (snapshot.attributes ?? []).map(withRowKey)
  form.documents = (snapshot.documents ?? []).map(withRowKey)
  return form
}

export const DEFAULT_REASON_ID = 1

/** Порожня форма створення (legacy cleanFormFields + setDefaultValues: стан 1, термін 16, суб'єкт подання 4). */
export function emptyForm({ actionType = 1, subjectTypeId = 1 } = {}) {
  const form = canonicalSnapshot({ actionType, subjectTypeId, stateId: 1, termId: 16, issuerId: 4, reasons: [DEFAULT_REASON_ID] })
  // Тип "Судно" лишився з минулого створення — рекомендовані рядки й підстава одразу (legacy showAddModal → ensureVessel*)
  return applyVesselDefaults({ ...formFromSnapshot(form), attributes: [emptyAttribute()], documents: [emptyDocument()] })
}

// ---- судна (legacy ProjectModalManager.ensureVessel*) ----

export const VESSEL_SUBJECT_TYPE_ID = 5
/** reg:imo / reg:mmsi — мають бути заповнені або позначені "Не задано" (soft-помилка бекенда). */
export const VESSEL_IDENTIFIER_TYPE_IDS = [103, 104]
/** "Позивні сигнали судна" / "Найменування судновласників" — рекомендовані (попередження бекенда). */
export const VESSEL_ATTRIBUTE_TYPE_IDS = [25, 26]
/** "Встановлення факту використання суден..." — обов'язкова підстава, ?force=1 її не обходить. */
export const VESSEL_MANDATORY_REASON_ID = 7

const isFilled = (value) => String(value ?? '').trim() !== ''
export const isEmptyIdentifierRow = (row) => !isFilled(row.identifierValue) && !row.notSpecified
export const isEmptyAttributeRow = (row) => !isFilled(row.attributeValue)

/**
 * Судно: IMO/MMSI (лише якщо таблиця ідентифікаторів порожня), атрибути 25/26 (яких ще нема;
 * порожній нетипізований рядок прибирається) і підстава id=7 до вже обраних. Інші типи — без змін.
 */
export function applyVesselDefaults(form) {
  if (form.subjectTypeId !== VESSEL_SUBJECT_TYPE_ID) return form
  const identifiers = form.identifiers.length > 0
    ? form.identifiers
    : VESSEL_IDENTIFIER_TYPE_IDS.map((identifierId) => emptyIdentifier({ identifierId }))
  const kept = form.attributes.filter((row) => isFilled(row.attributeId) || isFilled(row.attributeValue))
  const present = new Set(kept.map((row) => Number(row.attributeId)).filter(Boolean))
  const attributes = [...kept, ...VESSEL_ATTRIBUTE_TYPE_IDS.filter((id) => !present.has(id)).map((attributeId) => emptyAttribute({ attributeId }))]
  const reasons = (form.reasons ?? []).map(Number)
  return {
    ...form,
    identifiers,
    attributes,
    reasons: reasons.includes(VESSEL_MANDATORY_REASON_ID) ? reasons : [...reasons, VESSEL_MANDATORY_REASON_ID],
  }
}

/** Канонічний знімок → тіло POST/PATCH /api/project/json (legacy buildJsonPayload). */
export function buildPayload(snapshot, { userId, attachmentIds = [] }) {
  const restrictions = {}
  for (const key of RESTRICTION_KEYS) restrictions[key] = Boolean(snapshot[key])
  restrictions.r25 = snapshot.r25 ?? null
  restrictions.r6Text = snapshot.r6Text ?? null
  return {
    userId: toInt(userId),
    updatedAt: snapshot.updatedAt ?? null,
    version: toInt(snapshot.version),
    actionType: snapshot.actionType,
    subjectTypeId: snapshot.subjectTypeId,
    stateId: snapshot.stateId,
    decreeId: snapshot.decreeId,
    drsId: snapshot.drsId,
    nameUk: snapshot.nameUk,
    nameRu: snapshot.nameRu,
    nameEn: snapshot.nameEn,
    birthDate: snapshot.birthDate,
    adrUk: snapshot.adrUk,
    adrRu: snapshot.adrRu,
    adrEn: snapshot.adrEn,
    reasoning: snapshot.reasoning,
    termId: snapshot.termId,
    issuerId: snapshot.issuerId,
    reasons: snapshot.reasons,
    performerId: snapshot.performerId,
    validatorId: snapshot.validatorId,
    notes: snapshot.notes,
    fix: { actionId: snapshot.fix_action_id, decree: snapshot.fix_decree, annex: snapshot.fix_annex, index: snapshot.fix_index },
    // У projectToCountry зберігаються лише відмічені "Громадянство / Країна реєстрації"
    countries: snapshot.citizen,
    categories: { set1: snapshot.category1, set2: snapshot.category2, set3: snapshot.category3 },
    proposals: snapshot.proposal,
    restrictions,
    // Судна — ідентифікатор без країни взагалі (legacy не дає селекту країни name)
    identifiers: snapshot.identifiers.map((row) => ({
      id: row.id,
      typeId: row.identifierId,
      value: row.identifierValue,
      countryId: snapshot.subjectTypeId === VESSEL_SUBJECT_TYPE_ID ? null : row.identifierCountryId,
      notSpecified: row.notSpecified,
    })),
    attributes: snapshot.attributes.map((row) => ({ id: row.id, typeId: row.attributeId, value: row.attributeValue })),
    documents: snapshot.documents,
    attachmentIds,
  }
}

// ---- помилки валідації ({messages:{validationErrors, validationWarnings, generalErrors}}) ----

const FIX_FIELDS = { actionId: 'fix_action_id', decree: 'fix_decree', annex: 'fix_annex', index: 'fix_index' }
const ROW_FIELDS = {
  identifiers: { typeId: 'identifierId', value: 'identifierValue', countryId: 'identifierCountryId' },
  attributes: { typeId: 'attributeId', value: 'attributeValue' },
  documents: { typeId: 'typeId', regNum: 'regNum', regDate: 'regDate', listItem: 'listItem', unitId: 'unitId', caption: 'caption', path: 'path' },
}
const FIELD_ALIASES = { countries: 'citizen', proposals: 'proposal', categories: 'category1', reasonId: 'reasons' }
// Помилки без поля у формі (судна: vesselImo/vesselMmsi/vesselAttr25/26) — у загальний список, як legacy _applyFieldError
const isFormlessKey = (key) => key.startsWith('vessel')

/**
 * Розбирає відповідь у { fields: {name: {message, level}}, rows: {identifiers: {rowKey: {field: {...}}}}, general: [] }.
 * `rowKeys` — includedRowKeys(form) на момент відправки (індекс у payload → рядок форми).
 */
export function parseValidation(messages = {}, rowKeys = {}) {
  const result = { fields: {}, rows: { identifiers: {}, attributes: {}, documents: {} }, general: [...(messages.generalErrors ?? [])] }
  const put = (name, message, level) => {
    // помилка має пріоритет над попередженням того самого поля
    if (result.fields[name]?.level === 'error') return
    result.fields[name] = { message, level }
  }
  const apply = (bag, level) => {
    for (const [key, value] of Object.entries(bag ?? {})) {
      if (typeof value === 'string' && isFormlessKey(key)) {
        result.general.push(`${level === 'warning' ? '⚠️' : '🛑️'} ${value}`)
      } else if (typeof value === 'string') {
        put(FIELD_ALIASES[key] ?? key, value, level)
      } else if (Array.isArray(value) && ROW_FIELDS[key]) {
        value.forEach((rowErrors, index) => {
          const rowKey = rowKeys[key]?.[index]
          if (!rowErrors || !rowKey) return
          for (const [field, message] of Object.entries(rowErrors)) {
            const name = ROW_FIELDS[key][field]
            if (!name) continue
            result.rows[key][rowKey] = { ...result.rows[key][rowKey], [name]: { message, level } }
          }
        })
      } else if (key === 'fix' && value && typeof value === 'object') {
        for (const [field, message] of Object.entries(value)) put(FIX_FIELDS[field] ?? `fix_${field}`, message, level)
      } else if (value && typeof value === 'object') {
        for (const message of Object.values(value)) if (typeof message === 'string') result.general.push(`${key}: ${message}`)
      }
    }
  }
  apply(messages.validationErrors, 'error')
  apply(messages.validationWarnings, 'warning')
  return result
}

// ---- правила інтерфейсу ----

export const ACTION_TYPES = [
  { id: 1, title: 'Застосування', icon: 'fa-solid fa-right-to-bracket text-green-500', caption: 'ЗАСТОСУВАННЯ' },
  { id: 2, title: 'Зміна', icon: 'fa-solid fa-right-left text-blue-500', caption: 'ЗМІНИ' },
  { id: 3, title: 'Скасування', icon: 'fa-solid fa-right-from-bracket text-red-600', caption: 'СКАСУВАННЯ' },
]
export const SUBJECT_TYPES = [
  { id: 1, title: 'Особа', icon: 'fa-solid fa-user' },
  { id: 2, title: 'Організація', icon: 'fa-solid fa-industry' },
  { id: 5, title: 'Морське судно', icon: 'fa-solid fa-ship' },
  { id: 6, title: 'Літак', icon: 'fa-solid fa-plane' },
]
export const FORM_RESTRICTION_KEYS = RESTRICTION_KEYS

/** Видимість панелей і підписи (legacy preparePanelsForActionType + setupPanelsForSubjectType). */
export function formLayout(actionType, subjectTypeId) {
  const exclude = actionType === 3
  const layout = {
    fix: actionType === 2 || exclude,
    names: !exclude,
    citizen: !exclude,
    birth: !exclude && subjectTypeId === 1,
    adr: !exclude && subjectTypeId === 2,
    identifiers: !exclude,
    restrictions: !exclude,
    term: !exclude,
    // судна: лише назва іноземною
    nameUk: subjectTypeId !== 5 && subjectTypeId !== 6,
    nameRu: subjectTypeId !== 5 && subjectTypeId !== 6,
    namesCaption: 'Найменування',
    citizenCaption: 'Країни реєстрації',
    // судна — ідентифікатори без країни (колонка "Країна" — прочерк)
    identifierCountry: subjectTypeId !== 5,
  }
  if (subjectTypeId === 1) Object.assign(layout, { namesCaption: 'Перелік імен українською мовою', citizenCaption: 'Громадянство' })
  if (subjectTypeId === 2) layout.namesCaption = 'Перелік назв українською мовою'
  if (subjectTypeId === 5) Object.assign(layout, { namesCaption: 'Перелік назв судна (декілька через ;)', citizenCaption: 'Прапор' })
  if (subjectTypeId === 6) layout.namesCaption = 'Перелік назв повітряного судна (декілька через ;)'
  return layout
}

const asList = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}))

/**
 * Типи ідентифікаторів для типу суб'єкта і задіяних країн. Універсальні (belongCountryId=null —
 * зокрема всі типи суден) доступні одразу, без вибору країни (legacy addIdentifierRow).
 */
export function identifierTypeOptions(voc, subjectTypeId, countries) {
  return asList(voc?.identifierType)
    .filter((item) => item.subjectTypeId === subjectTypeId || item.subjectTypeId === 0)
    .filter((item) => item.belongCountryId === null || (countries ?? []).includes(item.belongCountryId))
    .map((item) => ({ id: item.id, caption: `${item.code} / ${item.caption}` }))
}

export function attributeTypeOptions(voc, subjectTypeId) {
  return asList(voc?.attributeType)
    .filter((item) => item.subjectTypeId === subjectTypeId || item.subjectTypeId === 0)
    .map((item) => ({ id: item.id, caption: `${item.code} / ${item.caption}` }))
}

export const UKRAINE_ID = 234
const UNZR_IDENTIFIER_ID = 10

/**
 * Рядки ідентифікаторів при виборі першої країни (legacy updateIdentifierPanel) — лише особа/організація:
 * особа — податковий номер (46), для України ще й УНЗР (10); організація — за країною.
 */
export function defaultIdentifierRows(subjectTypeId, countryId) {
  if (subjectTypeId === 1) {
    const rows = [emptyIdentifier({ identifierCountryId: countryId, identifierId: 46 })]
    if (countryId === UKRAINE_ID) rows.push(emptyIdentifier({ identifierCountryId: countryId, identifierId: UNZR_IDENTIFIER_ID }))
    return rows
  }
  if (subjectTypeId === 2) return [emptyIdentifier({ identifierCountryId: countryId, identifierId: { 234: 5, 210: 6 }[countryId] ?? '' })]
  return []
}

/**
 * Колір прапорця обмеження: green | orange (особливе) | red (не для цього типу) + override-правила
 * довідника (voc.restriction[].overrides, напр. для громадян UA) — resolveRestrictionColor.
 */
export function restrictionColors(voc, subjectTypeId, countryCodes = []) {
  const colors = {}
  for (const item of asList(voc?.restriction)) {
    if (item.code === '25') continue
    colors[`r${item.code}`] = { color: resolveRestrictionColor(item, subjectTypeId, countryCodes), caption: item.caption }
  }
  return colors
}

// ---- підказки й "останній доданий" (localStorage "project-settings", спільний з legacy) ----

const SETTINGS_KEY = 'project-settings'
const HINT_KEYS = ['cat1', 'cat2', 'cat3', 'country', 'initiator', 'performer', 'validator', 'proposal', 'path', 'document', 'state', 'restrictions']
const EMPTY_SUBJECTS = { 1: null, 2: null, 5: null, 6: null }
const EMPTY_LAST_ADDS = { 1: EMPTY_SUBJECTS, 2: EMPTY_SUBJECTS, 3: EMPTY_SUBJECTS }

export function readProjectSettings() {
  let settings
  try {
    settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') ?? {}
  } catch {
    settings = {}
  }
  const hintValues = { ...Object.fromEntries(HINT_KEYS.map((key) => [key, []])), ...(settings.hintValues ?? {}) }
  const lastAdds = { ...EMPTY_LAST_ADDS, ...(settings.lastAdds ?? {}) }
  return { ...settings, hintValues, lastAdds }
}

function writeProjectSettings(patch) {
  try {
    const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') ?? {}
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...patch }))
  } catch {
    // localStorage недоступний — підказки не критичні
  }
}

const recent = (previous, values, limit = 3) => [...new Set([...values, ...(previous ?? [])])].filter((value) => value !== 0 && value !== '' && value != null).slice(0, limit)

/** Після збереження: останні значення полів для швидких підказок (legacy updateHints). */
export function rememberHints(snapshot) {
  const { hintValues } = readProjectSettings()
  const next = {
    ...hintValues,
    cat1: recent(hintValues.cat1, snapshot.category1),
    cat2: recent(hintValues.cat2, snapshot.category2),
    cat3: recent(hintValues.cat3, snapshot.category3),
    proposal: recent(hintValues.proposal, snapshot.proposal),
    country: recent(hintValues.country, snapshot.country),
    performer: recent(hintValues.performer, [snapshot.performerId]),
    validator: recent(hintValues.validator, [snapshot.validatorId]),
    state: recent(hintValues.state, [snapshot.stateId]),
    restrictions: RESTRICTION_KEYS.filter((key) => snapshot[key]),
  }
  writeProjectSettings({ hintValues: next })
}

/** "Заповнити останніми даними": id останнього збереженого проєкту для пари (дія, тип суб'єкта). */
export function rememberLastAdd(actionType, subjectTypeId, projectId) {
  const { lastAdds } = readProjectSettings()
  writeProjectSettings({ lastAdds: { ...lastAdds, [actionType]: { ...(lastAdds[actionType] ?? {}), [subjectTypeId]: projectId } } })
}

/** Чернетки увімкнено в налаштуваннях сторінки ("Використовувати чернетку у картках проєкту"). */
export const draftsEnabled = () => readProjectSettings().useProjectDraft === true
