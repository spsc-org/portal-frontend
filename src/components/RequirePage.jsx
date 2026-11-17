import { observer } from 'mobx-react-lite'
import { Outlet, useLocation } from 'react-router'
import { useSession } from '../stores/storeHooks.js'
import Forbidden from '../pages/Forbidden.jsx'

/**
 * Layout-guard сторінки — дзеркало бекендних перевірок веб-маршруту:
 *  - `pageAccess` (default true) — middleware PageAccess: шлях має починатися
 *    з "/{key}" одного з ключів permissions.pages;
 *  - `gate` — Gate::authorize у веб-контролері, напр. { page: 'search', action: 'read' }.
 *
 *   { element: <RequirePage gate={{ page: 'report', action: 'read' }} />, children: [...] }
 *
 * Бекенд однаково перевіряє доступ на кожному API-запиті; guard лише не
 * показує сторінку, яку користувач і так не зможе завантажити.
 */
function RequirePage({ pageAccess = true, gate = null }) {
  const session = useSession()
  const { pathname } = useLocation()

  if (!session.permissionsReady) {
    return null
  }

  const allowed =
    (!pageAccess || session.hasPageAccess(pathname)) &&
    (!gate || session.can(gate.page, gate.action ?? 'read'))

  return allowed ? <Outlet /> : <Forbidden />
}

export default observer(RequirePage)
