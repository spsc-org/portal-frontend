import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, setUnauthorizedHandler } from '../lib/api.js'

const AuthContext = createContext(null)

// status: 'loading' (перевіряємо сесію при старті) | 'authenticated' | 'guest'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus('guest')
    })

    apiFetch('/api/me')
      .then((payload) => {
        setUser(payload?.data ?? null)
        setStatus('authenticated')
      })
      .catch(() => {
        setUser(null)
        setStatus('guest')
      })

    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const payload = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    setUser(payload?.data ?? null)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setStatus('guest')
  }, [])

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth має використовуватись всередині AuthProvider')
  }

  return context
}