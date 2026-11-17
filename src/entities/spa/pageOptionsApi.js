import { apiFetch } from '../../lib/api.js'

/**
 * Props колишніх Inertia-сторінок: GET /api/spa/pages/<page>/options
 * (бекенд: routes/api/spa.php → SpaPageOptionsController). Форма data —
 * та сама, що й Inertia props відповідної сторінки.
 */
export const pageOptionsKey = (page, params = {}) => ['spa-page-options', page, params]

export const fetchPageOptions = (page, params) =>
  apiFetch(`/api/spa/pages/${page}/options`, { params }).then((payload) => payload?.data ?? {})

/** Конфіг для scope.query(...) — словники сторінки стабільні в межах сесії. */
export const pageOptionsQuery = (page, params = {}) => ({
  queryKey: pageOptionsKey(page, params),
  queryFn: () => fetchPageOptions(page, params),
  staleTime: 5 * 60 * 1000,
})
