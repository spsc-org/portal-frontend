import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'

export default function GuestRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return null
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}