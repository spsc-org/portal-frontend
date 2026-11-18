import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Outlet, useMatches } from 'react-router'
import { useSession } from '../../stores/storeHooks.js'
import Header from './Header.jsx'
import Sidebar from '../../widgets/sidebar/Sidebar.jsx'
import { PageHeaderSlotContext } from './pageHeaderSlot.js'

/**
 * Каркас авторизованої зони. Сторінки master-detail (список + панель на всю
 * висоту: оголошення, задачі, досьє…) позначаються в роутері
 * `handle: { fullBleed: true }` — тоді <main> без відступів і з фіксованою
 * висотою, а сторінка сама керує скролом своїх колонок (h-full).
 */
function AuthorizedLayout() {
  const session = useSession()
  const fullBleed = useMatches().some((match) => match.handle?.fullBleed)
  // Слот кнопок сторінки в Header (<PageHeader actions> рендерить туди порталом)
  const [actionsSlot, setActionsSlot] = useState(null)

  return (
    // Звичайні сторінки скролять вікно (на це спирається BackToTop);
    // fullBleed — фіксована висота екрана, скрол усередині колонок сторінки.
    <div className={`flex bg-gray-200 dark:bg-neutral-900 ${fullBleed ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header actionsRef={setActionsSlot} />

        <main className={fullBleed ? 'min-h-0 flex-1 overflow-hidden' : 'flex-1 p-3'}>
          {/* Каркас може рендеритись з кешу меню до відповіді /api/me — сторінки лише після неї. */}
          <PageHeaderSlotContext.Provider value={actionsSlot}>{session.isAuthenticated ? <Outlet /> : null}</PageHeaderSlotContext.Provider>
        </main>
      </div>
    </div>
  )
}

export default observer(AuthorizedLayout)
