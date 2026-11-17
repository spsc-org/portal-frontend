import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  SETTINGS_KEYS,
  UI_SETTING_KEYS,
  fetchNotificationPreferences,
  patchNotificationPreferences,
  patchUserSetting,
} from '../model/settingsApi.js'

// apiFetch кидає ApiError { status, payload }.
const errorMessage = (error, fallback) => error?.payload?.message ?? fallback

/**
 * /settings: тема, мітки i-doc (клієнтські cookies, див. UiStore) і канали нотифікацій.
 * Усі зміни — оптимістичні з відкатом при помилці; одночасно — одна.
 */
export class SettingsViewModel {
  saving = false

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.preferencesQuery = scope.query({
      queryKey: SETTINGS_KEYS.preferences,
      queryFn: fetchNotificationPreferences,
    })
  }

  // ---- derived ------------------------------------------------------------

  get isLoading() {
    return this.preferencesQuery.isLoading
  }

  get theme() {
    return this.stores.ui.theme
  }

  get showIDocLabels() {
    return this.stores.ui.showIDocLabels
  }

  get categories() {
    return this.preferencesQuery.data?.categories ?? []
  }

  get projectTicketSubscribed() {
    return Boolean(this.preferencesQuery.data?.subscriptions?.project_ticket)
  }

  // ---- helpers ------------------------------------------------------------

  setPreferences(updater) {
    this.scope.queryClient.setQueryData(SETTINGS_KEYS.preferences, (data) => updater(data ?? { categories: [], subscriptions: {} }))
  }

  /** Оптимістична зміна: apply → request → (успіх: onSuccess | помилка: rollback). */
  async optimistic({ apply, rollback, request, onSuccess, errorText }) {
    if (this.saving) return
    apply()
    this.saving = true

    try {
      const result = await request()
      onSuccess?.(result)
      toast.success('Налаштування збережено')
    } catch (error) {
      rollback()
      toast.error(errorMessage(error, errorText))
    } finally {
      this.saving = false
    }
  }

  // ---- actions ------------------------------------------------------------

  /** Тема: одразу локально (cookie/клас), плюс персист на бекенді (ui.theme). */
  setTheme(next) {
    const previous = this.theme
    if (next === previous) return

    return this.optimistic({
      apply: () => this.stores.ui.setTheme(next),
      rollback: () => this.stores.ui.setTheme(previous),
      request: () => patchUserSetting(UI_SETTING_KEYS.theme, next),
      errorText: 'Не вдалося зберегти тему',
    })
  }

  /** Мітки i-doc — суто клієнтська cookie, без запиту на бекенд. */
  setShowIDocLabels(next) {
    this.stores.ui.setShowIDocLabels(next)
  }

  toggleChannel(category, channel, enabled) {
    const previous = this.preferencesQuery.data

    return this.optimistic({
      apply: () =>
        this.setPreferences((data) => ({
          ...data,
          categories: data.categories.map((item) =>
            item.category === category
              ? { ...item, channels: item.channels.map((ch) => (ch.channel === channel ? { ...ch, enabled } : ch)) }
              : item,
          ),
        })),
      rollback: () => this.setPreferences(() => previous),
      request: () => patchNotificationPreferences({ categories: { [category]: { [channel]: enabled } } }),
      // Неочікувана форма відповіді — лишаємо оптимістичний стан.
      onSuccess: (data) => {
        if (Array.isArray(data?.categories)) this.setPreferences((current) => ({ ...current, categories: data.categories }))
      },
      errorText: 'Не вдалося зберегти налаштування повідомлень',
    })
  }

  setProjectTicketSubscription(subscribed) {
    const previous = this.preferencesQuery.data
    const withSubscription = (value) => (data) => ({
      ...data,
      subscriptions: { ...data.subscriptions, project_ticket: value },
    })

    return this.optimistic({
      apply: () => this.setPreferences(withSubscription(subscribed)),
      rollback: () => this.setPreferences(() => previous),
      request: () => patchNotificationPreferences({ subscriptions: { project_ticket: subscribed } }),
      onSuccess: (data) => {
        const value = data?.subscriptions?.project_ticket
        if (typeof value === 'boolean') this.setPreferences(withSubscription(value))
      },
      errorText: 'Не вдалося зберегти підписку на тікети',
    })
  }
}
