import { apiFetch } from '../../../lib/api.js'
import { serializeParams } from '../../../lib/utils.js'

/** Словники /dictionary: ідентифікатори (v1 — з версіями, v2 — пласкі + аудит), позивні суден. */

export const GROUPS = [
  { id: 'tax', caption: 'tax' },
  { id: 'reg', caption: 'reg' },
  { id: 'doc', caption: 'doc' },
]

/** Мультиселекти фільтрів — масиви опцій { value } → значення. */
const listParams = (filters) =>
  serializeParams({
    ...filters,
    belongCountryId: filters.belongCountryId?.map((o) => o.value),
    subjectTypeId: filters.subjectTypeId?.map((o) => o.value),
    group: filters.group?.map((o) => o.value),
  })

const headers = (userId) => ({ userId })

/** Плаский рядок таблиці з відповіді v1 (поля поточної версії). */
const v1Row = (item) => ({
  id: item?.id,
  createdAt: item?.createdAt,
  createdUserId: item?.createdUserId,
  currentVersion: item?.currentVersion,
  deletedAt: item?.deletedAt,
  updatedAt: item?.updatedAt,
  code: item?.current_version?.code,
  group: item?.current_version?.group,
  name_uk: item?.current_version?.name_uk,
  name_en: item?.current_version?.name_en,
  name_doc: item?.current_version?.name_doc,
  description_uk: item?.current_version?.description_uk,
  description_en: item?.current_version?.description_en,
  comment: item?.current_version?.comment,
  subjectTypeId: item?.current_version?.subjectTypeId,
  belongCountryId: item?.current_version?.belongCountryId,
  pattern: item?.current_version?.pattern,
})

const v2Row = (item) => ({
  id: item?.id,
  createdAt: item?.createdAt,
  createdUserId: item?.createdUserId,
  deletedAt: item?.deletedAt,
  updatedAt: item?.updatedAt,
  code: item?.code,
  group: item?.group,
  name_uk: item?.name_uk,
  name_en: item?.name_en,
  name_doc: item?.name_doc,
  description_uk: item?.description_uk,
  description_en: item?.description_en,
  comment: item?.comment,
  subjectTypeId: item?.subjectTypeId,
  belongCountryId: item?.belongCountryId,
  pattern: item?.pattern,
})

/** Рядок таблиці: id словників → об'єкти { id, caption } (як transformIdentify*Response). */
function decorateRow(idn, { countries = [], subjectTypes = [] }, withExtras) {
  const mapped = {
    id: idn?.id,
    updatedAt: idn?.updatedAt,
    deletedAt: idn?.deletedAt,
    createdAt: idn?.createdAt,
    code: idn?.code,
    description_en: idn?.description_en,
    description_uk: idn?.description_uk,
    group: idn?.group,
    name_en: idn?.name_en,
    name_uk: idn?.name_uk,
    name_doc: idn?.name_doc,
    comment: idn?.comment,
    pattern: idn?.pattern,
    updatedUserId: idn?.updatedUserId,
    belongCountryId: countries.find((c) => c.id === idn?.belongCountryId),
    subjectTypeId: subjectTypes.find((t) => t.id === idn?.subjectTypeId),
    ...(withExtras ? { version: idn?.version, projectsCount: idn?.projectsCount } : {}),
  }
  return Object.prototype.hasOwnProperty.call(idn ?? {}, 'isUpdated') ? { ...mapped, isUpdated: idn.isUpdated } : mapped
}

/**
 * Конфіг версії API ідентифікаторів. Ключі кешу й localStorage — ті самі, що
 * в Inertia-версії (v1 зберігав фільтри під `${location.pathname}-filters` = /dictionary).
 */
export const IDENTIFIER_API = {
  v1: {
    version: 'v1',
    base: '/api/dictionary/identifier',
    listKey: 'dictionary-identify',
    editKey: 'identify-edit',
    detailsKey: 'identify-details',
    storageKey: '/dictionary',
    toRow: v1Row,
    decorate: (rows, dicts) => rows.map((row) => decorateRow(row, dicts, true)),
    // Форма редагування читає поточну версію.
    formSource: (payload) => payload?.data?.current_version,
    title: (payload) => payload?.data?.current_version?.code,
    // v1 слав null для порожніх select, v2 — undefined (контракт бекенду не чіпаємо).
    emptySelect: null,
  },
  v2: {
    version: 'v2',
    base: '/api/dictionary/identifier-v2',
    listKey: 'dictionary-identify-v2',
    editKey: 'identify-v2-edit',
    detailsKey: 'identify-v2-details',
    // Inertia-версія: LS_KEY_FILTERS = 'dictionary-v2-filters'.
    storageKey: 'dictionary-v2',
    toRow: v2Row,
    decorate: (rows, dicts) => rows.map((row) => decorateRow(row, dicts, false)),
    formSource: (payload) => payload?.data,
    title: (payload) => payload?.data?.code,
    emptySelect: undefined,
  },
}

export const fetchIdentifiers = (api, filters, userId) =>
  apiFetch(api.base, { params: listParams(filters), headers: headers(userId) })
export const fetchIdentifier = (api, id, userId) => apiFetch(`${api.base}/${id}`, { headers: headers(userId) })
export const createIdentifier = (api, body, userId) => apiFetch(api.base, { method: 'POST', body, headers: headers(userId) })
export const updateIdentifier = (api, id, body, userId) =>
  apiFetch(`${api.base}/${id}`, { method: 'PATCH', body, headers: headers(userId) })
export const deleteIdentifier = (api, id, userId) =>
  apiFetch(`${api.base}/${id}`, { method: 'DELETE', headers: headers(userId) })
export const restoreIdentifier = (api, id, userId) =>
  apiFetch(`${api.base}/${id}/restore`, { method: 'POST', headers: headers(userId) })

// v1: версії ідентифікатора
export const fetchIdentifierVersions = (id, { page, limit }, userId) =>
  apiFetch(`${IDENTIFIER_API.v1.base}/${id}/versions`, { params: { page, limit }, headers: headers(userId) })
export const rollbackIdentifierVersion = ({ versionId, identifierId }, userId) =>
  apiFetch(`${IDENTIFIER_API.v1.base}/${identifierId}/set-version`, {
    method: 'POST',
    params: { versionId },
    headers: headers(userId),
  })

// v2: аудит
export const fetchIdentifierAudit = (id, page, userId) =>
  apiFetch(`${IDENTIFIER_API.v2.base}/${id}/audit`, { params: { page, limit: 50 }, headers: headers(userId) })

export const fetchVesselCallSigns = (filters, userId) =>
  apiFetch('/api/dictionary/vessel-call-signs', {
    params: serializeParams({ ...filters, belongCountryId: filters.belongCountryId?.map((o) => o.value) }),
    headers: headers(userId),
  })
