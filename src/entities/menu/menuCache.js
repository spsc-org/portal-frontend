/**
 * Меню сайдбару з GET /api/me (data.menu.catalog + data.access.pages),
 * збережене в localStorage. Сайдбар рендериться з кешу одразу, ще до
 * відповіді /api/me, а свіжа відповідь лише перевіряється на зміни
 * (порівняння сигнатур). Кеш прив'язаний до користувача.
 *
 * Форма меню: { pages: string[], catalog: { [key]: item }, version: string|null }
 * item: { key, label, href|null, icon, expandable, submenu: [{ label, href, icon }]|null }
 */

const STORAGE_KEY = 'portal.sidebar-menu'
// Змінити, якщо зміниться форма збереженого об'єкта — старий кеш ігнорується.
const SCHEMA = 1

/** Меню з payload /api/me (або null). */
export function menuFromMe(me) {
  if (!me) return null
  return {
    pages: Array.isArray(me.access?.pages) ? me.access.pages : [],
    catalog: me.menu?.catalog && typeof me.menu.catalog === 'object' ? me.menu.catalog : {},
    version: me.version ?? null,
  }
}

/** JSON зі стабільним порядком ключів об'єктів (масиви — як є, порядок значущий). */
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

/**
 * Сигнатура вмісту меню. Порядок ключів catalog теж важливий (це порядок
 * пунктів у сайдбарі), тому він входить окремо.
 */
export function menuSignature(menu) {
  if (!menu) return ''
  const source = stableStringify({ ...menu, order: Object.keys(menu.catalog) })
  // FNV-1a 32-bit — коротка сигнатура замість повного рядка.
  let hash = 0x811c9dc5
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${(hash >>> 0).toString(16)}:${source.length}`
}

/** @returns {{ userId: number, signature: string, menu: object, savedAt: number } | null} */
export function readMenuCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (entry?.schema !== SCHEMA || entry.userId == null || !entry.menu?.catalog) return null
    return { userId: entry.userId, signature: entry.signature, menu: entry.menu, savedAt: entry.savedAt }
  } catch {
    return null
  }
}

export function writeMenuCache(userId, menu, signature = menuSignature(menu)) {
  const entry = { userId, signature, menu, savedAt: Date.now() }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: SCHEMA, ...entry }))
  } catch {
    // сховище недоступне / переповнене — меню просто прийде з /api/me
  }
  return entry
}

export function clearMenuCache() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Видимі пункти: catalog (метадані й порядок пунктів, config/menu.php),
 * відфільтрований за access.pages. Підпункти бекенд уже відфільтрував за
 * правами. Групи (admin, handbook…) є в access.pages як синтетичні ключі.
 */
export function resolveMenuItems(menu) {
  if (!menu) return []
  const pages = new Set(menu.pages)
  return Object.values(menu.catalog)
    .filter((item) => item && pages.has(item.key))
    .map(withoutSpaHiddenLinks)
}

/**
 * Підпункти каталогу, які в SPA не потрібні: catalog спільний з legacy Blade-сайдбаром,
 * тож прибираємо їх тут, а не в бекенді. /project/v2 ("Нова версія") — у SPA це вже
 * основна сторінка /project (маршрут /project/v2 лише перенаправляє туди).
 */
// /integrations-export-v2, -v3 — Inertia-сторінки, у SPA ще не перенесені (маршрутів немає).
const SPA_HIDDEN_HREFS = new Set(['/project/v2', '/integrations-export-v2', '/integrations-export-v3'])
// Легасі-сторінки: пункт лишається в меню, але позначений і веде на екран "доступ закрито".
const SPA_LEGACY_HREFS = new Set(['/dictionary/identify'])
// Групи, які в SPA розкриваються підменю в сайдбарі, хоча бекенд (спільно з legacy
// Blade-сайдбаром) віддає їх з expandable:false і другим меню на сторінці.
const SPA_EXPANDABLE_KEYS = new Set(['integrations', 'admin'])

function withoutSpaHiddenLinks(item) {
  if (!Array.isArray(item.submenu)) return item
  const submenu = item.submenu
    .filter((sub) => !SPA_HIDDEN_HREFS.has(sub?.href))
    .map((sub) => (SPA_LEGACY_HREFS.has(sub?.href) ? { ...sub, legacy: true } : sub))
  return SPA_EXPANDABLE_KEYS.has(item.key) ? { ...item, submenu, expandable: true } : { ...item, submenu }
}
