import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.message ?? `Запит завершився з кодом ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  validateStatus: () => true,
})

// Sanctum SPA cookie-автентифікація: перед будь-яким мутуючим запитом бекенд
// має видати XSRF-TOKEN cookie, інакше VerifyCsrfToken відхилить запит.
async function ensureCsrfCookie() {
  if (readCookie('XSRF-TOKEN')) return

  await client.get('/sanctum/csrf-cookie')
}

let unauthorizedHandler = null

// AuthProvider підписується сюди, щоб скинути стан юзера при 401 з будь-якого
// запиту (не лише /api/me) — без цього UI міг би лишитись "залогіненим" після
// закінчення сесії на бекенді.
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export async function apiFetch(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const upperMethod = method.toUpperCase()
  const isMutating = MUTATING_METHODS.has(upperMethod)

  if (isMutating) {
    await ensureCsrfCookie()
  }

  const response = await client.request({
    ...rest,
    url: path,
    method: upperMethod,
    data: body,
    headers: {
      ...(isMutating ? { 'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') ?? '' } : {}),
      ...headers,
    },
  })

  const payload = response.status === 204 ? null : (response.data ?? null)

  if (response.status === 401) {
    unauthorizedHandler?.()
  }

  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(response.status, payload)
  }

  return payload
}

export { API_BASE_URL }