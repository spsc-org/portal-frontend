import { createContext, useContext } from 'react'

export const ViewModelContext = createContext(null)

export function useVM() {
  const vm = useContext(ViewModelContext)

  if (!vm) {
    throw new Error('useVM() має використовуватись всередині <ViewModelProvider>')
  }

  return vm
}
