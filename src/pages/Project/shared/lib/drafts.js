/**
 * Чернетки модалки проєкту в IndexedDB (порт origin lib/projects/drafts.js без Dexie).
 * Незбережені зміни (create/update) переживають перезавантаження/крах вкладки.
 * Per-browser, без синхронізації між пристроями (§8 специфікації конкурентного редагування).
 *
 * Ключ чернетки:
 *   `${userId}:project:${projectId}`       — редагування наявного проєкту
 *   `${userId}:project:new:${clientUuid}`  — створення нового
 *
 * Усі виклики деградують мовчки: IndexedDB може бути недоступна (приватний режим, квоти),
 * а форма має працювати й без чернеток.
 */

// 2 — `citizen` у знімку незалежний від `country` (як в origin).
export const DRAFT_SCHEMA_VERSION = 2

const DB_NAME = 'portal-project-drafts'
const STORE = 'drafts'
let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB недоступна'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: 'key' })
      store.createIndex('userId', 'userId')
      store.createIndex('updatedAt', 'updatedAt')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }).catch((error) => {
    dbPromise = null
    throw error
  })
  return dbPromise
}

async function run(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(request?.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const draftKeyForProject = (userId, projectId) => `${userId}:project:${projectId}`
export const draftKeyForNew = (userId, clientUuid) => `${userId}:project:new:${clientUuid}`

export async function getDraft(key) {
  try {
    return (await run('readonly', (store) => store.get(key))) ?? null
  } catch {
    return null
  }
}

export async function putDraft(draft) {
  try {
    await run('readwrite', (store) => store.put({ ...draft, schemaVersion: DRAFT_SCHEMA_VERSION, updatedAt: Date.now() }))
  } catch {
    // чернетки — best effort
  }
}

export async function deleteDraft(key) {
  try {
    await run('readwrite', (store) => store.delete(key))
  } catch {
    // best effort
  }
}

export async function listDrafts(userId) {
  try {
    return (await run('readonly', (store) => store.index('userId').getAll(userId))) ?? []
  } catch {
    return []
  }
}

/** Прибирає чернетки, старші за `days` днів. */
export async function purgeOlderThan(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  try {
    await run('readwrite', (store) => {
      const request = store.index('updatedAt').openCursor(IDBKeyRange.upperBound(cutoff))
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) return
        cursor.delete()
        cursor.continue()
      }
      return request
    })
  } catch {
    // best effort
  }
}

/**
 * Автозбереження чернетки з дебаунсом: { schedule(values), flush(), cancel() }.
 * Коли змін немає — викликач сам прибирає чернетку через deleteDraft().
 */
export function createDraftAutosaver({ key, userId, projectId = null, clientUuid = null, baseVersion = null, baseSnapshot = null, debounceMs = 500 }) {
  let timer = null
  let lastValues = null

  const flush = async (values) => {
    clearTimeout(timer)
    timer = null
    lastValues = values ?? lastValues
    if (lastValues == null) return
    await putDraft({ key, userId, projectId, clientUuid, baseVersion, baseSnapshot, values: lastValues })
  }

  return {
    schedule(values) {
      lastValues = values
      clearTimeout(timer)
      timer = setTimeout(() => flush(lastValues), debounceMs)
    },
    flush: () => flush(lastValues),
    cancel() {
      clearTimeout(timer)
      timer = null
    },
  }
}
