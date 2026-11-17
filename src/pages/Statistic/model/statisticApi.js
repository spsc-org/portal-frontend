import { apiFetch } from '../../../lib/api.js'

export const STATISTIC_KEYS = {
  unrealized: (year, type) => ['statistic-unrealized', year, type],
}

export const UNREALIZED_TYPES = [
  { value: 1, label: 'Без звʼязків з поданнями' },
  { value: 2, label: 'Є звʼязки, жодного не реалізовано' },
]

/** Проєкти без реалізованих подань за рік (type: 1 — без звʼязків, 2 — з нереалізованими). */
export const fetchUnrealized = (year, type) =>
  apiFetch('/api/statistic/unrealized', { params: { year, type } }).then((payload) => payload?.data ?? [])
