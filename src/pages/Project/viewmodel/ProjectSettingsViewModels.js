import axios from 'axios'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { rootStore } from '../../../stores/RootStore.js'
import { getDefaultFilters } from '../shared/config/defaultFilters.js'

/**
 * Налаштування сторінки /project у localStorage "project-settings" (той самий ключ і шейп, що legacy):
 * видимість фільтрів, чернетки форми проєкту, "Фільтр за поданням" (filters.fProposalExtended).
 */
function readSettings() {
  try {
    return JSON.parse(localStorage.getItem('project-settings') ?? 'null') ?? {}
  } catch {
    return {}
  }
}
function writeSettings(settings) {
  try {
    localStorage.setItem('project-settings', JSON.stringify(settings))
  } catch {
    // localStorage недоступний — налаштування діятимуть до перезавантаження
  }
}
/** Збережені фільтри поверх типових (нові ключі з'являються, старі зберігають enabled/val). */
function mergedFilters(settings) {
  const defaults = getDefaultFilters()
  const stored = settings.filters ?? {}
  return Object.fromEntries(Object.entries(defaults).map(([key, filter]) => [key, { ...filter, ...(stored[key] ?? {}) }]))
}

/** Модалка "Налаштування" (legacy SettingsModalManager): видимість фільтрів і чернетки. */
export class ProjectSettingsViewModel {
  isOpen = false
  visibility = {}
  useProjectDraft = false

  constructor({ page }) {
    this.page = page
    makeViewModel(this, { page: false })
  }

  get filters() {
    return Object.entries(getDefaultFilters())
      .filter(([key]) => key !== 'fProposalExtended')
      .map(([key, filter]) => ({ key, caption: filter.caption }))
  }

  open() {
    const settings = readSettings()
    const filters = mergedFilters(settings)
    this.visibility = Object.fromEntries(this.filters.map(({ key }) => [key, filters[key]?.enabled !== false]))
    this.useProjectDraft = settings.useProjectDraft === true
    this.isOpen = true
  }
  close() {
    this.isOpen = false
  }
  toggle(key) {
    this.visibility = { ...this.visibility, [key]: !this.visibility[key] }
  }
  setUseProjectDraft(value) {
    this.useProjectDraft = value
  }
  save(event) {
    event?.preventDefault?.()
    const settings = readSettings()
    const filters = mergedFilters(settings)
    for (const [key, enabled] of Object.entries(this.visibility)) filters[key] = { ...filters[key], enabled }
    writeSettings({ ...settings, filters, useProjectDraft: this.useProjectDraft })
    this.isOpen = false
    // legacy перезавантажував сторінку — тут достатньо перечитати налаштування
    this.page.applyLegacySettings()
  }
}

const EMPTY_EXTENDED = { enabled: false, val: [], settings: { state: [], issuer: [] } }
const toggleId = (list, id) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id])

/**
 * "Фільтр за поданням" (legacy FilterManager fProposalExtended + modal-filterProposals):
 * нежадібний фільтр — увімкнений, відбирає всі проєкти обраних подань незалежно від інших фільтрів.
 * Кожна зміна одразу зберігається і застосовується до списку (як legacy).
 */
export class ProposalFilterViewModel {
  isOpen = false
  extended = EMPTY_EXTENDED

  constructor({ scope, page }) {
    this.scope = scope
    this.page = page
    makeViewModel(this, { page: false })
    this.proposalsQuery = scope.query({
      queryKey: ['proposal-list-all'],
      queryFn: async () => {
        const { data } = await axios.get('/api/proposal', { params: { limit: 99999 }, headers: { userId: rootStore.session.userId } })
        if (!data?.success) throw new Error(data?.message || 'Не вдалося завантажити подання')
        return Array.isArray(data.data) ? data.data : []
      },
      options: () => ({ enabled: this.isOpen }),
      staleTime: 60_000,
    })
  }

  get voc() {
    return this.page.voc ?? {}
  }
  get issuers() {
    return this.voc.proposalIssuer ?? []
  }
  get states() {
    return this.voc.proposalState ?? []
  }
  get isLoading() {
    return this.proposalsQuery.isLoading
  }
  /** Подання обраних суб'єктів і станів (решта схована, як legacy display:none). */
  get visible() {
    const { issuer, state } = this.extended.settings
    const issuerCaption = Object.fromEntries(this.issuers.map((item) => [item.id, item.caption]))
    const stateById = Object.fromEntries(this.states.map((item) => [item.id, item]))
    return (this.proposalsQuery.data ?? [])
      .filter((row) => issuer.includes(row.issuerId ?? 0) && state.includes(row.stateId ?? 0))
      .map((row) => ({
        ...row,
        issuerCaption: issuerCaption[row.issuerId] ?? '',
        stateCaption: stateById[row.stateId]?.caption ?? '',
        stateIcon: stateById[row.stateId]?.icon ?? '',
      }))
  }
  isChecked(id) {
    return this.extended.val.includes(Number(id))
  }

  open() {
    const stored = mergedFilters(readSettings()).fProposalExtended ?? EMPTY_EXTENDED
    this.extended = {
      enabled: Boolean(stored.enabled),
      val: (stored.val ?? []).map(Number),
      settings: { state: (stored.settings?.state ?? []).map(Number), issuer: (stored.settings?.issuer ?? []).map(Number) },
    }
    this.isOpen = true
  }
  close() {
    this.isOpen = false
  }

  persist(extended) {
    this.extended = extended
    const settings = readSettings()
    const filters = mergedFilters(settings)
    writeSettings({ ...settings, filters: { ...filters, fProposalExtended: { ...filters.fProposalExtended, ...extended } } })
    this.page.applyLegacySettings()
  }
  /** Зміна суб'єктів/станів: усі видимі подання стають обраними (legacy refreshFilterProposalExtendedTable). */
  setScope(settings) {
    // до завантаження подань "видимі" порожні — перемикачі заблоковані у View, тут — страховка
    if (this.isLoading) return
    const draft = { ...this.extended, settings }
    this.extended = draft
    this.persist({ ...draft, val: this.visible.map((row) => Number(row.id)) })
  }
  toggleIssuer(id) {
    this.setScope({ ...this.extended.settings, issuer: toggleId(this.extended.settings.issuer, id) })
  }
  toggleState(id) {
    this.setScope({ ...this.extended.settings, state: toggleId(this.extended.settings.state, id) })
  }
  allIssuers() {
    this.setScope({ ...this.extended.settings, issuer: this.issuers.map((item) => item.id) })
  }
  allStates() {
    this.setScope({ ...this.extended.settings, state: this.states.map((item) => item.id) })
  }
  toggleRow(id) {
    this.persist({ ...this.extended, val: toggleId(this.extended.val, Number(id)) })
  }
  setEnabled(enabled) {
    this.persist({ ...this.extended, enabled })
  }
}
