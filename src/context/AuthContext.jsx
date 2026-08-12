import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { apiFetch, setUnauthorizedHandler } from '../lib/api.js'
import { useMe, setMe } from '../hooks/useMe.js'

const AuthContext = createContext(null)

// status: 'loading' (перевіряємо сесію при старті) | 'authenticated' | 'guest'
// user/loading — зі спільного стору useMe() (src/hooks/useMe.js): він сам
// вантажить /api/me одразу при імпорті, тож AuthProvider тут НЕ робить
// власний дублюючий запит — лише читає той самий кеш, яким користуються
// Sidebar/SidebarUserMenu/інші споживачі useMe().
export function AuthProvider({ children }) {
  const { data: user, loading } = useMe()
  const status = loading ? 'loading' : user ? 'authenticated' : 'guest'

  useEffect(() => {
    setUnauthorizedHandler(() => setMe(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (email, password, remember = false) => {
    const payload = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password, remember },
    })

    setMe(payload?.data ?? null)
  }, [])

  const register = useCallback(async (fields) => {
    const payload = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: fields,
    })

    setMe(payload?.data ?? null)
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setMe(null)
  }, [])

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth має використовуватись всередині AuthProvider')
  }

  return context
}