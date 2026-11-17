import { makeAutoObservable, observable } from 'mobx'
import { applyTheme } from '../shared/theme/applyTheme.js'

const YEAR = 60 * 60 * 24 * 365

function readCookie(name) {
  return document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=')[1]
}

function writeCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${YEAR}; samesite=Strict`
}

/** Стартова тема: cookie `theme` (джерело бекендного HandleAppearance), далі localStorage. */
function readInitialTheme() {
  const fromCookie = readCookie('theme')
  if (fromCookie) return fromCookie === 'dark' ? 'dark' : 'light'
  try {
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/**
 * Глобальний UI-стан, що не належить жодній сторінці:
 *  - модалки, які відкриваються з будь-якого місця (форма зворотного зв'язку);
 *  - тема і мітки i-doc — суто клієнтські налаштування в cookies
 *    (`theme`, `showIDocLabels`), як і `sidebarOpen`; /api/me їх НЕ повертає
 *    (див. бекенд MeService). Тема додатково зберігається на бекенді
 *    (PATCH /api/user-settings `ui.theme`) — це робить SettingsViewModel.
 */
export class UiStore {
  feedbackOpen = false
  theme = readInitialTheme()
  showIDocLabels = readCookie('showIDocLabels') === 'true'
  // Шапка поточної сторінки (<PageHeader>): { token, title, breadcrumbs } | null.
  // Без неї Header бере назву й breadcrumbs з меню (entities/menu/routeMeta.js).
  pageHeader = null

  constructor() {
    makeAutoObservable(this, { pageHeader: observable.ref }, { autoBind: true })
    // index.html до першого рендера бачить лише localStorage — синхронізуємо з cookie.
    applyTheme(this.theme)
  }

  setTheme(theme) {
    this.theme = theme === 'dark' ? 'dark' : 'light'
    applyTheme(this.theme)
  }

  setShowIDocLabels(value) {
    this.showIDocLabels = Boolean(value)
    writeCookie('showIDocLabels', String(this.showIDocLabels))
  }

  setPageHeader(token, header) {
    this.pageHeader = { token, ...header }
  }

  /** Лише свій запис: при переході нова сторінка може зареєструватись раніше, ніж стара прибере свій. */
  clearPageHeader(token) {
    if (this.pageHeader?.token === token) this.pageHeader = null
  }

  openFeedback() {
    this.feedbackOpen = true
  }

  closeFeedback() {
    this.feedbackOpen = false
  }

  toggleFeedback() {
    this.feedbackOpen = !this.feedbackOpen
  }
}
