import { apiFetch } from '../../../lib/api.js'
import { fetchAnnouncements } from '../../../entities/announcement/announcementApi.js'

export const WELCOME_KEYS = {
  dashboard: (userId) => ['welcome-dashboard', userId],
  activity: (days) => ['project-activity', days],
  myTasks: (userId) => ['welcome-my-tasks', userId],
  announcements: ['welcome-announcements'],
}

// Нова(1)/В роботі(2)/Повернуто(5) — ще не завершено з боку виконавця,
// на відміну від Виконано(3, чекає приймання) і Закрито(6).
export const OPEN_TASK_STATUS_IDS = [1, 2, 5]

/** Зведення для KPI-карток і днів народження. Заголовок userId — контракт бекенду. */
export const fetchDashboard = (userId) =>
  apiFetch('/api/welcome/dashboard', { headers: { userId } }).then((payload) => payload?.data ?? null)

/** { chartData: [{ name, <action>: count }], actions: [{ dataKey, name, color }] } */
export const fetchProjectActivity = (days) =>
  apiFetch('/api/activity/projects', { params: { days } }).then((payload) => payload?.data ?? null)

/** 5 найновіших відкритих задач, де користувач серед виконавців. */
export const fetchMyOpenTasks = (userId) =>
  apiFetch('/api/task', {
    params: {
      assignedUserId: [userId],
      statusId: OPEN_TASK_STATUS_IDS,
      limit: 5,
      sort: 'created_at',
      direction: 'desc',
    },
    headers: { userId },
  }).then((payload) => payload?.data ?? [])

/** Останні НЕпрочитані оголошення (адресовані мені або загальні), без чернеток. */
export const fetchUnreadAnnouncements = () =>
  fetchAnnouncements({ limit: 5, isRead: false }).then((payload) =>
    (payload?.data ?? []).filter((announcement) => !announcement.is_draft),
  )
