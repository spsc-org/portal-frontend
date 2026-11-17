import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, useLocation } from 'react-router';
import { useViewModel } from '../../shared/mvvm/useViewModel.js';
import { useStores } from '../../stores/storeHooks.js';
import SectionNotificationsPopover from '../notifications/SectionNotificationsPopover.jsx';
import SidebarNavSkeleton from '../../components/sidebar/SidebarNavSkeleton.jsx';
import { SIDEBAR_UI, SidebarViewModel } from './SidebarViewModel.js';
import { isHrefActive } from './sidebarStorage.js';
import OnlineUsersBlock from './OnlineUsersBlock.jsx';
import SidebarUserMenu from './SidebarUserMenu.jsx';

const NavItem = observer(function NavItem({ vm, item, pathname }) {
    const { open } = vm;
    const isGroup = !item.href;
    const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
    const submenuActive = hasSubmenu && item.submenu.some((sub) => isHrefActive(sub.href, pathname));
    // Пункт "перший доступний" (expandable:false) підсвічується і на інших
    // дочірніх сторінках свого submenu, бо вони не вкладені одна в одну в URL.
    const active = !isGroup && (isHrefActive(item.href, pathname) || submenuActive);
    // UI-стан одного пункту (розгорнуто/popover) — локальний для View, не для VM сторінки.
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const badgeRef = useRef(null);
    const showSubmenuPanel = hasSubmenu && item.expandable !== false;
    const badgeCount = vm.badgeCount(item.key);

    const linkClass = active
        ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white'
        : 'border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';
    const iconClass = active ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400';
    const toggleSubmenu = () => setSubmenuOpen((prev) => !prev);

    const label = (
        <>
            <i className={`${item.icon} w-4 shrink-0 text-center text-xs ${iconClass}`} />
            {open && <span className="mx-2 min-w-0 flex-1 truncate whitespace-nowrap text-xs font-medium">{item.label}</span>}
        </>
    );

    return (
        <div className="group relative my-1">
            <div className="flex items-center gap-1">
                {isGroup ? (
                    // Група-контейнер без власної сторінки — клік лише розгортає підменю.
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
                        <span className="flex min-w-0 items-center">{label}</span>
                    </div>
                ) : (
                    <Link
                        to={item.href}
                        title={item.label}
                        className={`sidebar-link relative flex-1 rounded-md border px-2 py-1 transition ${linkClass}`}
                    >
                        <span className="flex min-w-0 items-center">
                            {label}
                            {badgeCount > 0 && (
                                <span
                                    ref={badgeRef}
                                    title="Показати нотифікації цього розділу"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPopoverOpen((prev) => !prev);
                                    }}
                                    className={`flex cursor-pointer items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white transition hover:bg-red-600 ${
                                        open
                                            ? 'ml-auto h-[1.1rem] min-w-[1.1rem] shrink-0'
                                            : 'absolute -right-1 -top-1 h-[1.1rem] min-w-[1.1rem] ring-2 ring-white dark:ring-slate-900'
                                    }`}
                                >
                                    {vm.badgeLabel(item.key)}
                                </span>
                            )}
                        </span>
                    </Link>
                )}
                {popoverOpen && (
                    <SectionNotificationsPopover
                        section={item.key}
                        title={item.label}
                        anchorRef={badgeRef}
                        onClose={() => setPopoverOpen(false)}
                    />
                )}
                {showSubmenuPanel && open && (
                    <button
                        type="button"
                        onClick={toggleSubmenu}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label={item.label}
                    >
                        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${submenuOpen || submenuActive ? 'rotate-180' : ''}`} />
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
                        {item.submenu.map((sub) => (
                            <Link
                                key={sub.href}
                                to={sub.href}
                                className={`mb-0.5 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition ${
                                    isHrefActive(sub.href, pathname)
                                        ? 'bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-300'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <i className="fa-solid fa-level-up-alt rotate-90 text-[10px] opacity-70" />
                                <i className={`${sub.icon} text-[11px]`} />
                                {sub.label}
                            </Link>
                        ))}
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
});

/** Глобальний сайдбар SPA: меню з /api/me (з кешем у localStorage), бейджі розділів, онлайн-користувачі. */
function Sidebar() {
    const vm = useViewModel((deps) => new SidebarViewModel(deps));
    const { ui } = useStores();
    const { pathname } = useLocation();
    const open = vm.open;

    return (
        <aside
            data-i-doc="component:sidebar"
            // Висота — рівно екран (не за вмістом сторінки): sticky лишає сайдбар на місці, поки
            // скролиться вікно, а довге меню прокручується всередині (flex-1 + overflow-y-auto).
            className={`sticky top-0 flex h-screen shrink-0 flex-col self-start overflow-hidden border-r border-slate-200 bg-white p-3 transition-[width] duration-300 dark:border-slate-700 dark:bg-slate-900 ${
                open ? 'w-56' : 'w-16'
            }`}
        >
            <div className="mb-2 flex items-center justify-between">
                {open && (
                    <Link
                        to="/"
                        className="group flex items-center gap-x-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
                    >
                        <span className="text-xl font-semibold text-slate-800 dark:text-slate-200">Portal</span>
                    </Link>
                )}
                <button
                    type="button"
                    onClick={vm.toggleOpen}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    aria-label={open ? SIDEBAR_UI.collapse : SIDEBAR_UI.expand}
                >
                    <i className={`fa-solid ${open ? 'fa-left-long-to-line' : 'fa-right-long-to-line'} text-sm transition-transform duration-300`} />
                </button>
            </div>

            <hr className="my-3 border-slate-200 dark:border-slate-700" />

            <div className="flex min-h-0 flex-1 flex-col">
                {/* flex-1: коли блок "Користувачі онлайн" згорнутий, меню займає вивільнене місце. */}
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] dark:[scrollbar-color:#475569_transparent]">
                    <nav>
                        {vm.isMenuLoading ? (
                            <SidebarNavSkeleton open={open} />
                        ) : (
                            vm.items.map((item) => <NavItem key={item.key} vm={vm} item={item} pathname={pathname} />)
                        )}
                    </nav>
                </div>

                <hr className="my-3 shrink-0 border-slate-200 dark:border-slate-700" />
                {/* Каркас може бути з кешу меню — онлайн/користувач лише після підтвердження сесії. */}
                {vm.isAuthenticated && (
                    <OnlineUsersBlock
                        sidebarOpen={open}
                        expanded={vm.onlineUsersOpen}
                        onToggleExpanded={vm.toggleOnlineUsers}
                        ui={SIDEBAR_UI}
                    />
                )}
            </div>

            <div className="mt-4 px-2">
                <button
                    type="button"
                    onClick={ui.openFeedback}
                    title={`${SIDEBAR_UI.feedback} (Alt+B)`}
                    className="group flex w-full items-center gap-x-2 rounded-lg border border-slate-300/80 bg-white/50 px-2 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <i className="fa-solid fa-circle-exclamation text-sm opacity-70 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    {open && <span className="text-xs font-medium">{SIDEBAR_UI.feedback}</span>}
                </button>
            </div>

            {open && vm.version && (
                <div className="-mb-1 mt-2 text-center">
                    <Link
                        to="/developer-posts"
                        className="text-xs text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        title="Що нового"
                    >
                        Версія {vm.version}
                    </Link>
                </div>
            )}

            <div className={`mt-4 flex min-w-0 items-center px-2 py-1.5 ${open ? 'justify-between' : 'justify-center'}`}>
                {vm.isAuthenticated && <SidebarUserMenu collapsed={!open} />}
            </div>

            {open && (
                <Link to="/welcome" className="mt-2 text-center text-xs">
                    <span className="p-0.5 text-slate-600 dark:text-slate-300">
                        © {new Date().getFullYear()}{' '}
                        <span className="text-slate-700 dark:text-slate-300">Sanctions policy support centre</span>
                    </span>
                </Link>
            )}
        </aside>
    );
}

export default observer(Sidebar);
