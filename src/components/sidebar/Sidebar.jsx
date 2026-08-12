import {
    isHrefActive,
    persistOnlineUsersOpen, persistSidebarOpen,
    readOnlineUsersOpen,
    readSidebarBoot,
    readStoredSidebarOpen, resolveMenuItems
} from "./sidebarMenu.js";
import {useEffect, useMemo, useRef, useState} from "react";
import NotificationListPopover from "../NotificationListPopover.jsx";
import {useMe} from "../../hooks/useMe.js";
import SidebarUserMenu from "../SidebarUserMenu.jsx";

function BrandMark({brand, open}) {
    if (!open) return null;

    let mark = null;
    if (brand.mode === 'webhook') {
        mark = <i className="fa-solid fa-webhook text-xl"/>;
    } else if (brand.mode === 'test' && brand.testLogoUrl) {
        mark = <img src={brand.testLogoUrl} alt="Test Logo" className="h-8"/>;
    } else if (brand.logoUrl) {
        mark = <img src={brand.logoUrl} alt="Logo" className="h-8"/>;
    }

    return (
        <a
            href={brand.href}
            className="group flex items-center gap-x-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
        >
            {mark}
            <span className="text-xl font-semibold text-slate-800 dark:text-slate-200">{brand.title}</span>
        </a>
    );
}

function NavItem({item, open, pathname}) {
    const isGroup = !item.href;
    const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
    const submenuActive = hasSubmenu && item.submenu.some((sub) => isHrefActive(sub.href, pathname));
    // Пункт-посилання на "перший доступний" (expandable:false, напр.
    // Адміністрування/Довідники) підсвічується і тоді, коли користувач на
    // ІНШІЙ дочірній сторінці зі свого ж submenu — не лише на тій, куди сам
    // href веде (бо дочірні сторінки не вкладені одна в одну в URL).
    const active = !isGroup && (isHrefActive(item.href, pathname) || submenuActive);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
    const badgeRef = useRef(null);
    // Шеврон/розкривна панель — лише коли явно expandable (за замовчуванням
    // true); false — submenu в даних лишається (для підсвітки вище), але
    // сайдбар його не малює (перемикання — через secondary-nav сторінки).
    const showSubmenuPanel = hasSubmenu && item.expandable !== false;

    const linkClass = active
        ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white'
        : 'border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';
    const iconClass = active
        ? 'text-blue-600 dark:text-blue-300'
        : 'text-slate-500 dark:text-slate-400';

    const toggleSubmenu = () => setSubmenuOpen((prev) => !prev);

    const labelContent = (
        <span className="flex min-w-0 items-center">
            <i className={`${item.icon} w-4 shrink-0 text-center text-xs ${iconClass}`}/>
            {open && (
                <span className="mx-2 min-w-0 flex-1 truncate whitespace-nowrap text-xs font-medium">{item.label}</span>
            )}
        </span>
    );

    return (
        <div className="group relative my-1">
            <div className="flex items-center gap-1">
                {isGroup ? (
                    // Група-контейнер без власної сторінки (напр. "Адміністрування") —
                    // клік лише розгортає підменю, нікуди не веде.
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={toggleSubmenu}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleSubmenu();
                            }
                        }}
                        title={item.label}
                        className={`sidebar-link relative flex-1 cursor-pointer select-none rounded-md border px-2 py-1 transition ${linkClass}`}
                    >
                        {labelContent}
                    </div>
                ) : (
                    <a
                        href={item.href}
                        title={item.label}
                        className={`sidebar-link relative flex-1 rounded-md border px-2 py-1 transition ${linkClass}`}
                    >
                        <span className="flex min-w-0 items-center">
                            <i className={`${item.icon} w-4 shrink-0 text-center text-xs ${iconClass}`}/>
                            {open && (
                                <span className="mx-2 min-w-0 flex-1 truncate whitespace-nowrap text-xs font-medium">{item.label}</span>
                            )}
                            <span
                                ref={badgeRef}
                                id={`sidebar-badge-${item.key}`}
                                title="Показати нотифікації цього розділу"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setNotifPopoverOpen((prev) => !prev);
                                }}
                                className={`sidebar-badge hidden cursor-pointer items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white transition hover:bg-red-600 ${
                                    open
                                        ? 'ml-auto h-[1.1rem] min-w-[1.1rem] shrink-0'
                                        : 'absolute -right-1 -top-1 h-[1.1rem] min-w-[1.1rem] ring-2 ring-white dark:ring-slate-900'
                                }`}
                            />
                        </span>
                    </a>
                )}
                {!isGroup && (
                    <NotificationListPopover
                        open={notifPopoverOpen}
                        onClose={() => setNotifPopoverOpen(false)}
                        anchorRef={badgeRef}
                        filterParams={{section: item.key}}
                        title={item.label}
                    />
                )}
                {showSubmenuPanel && open && (
                    <button
                        type="button"
                        onClick={() => setSubmenuOpen((prev) => !prev)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label={item.label}
                    >
                        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${submenuOpen || submenuActive ? 'rotate-180' : ''}`}/>
                    </button>
                )}
            </div>

            {showSubmenuPanel && open && (
                <div
                    className={`mt-1 ml-7 grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                        submenuOpen || submenuActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                    <div className="overflow-hidden border-l border-slate-300/80 pl-2 dark:border-slate-700">
                        {item.submenu.map((sub) => {
                            const subActive = isHrefActive(sub.href, pathname);
                            return (
                                <a
                                    key={sub.href}
                                    href={sub.href}
                                    className={`mb-0.5 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition ${
                                        subActive
                                            ? 'bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-300'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <i className="fa-solid fa-level-up-alt rotate-90 text-[10px] opacity-70"/>
                                    <i className={`${sub.icon} text-[11px]`}/>
                                    {sub.label}
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {!open && (
                <div className="pointer-events-none invisible absolute left-[calc(100%+0.625rem)] top-1/2 z-[1300] -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {item.label}
                </div>
            )}
        </div>
    );
}

function OnlineUsersBlock({open, ui}) {
    const [expanded, setExpanded] = useState(() => readOnlineUsersOpen(true));

    useEffect(() => {
        persistOnlineUsersOpen(expanded);
    }, [expanded]);

    // #activeUsers завжди в DOM: ActiveUsers.js / UserActivityManager кешують вузол.
    // Ховаємо через CSS (collapse сайдбару або секції), не demount.
    return (
        <div className={open ? undefined : 'hidden'}>
            {open && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="group flex w-full items-center justify-between gap-2 rounded-md px-0.5 py-0.5 text-left transition hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
                    title={expanded ? ui.collapse : ui.expand}
                    aria-expanded={expanded}
                    aria-controls="activeUsers"
                >
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {ui.onlineUsers}
                    </h2>
                    <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 dark:text-slate-500 ${expanded ? '' : 'rotate-180'}`}/>
                </button>
            )}
            <div id="activeUsers" className={`mt-2 ${open && expanded ? '' : 'hidden'}`}/>
        </div>
    );
}

/**
 * Глобальний React-сайдбар (контент у існуючий <aside id="sidebar">).
 * Каталог/підписи/href — з SSR boot (SidebarBootFactory);
 * видимість — access.pages з /api/me (фолбек boot.pages);
 * версія блогу розробників — version з /api/me (фолбек boot.version).
 */
export default function Sidebar({boot: bootProp = null}) {
    const boot = bootProp ?? readSidebarBoot();
    const {data: me} = useMe();
    const [open, setOpen] = useState(() => readStoredSidebarOpen(boot?.open ?? true));
    const [pathname, setPathname] = useState(() => window.location.pathname);

    console.log(me);
    useEffect(() => {
        persistSidebarOpen(open);
        const host = document.getElementById('sidebar');
        if (!host) return;
        host.classList.toggle('w-56', open);
        host.classList.toggle('w-16', !open);
    }, [open]);

    useEffect(() => {
        const onNav = () => setPathname(window.location.pathname);
        window.addEventListener('popstate', onNav);
        return () => window.removeEventListener('popstate', onNav);
    }, []);

    useEffect(() => {
        const applySections = (sections) => {
            Object.entries(sections || {}).forEach(([page, count]) => {
                const el = document.getElementById(`sidebar-badge-${page}`);
                if (!el) return;
                if (count > 0) {
                    el.textContent = count > 99 ? '99+' : String(count);
                    el.classList.remove('hidden');
                    el.classList.add('flex');
                } else {
                    el.classList.add('hidden');
                    el.classList.remove('flex');
                }
            });
        };

        const clearAllBadges = () => {
            document.querySelectorAll('[id^="sidebar-badge-"]').forEach((el) => {
                el.classList.add('hidden');
                el.classList.remove('flex');
            });
        };

        fetch('/api/notifications/sections', {headers: {Accept: 'application/json'}})
            .then((response) => (response.ok ? response.json() : null))
            .then((json) => applySections(json?.success ? json.data : {}))
            .catch(() => {});

        const rawUserId = document.querySelector('meta[name="userId"]')?.getAttribute('content');
        const userId = Number(rawUserId);
        if (!Number.isFinite(userId) || userId <= 0 || !window.Echo) {
            return undefined;
        }

        // Той самий приватний канал, що й дзвіник нотифікацій (NotificationBell.jsx) —
        // бейджі оновлюються реактивно з тих самих подій, без окремого
        // window.refreshSidebarBadges() (видалено разом із BadgeService/EntityView).
        const channel = window.Echo.private(`notifications.${userId}`);
        channel.listen('.notification.created', (e) => applySections(e.sections));
        channel.listen('.notification.read', (e) => applySections(e.sections));
        channel.listen('.notifications.read_for_entity', (e) => applySections(e.sections));
        channel.listen('.notifications.read_all', clearAllBadges);

        return () => {
            window.Echo.leave(`notifications.${userId}`);
        };
    }, [me?.access?.pages, boot?.pages]);

    const pages = me?.access?.pages ?? boot?.pages ?? [];
    const items = useMemo(
        () => resolveMenuItems(pages, boot?.catalog ?? {}),
        [pages, boot?.catalog],
    );

    if (!boot) {
        return null;
    }

    const ui = boot.ui ?? {};

    return (
        <span data-i-doc="component:sidebar" style={{display: "contents"}}>
            <div className="mb-2 flex items-center justify-between">
                <BrandMark brand={boot.brand} open={open}/>
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    aria-label={open ? ui.collapse : ui.expand}
                >
                    <i className={`fa-solid ${open ? 'fa-left-long-to-line' : 'fa-right-long-to-line'} text-sm transition-transform duration-300`}/>
                </button>
            </div>

            <hr className="my-3 border-slate-200 dark:border-slate-700"/>

            <div className="flex min-h-0 flex-1 flex-col">
                {/* flex-1 замість фіксованого h-[46vh]: коли блок "Користувачі
                    онлайн" згорнутий, він займає мінімум місця, і цей список
                    сам розтягується на вивільнений простір; коли розгорнутий —
                    навпаки, стискається на користь списку користувачів. */}
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] dark:[scrollbar-color:#475569_transparent]">
                    <nav>
                        {items.map((item) => (
                            <NavItem key={item.key} item={item} open={open} pathname={pathname}/>
                        ))}
                    </nav>
                </div>

                <hr className="my-3 shrink-0 border-slate-200 dark:border-slate-700"/>
                <OnlineUsersBlock open={open} ui={ui}/>
            </div>

            <div className="mt-4 px-2">
                <button
                    type="button"
                    onClick={() => window.openIssueModal?.()}
                    title={`${ui.feedback} (Alt+B)`}
                    className="group flex w-full items-center gap-x-2 rounded-lg border border-slate-300/80 bg-white/50 px-2 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <i className="fa-solid fa-circle-exclamation text-sm opacity-70 group-hover:text-blue-600 dark:group-hover:text-blue-400"/>
                    {open && <span className="text-xs font-medium">{ui.feedback}</span>}
                </button>
            </div>

            {open && (
                <div className="-mb-1 mt-2 text-center">
                    <a
                        href="/developer-posts"
                        className="text-xs text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        title="Що нового"
                    >
                        Версія {me?.version ?? boot.version}
                    </a>
                </div>
            )}

            <div className={`mt-4 flex min-w-0 items-center px-2 py-1.5 ${open ? 'justify-between' : 'justify-center'}`}>
                <SidebarUserMenu
                    profileUrl={boot.profileUrl}
                    settingsUrl={boot.settingsUrl}
                    fallbackInitials={boot.user?.initials}
                    fallbackName={boot.user?.name}
                    collapsed={!open}
                />
            </div>

            {open && (
                <a href="/welcome" className="mt-2 text-center text-xs">
                    <span className="p-0.5 text-slate-600 dark:text-slate-300">
                        © {new Date().getFullYear()}{' '}
                        <span className="text-slate-700 dark:text-slate-300">Sanctions policy support centre</span>
                    </span>
                </a>
            )}
        </span>
    );
}
