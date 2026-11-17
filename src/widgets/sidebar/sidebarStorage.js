// Персистентні налаштування сайдбару (ті самі ключі, що й у Blade/Inertia-версії).

function readBool(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return fallback
    return JSON.parse(stored) !== false
  } catch {
    return fallback
  }
}

function writeBool(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage недоступний (приватний режим) — не критично
  }
}

export const readSidebarOpen = (fallback = true) => readBool('sidebarOpen', fallback)

export function persistSidebarOpen(isOpen) {
  writeBool('sidebarOpen', isOpen)
  // Cookie читав бекенд для SSR-ширини сайдбару в Blade-лейауті.
  document.cookie = `sidebarOpen=${isOpen}; path=/; max-age=31536000; samesite=Strict`
}

export const readOnlineUsersOpen = (fallback = true) => readBool('sidebarOnlineUsersOpen', fallback)
export const persistOnlineUsersOpen = (isOpen) => writeBool('sidebarOnlineUsersOpen', isOpen)

/** Активність пункту: точний path або вкладений шлях (/task/…). */
export function isHrefActive(href, pathname) {
  if (!href || href === '#') return false
  const path = pathname.replace(/\/+$/, '') || '/'
  const target = href.replace(/\/+$/, '') || '/'
  return path === target || path.startsWith(`${target}/`)
}
