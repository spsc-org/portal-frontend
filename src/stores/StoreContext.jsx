import { StoreContext } from './storeHooks.js'
import { rootStore } from './RootStore.js'

export function StoreProvider({ store = rootStore, children }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
