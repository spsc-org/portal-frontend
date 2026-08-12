/**
 * Збирає видимі пункти меню: порядок = access.pages, метадані = catalog з SSR-boot.
 * Пункти без запису в catalog пропускаються (немає роуту / не в config/menu).
 */
export function resolveMenuItems(pages = [], catalog = {}) {
    return pages
        .map((key) => catalog[key])
        .filter(Boolean);
}

export function readSidebarBoot() {
    const el = document.getElementById('sidebar-boot');
    if (!el?.textContent) {
        return null;
    }
    try {
        return JSON.parse(el.textContent);
    } catch {
        return null;
    }
}

export function readStoredSidebarOpen(fallback = true) {
    const stored = localStorage.getItem('sidebarOpen');
    if (stored === null) return fallback;
    try {
        return JSON.parse(stored) !== false;
    } catch {
        return fallback;
    }
}

export function persistSidebarOpen(isOpen) {
    localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
    document.cookie = `sidebarOpen=${isOpen}; path=/; max-age=31536000; samesite=Strict`;
}

export function readOnlineUsersOpen(fallback = true) {
    const stored = localStorage.getItem('sidebarOnlineUsersOpen');
    if (stored === null) return fallback;
    try {
        return JSON.parse(stored) !== false;
    } catch {
        return fallback;
    }
}

export function persistOnlineUsersOpen(isOpen) {
    localStorage.setItem('sidebarOnlineUsersOpen', JSON.stringify(isOpen));
}

/** Активність пункту: точний path або вкладений шлях ( /task/… ). */
export function isHrefActive(href, pathname = window.location.pathname) {
    if (!href || href === '#') return false;
    const path = pathname.replace(/\/+$/, '') || '/';
    const target = href.replace(/\/+$/, '') || '/';
    if (path === target) return true;
    return path.startsWith(`${target}/`);
}
