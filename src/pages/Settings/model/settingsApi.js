import { apiFetch } from '../../../lib/api.js'

export const SETTINGS_KEYS = {
  preferences: ['notifications', 'preferences'],
}

/** Ключі KV-налаштувань бекенду (UserSettingsRegistry). */
export const UI_SETTING_KEYS = {
  theme: 'ui.theme',
}

export const patchUserSetting = (key, value) =>
  apiFetch('/api/user-settings', { method: 'PATCH', body: { settings: { [key]: value } } })

/** { categories: [{ category, label, channels: [{ channel, enabled }] }], subscriptions: { project_ticket } } */
export const fetchNotificationPreferences = () =>
  apiFetch('/api/notifications/preferences').then((payload) => payload?.data ?? { categories: [], subscriptions: {} })

export const patchNotificationPreferences = (body) =>
  apiFetch('/api/notifications/preferences', { method: 'PATCH', body }).then((payload) => payload?.data ?? null)
