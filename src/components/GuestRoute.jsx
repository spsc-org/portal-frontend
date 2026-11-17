import { observer } from 'mobx-react-lite'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '../stores/storeHooks.js'

function GuestRoute() {
  const session = useSession()
  const location = useLocation()

  if (session.status === 'loading') {
    return null
  }

  if (session.status === 'authenticated') {
    // Повертаємо туди, звідки ProtectedRoute відправив на /login.
    const from = location.state?.from
    const target = from ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/'
    return <Navigate to={target} replace />
  }

  return <Outlet />
}

export default observer(GuestRoute)
