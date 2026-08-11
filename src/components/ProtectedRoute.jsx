import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return null
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}