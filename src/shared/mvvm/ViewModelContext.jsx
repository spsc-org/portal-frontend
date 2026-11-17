import { ViewModelContext } from './viewModelHooks.js'

/** Робить VM сторінки доступною вкладеним View без prop-drilling. */
export function ViewModelProvider({ value, children }) {
  return <ViewModelContext.Provider value={value}>{children}</ViewModelContext.Provider>
}
