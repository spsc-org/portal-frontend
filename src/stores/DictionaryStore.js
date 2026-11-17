import { makeAutoObservable } from 'mobx'
import { apiFetch } from '../lib/api.js'

export const DICTIONARY_KEY = ['dictionary']

/**
 * Глобальний словник користувача (GET /api/voc_user) — замість
 * DictionaryContext + запиту в Page.jsx. Вантажиться лише коли його
 * хтось читає (enableOnDemand) і користувач автентифікований.
 */
export class DictionaryStore {
  constructor({ scope, session }) {
    this.scope = scope
    this.session = session
    makeAutoObservable(this, { scope: false, session: false }, { autoBind: true })

    this.query = scope.query({
      queryKey: DICTIONARY_KEY,
      queryFn: () => apiFetch('/api/voc_user'),
      enableOnDemand: true,
      options: () => ({ enabled: this.session.isAuthenticated }),
      staleTime: Infinity,
    })
  }

  get dictionary() {
    return this.query.data ?? null
  }

  get isLoading() {
    return this.query.isLoading
  }

  refresh() {
    return this.scope.invalidate(DICTIONARY_KEY)
  }
}
