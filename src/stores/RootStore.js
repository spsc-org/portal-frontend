import { setUnauthorizedHandler } from '../lib/api.js'
import { VmScope } from '../shared/mvvm/VmScope.js'
import { SessionStore } from './SessionStore.js'
import { DictionaryStore } from './DictionaryStore.js'
import { UiStore } from './UiStore.js'

/**
 * Глобальний стан SPA (живе весь час роботи застосунку, тому scope не
 * dispose-иться). Сторінкові стани — у ViewModel-ах (src/shared/mvvm).
 */
export class RootStore {
  constructor() {
    this.scope = new VmScope()
    this.session = new SessionStore({ scope: this.scope })
    this.dictionary = new DictionaryStore({ scope: this.scope, session: this.session })
    this.ui = new UiStore()

    // 401 з будь-якого запиту → UI одразу переходить у стан "гість".
    setUnauthorizedHandler(() => this.session.handleUnauthorized())
  }
}

export const rootStore = new RootStore()
