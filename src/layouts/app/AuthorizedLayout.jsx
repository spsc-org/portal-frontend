import { useMemo } from 'react'
import { Outlet } from 'react-router'
import { useMe } from '../../hooks/useMe.js'
import Header from './Header.jsx'
import Sidebar from "../../components/sidebar/Sidebar.jsx";

const SIDEBAR_UI = {
  collapse: 'Згорнути',
  expand: 'Розгорнути',
  onlineUsers: 'Користувачі онлайн',
  feedback: 'Залишити відгук',
}

// /api/me.access.pages — плоский масив ключів сторінок, без label/icon/href.
// /api/me.menu.catalog — реальні метадані (label/icon/href/submenu) з бекенду.
// Для ключів, яких у menu.catalog ще нема, лишаємо плейсхолдер-заглушку.
function humanizeKey(key) {
  return key.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildSidebarBoot(pages, menuCatalog) {
  const catalog = Object.fromEntries(
    pages.map((key) => [
      key,
      menuCatalog[key]
        ? { key, ...menuCatalog[key] }
        : { key, label: humanizeKey(key), href: `/${key}`, icon: 'fa-solid fa-circle' },
    ]),
  )

  return {
    brand: { href: '/', title: 'Portal' },
    ui: SIDEBAR_UI,
    open: true,
    profileUrl: '/profile',
    settingsUrl: '/settings',
    pages,
    catalog,
  }
}

export default function AuthorizedLayout() {
  const { data: me } = useMe()
  const boot = useMemo(
    () => buildSidebarBoot(me?.access?.pages ?? [], me?.menu?.catalog ?? {}),
    [me],
  )

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside
        id="sidebar"
        className="flex w-56 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white p-3 transition-[width] duration-300 dark:border-slate-700 dark:bg-slate-900"
      >
        <Sidebar boot={boot} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}