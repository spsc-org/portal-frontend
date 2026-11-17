/**
 * Model картки швидкого перегляду проєкту (порт legacy projectCardManager.js + modalProjectCard/*.blade.php):
 * DTO, лічильник/історія змін (аудит), редагування одного поля, прив'язка вкладень. Без React і MobX.
 */
import axios from 'axios'
import { rootStore } from '../../../stores/RootStore.js'

const headers = () => ({ userId: rootStore.session.userId })
const unwrap = (data, fallback) => {
  if (!data?.success) throw new Error(data?.message || fallback)
  return data.data
}

export const CARD_KEYS = {
  all: ['project-card'],
  card: (id) => ['project-card', id],
  history: (id) => ['project-card', id, 'history'],
}

/** DTO + кількість змін (legacy #fetchDataGeneral: Promise.allSettled двох запитів). */
export async function fetchProjectCard(id) {
  const [dto, count] = await Promise.allSettled([
    axios.get(`/api/project/${id}/dto`, { headers: headers() }),
    axios.get(`/api/project/audit/project/count/${id}`, { headers: headers() }),
  ])
  if (dto.status !== 'fulfilled') throw new Error('Помилка при завантаженні проєкту.')
  const project = unwrap(dto.value.data, 'Помилка при завантаженні проєкту.')
  const changesCount = count.status === 'fulfilled' ? Number(count.value.data?.data?.changesCount ?? 0) : 0
  return { project, changesCount }
}

export async function fetchProjectHistory(id) {
  const { data } = await axios.get(`/api/project/audit/project/history/${id}`, { headers: headers() })
  return unwrap(data, 'Не вдалося завантажити історію змін') ?? []
}

/** PATCH /api/project/{id} одним полем (legacy #saveOneField). */
export async function saveProjectField(id, field, value) {
  const response = await axios.patch(`/api/project/${id}`, { [field]: value }, { headers: headers(), validateStatus: () => true })
  if (response.status >= 400) throw new Error(response.data?.message || `Зміни НЕ збережено (помилка сервера ${response.status})`)
  if (response.data?.success !== true) throw new Error(response.data?.error || response.data?.message || 'Неочікувана відповідь сервера')
}

/** Файл → "осиротіле" вкладення → прив'язка до проєкту (legacy AttachmentsBlockComponent). */
export async function attachFileToProject(projectId, file, type) {
  const body = new FormData()
  body.append('file', file)
  body.append('type', type)
  const upload = await axios.post('/api/project/attachment/upload', body, { headers: { ...headers(), 'Content-Type': 'multipart/form-data' } })
  const temp = unwrap(upload.data, 'Помилка завантаження файлу')
  if (!temp?.id) throw new Error('Не вдалося отримати ID тимчасового вкладення.')
  const attach = await axios.post(`/api/project/${projectId}/attachment/${temp.id}`, null, { headers: headers() })
  return unwrap(attach.data, 'Не вдалося прикріпити файл до проєкту.')
}

export async function detachFromProject(projectId, attachmentId) {
  const { data } = await axios.delete(`/api/project/${projectId}/attachment/${attachmentId}`, { headers: headers() })
  return unwrap(data, 'Помилка відкріплення вкладення')
}

// ---- представлення ----

const asList = (value) => (Array.isArray(value) ? value : [])
const findById = (list, id) => asList(list).find((item) => String(item.id) === String(id))

export const vocCaption = (list, id) => findById(list, id)?.caption ?? null

/**
 * Обмеження в порядку DTO (r1, r1_1 … r25): колір як legacy RestrictionsBlockComponent —
 * red (не для цього типу суб'єкта / громадянин UA), orange (особливе), green; яскравість — чи обрано.
 */
export function cardRestrictions(project, vocRestrictions) {
  const hasUkrainian = asList(project.countries).some((country) => country.caption === 'UA')
  return Object.entries(project)
    .filter(([key]) => /^r\d+(_\d+)?$/.test(key))
    .map(([key, value]) => {
      const code = key.replace(/^r/, '').replace('_', '-')
      const voc = asList(vocRestrictions).find((item) => item.code === code)
      const checked = Boolean(value) && value !== '0'
      const special = voc?.isSpecial === 1 && code !== '25'
      let prohibited = voc?.subjectTypeId === null || (voc?.subjectTypeId !== 0 && voc?.subjectTypeId !== project.subjectTypeId)
      if (hasUkrainian && voc?.subjectTypeId === 1) prohibited = true
      const color = prohibited ? 'red' : special ? 'orange' : 'green'
      const r6Text = code === '6' && checked ? project.r6Text || null : null
      const text = code === '25' ? value || null : null
      return { key, code, checked, color, caption: voc?.caption ?? '', r6Text, text, dashed: !checked && !special && !prohibited && code !== '25' }
    })
}

/** Ідентифікатори з підписами типів і країн (прапор за iso2). */
export function cardIdentifiers(project, voc) {
  return asList(project.identifiers).map((item) => {
    const country = findById(voc.country, item.countryId)
    return { id: item.id, value: item.value, caption: vocCaption(voc.identifierType, item.identifierId) ?? '???', country: country?.caption ?? '???', iso2: country?.iso2?.toLowerCase() ?? null }
  })
}

export function cardAttributes(project, voc) {
  return asList(project.attributes).map((item) => ({ id: item.id, value: item.value, caption: vocCaption(voc.attributeType, item.attributeId) ?? '???' }))
}

export function cardCountries(project, voc) {
  return asList(project.countries).map((item) => {
    const country = findById(voc.country, item.id)
    return { id: item.id, caption: country?.caption ?? item.caption ?? 'Unknown', iso2: country?.iso2?.toLowerCase() ?? null }
  })
}

export function cardDocuments(project, voc) {
  return asList(project.documents).map((doc) => {
    const type = findById(voc.documentType, doc.typeId)
    return { id: doc.id, icon: type?.icon || 'fa-regular fa-file', typeCaption: type?.caption ?? '', info: `${doc.regNum} (${doc.regDate})`, unit: vocCaption(voc.initiator, doc.unitId) ?? '-', unitId: doc.unitId }
  })
}

export function cardProposals(project, voc) {
  return asList(project.proposals).map((proposal) => {
    const state = findById(voc.proposalState, proposal.stateId)
    return { id: proposal.id, caption: proposal.caption, icon: state?.icon || 'fa-regular fa-circle', stateCaption: state?.caption ?? '' }
  })
}

export const CATEGORY_COLORS = { categories1: 'text-orange-500', categories2: 'text-blue-500', categories3: 'text-green-500' }

export function cardCategories(project) {
  return Object.keys(CATEGORY_COLORS).flatMap((key) => asList(project[key]).map((item) => ({ key: `${key}-${item.id}`, caption: item.caption, color: CATEGORY_COLORS[key] })))
}

export function cardReasons(project, voc) {
  return asList(project.reasons)
    .map((item) => (item && typeof item === 'object' ? item.caption?.trim() || vocCaption(voc.reason, item.id) : vocCaption(voc.reason, item)))
    .filter(Boolean)
}

// ---- історія змін (legacy ChangeLogComponent) ----

const FIELD_LABELS = {
  nameUk: 'Назва (укр)', nameRu: 'Назва (рос)', nameEn: 'Назва (англ)', birthDate: 'Дата народження',
  adrUk: 'Адреса (укр)', adrRu: 'Адреса (рос)', adrEn: 'Адреса (англ)', reasoning: 'Обґрунтування', notes: 'Примітки',
  performerId: 'Виконавець', validatorId: 'Валідатор', createdUserId: 'Створив', updatedUserId: 'Змінив',
  subjectTypeId: "Тип суб'єкта", stateId: 'Статус', actionType: 'Тип дії', termId: 'Строк', issuerId: 'Видавник',
  reasonId: 'Підстава', isDisabled: 'Відключено', drsId: 'Код ДРС', subjectId: "ID суб'єкта", originalId: 'Джерело (копія)',
  decree: 'Указ', decreeId: 'Указ', typeId: 'Тип', unitId: 'Підрозділ', regNum: 'Реєстр. номер', regDate: 'Дата реєстрації',
  identifierId: 'Тип ідентифікатора', countryId: 'Країна', caption: 'Назва', value: 'Значення', proposals: 'Пакет',
  documents: 'Документ', countries: 'Країна', identifiers: 'Ідентифікатор', categories1: 'Категорія 1',
  categories2: 'Категорія 2', categories3: 'Категорія 3', attributes: 'Атрибут', tickets: 'Тікет', attachments: 'Вкладення',
  ...Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`r${i + 1}`, `Санкція ${i + 1}`])),
  r6Text: 'Санкція 6 (текст)',
}
const ACTION_LABELS = { initial: 'Початковий запис', create: 'Створення', update: 'Редагування', delete: 'Видалення', copy: 'Копіювання' }

function fieldLabel(path) {
  const parts = path.split('.')
  if (parts.length === 1) return FIELD_LABELS[path] ?? path
  const group = FIELD_LABELS[parts[0]] ?? parts[0]
  if (parts.length === 2) return `${group} #${parts[1]}`
  const last = parts[parts.length - 1]
  return `${group}: ${FIELD_LABELS[last] ?? last}`
}

function displayObject(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Так' : 'Ні'
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    const items = value.map(displayObject)
    if (items.length <= 3) return items.join('; ')
    return `${items.slice(0, 2).join('; ')} (та ще ${items.length - 2})`
  }
  if ('label' in value && 'value' in value) return value.label ?? String(value.value)
  const text = value.caption ?? value.nameUk ?? value.name ?? value.filename ?? value.value
  if (text !== undefined && text !== null) return String(text)
  const scalar = Object.values(value).find((item) => item !== null && item !== undefined && typeof item !== 'object')
  return scalar !== undefined ? String(scalar) : '—'
}
const display = (raw, label) => (label !== null && label !== undefined ? String(label) : displayObject(raw))

const parseDate = (value) => new Date(String(value ?? '').replace(' ', 'T'))
function relativeDay(value) {
  const days = Math.floor((Date.now() - parseDate(value)) / 86400000)
  if (days === 0) return 'сьогодні'
  if (days === 1) return 'вчора'
  if (days <= 7) return `${days} дн. тому`
  if (days <= 30) return 'більше тижня тому'
  return 'більше місяця тому'
}

/** Записи аудиту → картки таймлайну (порожні диффи пропускаються, як legacy). */
export function historyEntries(records, vocUser) {
  return asList(records)
    .map((record) => {
      const diff = record.diff ?? {}
      const changes = [
        ...Object.entries(diff.changed ?? {}).map(([path, entry]) => ({ type: 'changed', label: fieldLabel(path), from: display(entry.from, entry.fromLabel), to: display(entry.to, entry.toLabel) })),
        ...Object.entries(diff.added ?? {}).map(([path, value]) => ({ type: 'added', label: fieldLabel(path), from: null, to: displayObject(value) })),
        ...Object.entries(diff.removed ?? {}).map(([path, value]) => ({ type: 'removed', label: fieldLabel(path), from: displayObject(value), to: null })),
      ]
      return {
        id: record.id,
        date: record.createdAt ? parseDate(record.createdAt).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
        relative: record.createdAt ? relativeDay(record.createdAt) : '',
        user: vocCaption(vocUser, record.userId) ?? record.userName ?? null,
        action: ACTION_LABELS[record.action] ?? record.action,
        changes,
      }
    })
    .filter((entry) => entry.changes.length > 0)
}

// ---- згорнуті картки (legacy ProjectCardDock, localStorage project-card-dock:{userId}) ----

const DOCK_MAX = 20
const dockKey = (userId) => `project-card-dock:${userId}`

export function readDock(userId) {
  try {
    const items = JSON.parse(localStorage.getItem(dockKey(userId)) ?? '[]')
    return Array.isArray(items) ? items.filter((item) => Number.isInteger(item?.projectId) && item.projectId > 0) : []
  } catch {
    return []
  }
}

export function writeDock(userId, items) {
  try {
    localStorage.setItem(dockKey(userId), JSON.stringify(items.slice(-DOCK_MAX)))
  } catch {
    // best effort
  }
}
