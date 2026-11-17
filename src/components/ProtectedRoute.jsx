import { observer } from 'mobx-react-lite'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '../stores/storeHooks.js'

function ProtectedRoute() {
  const session = useSession()
  const location = useLocation()

  // Поки /api/me у дорозі: з кешем меню одразу показуємо каркас (сайдбар),
  // сам вміст сторінки AuthorizedLayout чекає підтвердження сесії.
  if (session.status === 'loading' && !session.canRenderShell) {
    return null
  }

  if (session.status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default observer(ProtectedRoute)
