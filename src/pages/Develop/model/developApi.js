import { apiFetch } from '../../../lib/api.js'

/** Artisan-команди дедуплікації досьє (web-маршрути DeveloperController::runX). */
export const DOSSIER_COMMANDS = {
  'import-truth-source': { route: '/develop/dossier/importTruthSource', label: 'Первинна генерація досьє з ДРС' },
  'update-truth-source': { route: '/develop/dossier/updateTruthSource', label: 'Оновлення з truth-джерела' },
  'link-projects': { route: '/develop/dossier/linkProjects', label: 'Звʼязування проєктів із досьє' },
  'create-orphan-profiles': { route: '/develop/dossier/createOrphanProfiles', label: 'Автоматичне створення досьє для всіх сиріт' },
  'refresh-status': { route: '/develop/dossier/refreshStatus', label: 'Оновлення стану підсанкційності' },
  'process-drafts': { route: '/develop/dossier/processDrafts', label: 'Обробка драфт-проєктів (застаріле)' },
}

/** → { status: 'success'|'error', output: html } */
export const runDossierCommand = (cmd, body) =>
  apiFetch(DOSSIER_COMMANDS[cmd].route, { method: 'POST', body })

export const fetchNotificationSections = () =>
  apiFetch('/api/notifications/sections').then((payload) => payload?.data ?? {})

export const fetchBellUnreadCount = () =>
  apiFetch('/api/notifications/unread-count').then((payload) => payload?.data?.count ?? null)

export const generateTestNotification = (body) =>
  apiFetch('/api/notifications/generate-test', { method: 'POST', body })
