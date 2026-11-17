import { createContext, useContext } from 'react'
import { rootStore } from './RootStore.js'

export const StoreContext = createContext(rootStore)

/** { session, dictionary } — компонент має бути observer(), щоб реагувати на зміни. */
export function useStores() {
  return useContext(StoreContext)
}

export function useSession() {
  return useStores().session
}
