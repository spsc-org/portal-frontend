import { apiFetch } from '../../../lib/api.js'
import { fetchAnnouncements } from '../../../entities/announcement/announcementApi.js'
import { fetchProjectList, fetchProjectOptions } from '../../Project/entities/project/api.js'
import { listDrafts } from '../../Project/shared/lib/drafts.js'

export const WELCOME_KEYS = {
  dashboard: (userId) => ['welcome-dashboard', userId],
  activity: (days) => ['project-activity', days],
  myTasks: (userId, mode) => ['welcome-my-tasks', userId, mode],
  announcements: ['welcome-announcements'],
  recentProjects: (userId) => ['welcome-recent-projects', userId],
  // той самий ключ, що PROJECT_KEYS.options(['state', 'user']) на /project — спільний кеш
  projectRefs: ['project-options', 'state', 'user'],
  latestDraft: (userId) => ['welcome-latest-draft', userId],
}

// Нова(1)/В роботі(2)/Повернуто(5) — ще не завершено з боку виконавця,
// на відміну від Виконано(3, чекає приймання) і Закрито(6).
export const OPEN_TASK_STATUS_IDS = [1, 2, 5]

export const TASK_LIMIT = 5

/** Зведення для KPI-карток і днів народження. Заголовок userId — контракт бекенду. */
export const fetchDashboard = (userId) =>
  apiFetch('/api/welcome/dashboard', { headers: { userId } }).then((payload) => payload?.data ?? null)

/** { chartData: [{ name: 'dd.mm', <action>: count }], actions: [{ dataKey, name, color }] } */
export const fetchProjectActivity = (days) =>
  apiFetch('/api/activity/projects', { params: { days } }).then((payload) => payload?.data ?? null)

/**
 * 5 найновіших відкритих задач: mode 'assigned' — я серед виконавців, 'created' — я автор.
 * → { rows, total } (total — усього таких задач, MyCollection.total).
 */
export const fetchMyOpenTasks = (userId, mode) =>
  apiFetch('/api/task', {
    params: {
      [mode === 'created' ? 'createdUserId' : 'assignedUserId']: [userId],
      statusId: OPEN_TASK_STATUS_IDS,
      limit: TASK_LIMIT,
      sort: 'created_at',
      direction: 'desc',
    },
    headers: { userId },
  }).then((payload) => {
    const rows = payload?.data ?? []
    return { rows, total: Number(payload?.total ?? rows.length) }
  })

/** Останні НЕпрочитані оголошення (адресовані мені або загальні), без чернеток. */
export const fetchUnreadAnnouncements = () =>
  fetchAnnouncements({ limit: 5, isRead: false }).then((payload) =>
    (payload?.data ?? []).filter((announcement) => !announcement.is_draft),
  )

/** 5 останніх доданих проєктів (v2/list без фільтрів, порядок id desc). */
export const fetchRecentProjects = (userId) =>
  fetchProjectList({ page: 1, limit: 5, filters: {} }, userId).then(({ rows }) => rows)

/** Словники стану й користувачів для таблиці останніх проєктів. */
export const fetchProjectRefs = (userId) => fetchProjectOptions(['state', 'user'], userId)

/** Найсвіжіша чернетка форми проєкту (IndexedDB цього браузера) або null. */
export const fetchLatestDraft = (userId) =>
  listDrafts(userId).then(
    (drafts) => drafts.slice().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0] ?? null,
  )
