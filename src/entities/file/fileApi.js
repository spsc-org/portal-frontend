import { apiFetch } from '../../lib/api.js'
import { rootStore } from '../../stores/RootStore.js'
import { downloadFile } from '../../lib/utils.js'

/** Ім'я файлу з Content-Disposition (RFC 5987 utf-8'', лапки, без лапок). */
export function filenameFromDisposition(header, fallback = 'downloaded_file') {
  if (!header) return fallback

  const utf8 = header.match(/filename\*=utf-8''([^;]+)/i)
  if (utf8) return decodeURIComponent(utf8[1])

  const quoted = header.match(/filename="([^"]+)"/i)
  if (quoted) return quoted[1]

  const bare = header.match(/filename=([^;,\s]+)/i)
  return bare ? bare[1] : fallback
}

/**
 * Помилка, що прийшла як Blob (responseType: 'blob'), — дістати message з JSON.
 * @returns {Promise<string|null>}
 */
export async function blobErrorMessage(error) {
  const payload = error?.payload
  if (!(payload instanceof Blob) || !payload.type?.includes('application/json')) {
    return error?.payload?.message ?? null
  }

  try {
    return JSON.parse(await payload.text())?.message ?? null
  } catch {
    return null
  }
}

/**
 * GET /api/file?path=… → збереження файлу в браузері.
 * Заголовок userId — контракт бекенду (той самий, що слала Inertia-версія).
 */
export async function downloadStoredFile(path, fallbackName) {
  const response = await apiFetch('/api/file', {
    params: { path },
    headers: {
      userId: rootStore.session.userId,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
    },
    responseType: 'blob',
    raw: true,
  })

  const filename = filenameFromDisposition(response.headers['content-disposition'], fallbackName || 'downloaded_file')
  downloadFile(response.data, filename)
  return filename
}
