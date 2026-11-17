import { Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { Link, useLocation } from 'react-router'
import { useSession, useStores } from '../../stores/storeHooks.js'
import { resolveMenuItems } from '../../entities/menu/menuCache.js'
import { resolveRouteMeta } from '../../entities/menu/routeMeta.js'

/**
 * Глобальна шапка: breadcrumbs › назва сторінки ліворуч, кнопки сторінки праворуч.
 * Назву/breadcrumbs задає <PageHeader> сторінки (ui.pageHeader); без нього — з меню сайдбару.
 * `actionsRef` — слот, куди PageHeader порталом рендерить кнопки (Додати тощо).
 */
function Header({ actionsRef }) {
  const session = useSession()
  const { ui } = useStores()
  const { pathname } = useLocation()
  const fromMenu = resolveRouteMeta(resolveMenuItems(session.menu), pathname)
  const page = ui.pageHeader
  const title = page?.title ?? fromMenu.title
  const breadcrumbs = page?.breadcrumbs ?? fromMenu.breadcrumbs

  return (
    <header
      data-i-doc="component:page-header"
      className="sticky top-0 z-30 flex h-[50px] shrink-0 items-center justify-between gap-3 border-b border-gray-300 bg-white px-4 dark:border-gray-600 dark:bg-gray-800"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumbs" className="flex shrink-0 items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" data-testid="breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {crumb.href ? (
                  <Link to={crumb.href} className="whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="whitespace-nowrap">{crumb.label}</span>
                )}
                <i className="fa-solid fa-chevron-right text-[0.6rem] opacity-60" />
              </Fragment>
            ))}
          </nav>
        )}
        {title && (
          <h1 className="min-w-0 truncate text-base font-semibold text-gray-800 dark:text-gray-100" data-testid="page-title">
            {title}
          </h1>
        )}
      </div>
      <div ref={actionsRef} className="flex shrink-0 items-center gap-2" data-testid="page-actions" />
    </header>
  )
}

export default observer(Header)
