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
import PortalLogo from '../../components/PortalLogo.jsx';
import SidebarUserMenu from './SidebarUserMenu.jsx';

// Дизайн "Portal — Login" › Sidebar: 280px / 72px, пункти 40px (44px у згорнутому), rounded-lg.
const ITEM_ACTIVE = 'font-medium bg-neutral-800 text-white';
const ITEM_IDLE =
    'text-gray-300 hover:bg-neutral-800 hover:text-white';
const ICON_BTN =
    'inline-flex items-center justify-center rounded-lg transition text-gray-400 hover:bg-neutral-700 hover:text-white';

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
    const submenuShown = submenuOpen || submenuActive;
    const badgeCount = vm.badgeCount(item.key);

    const itemClass = `relative flex items-center rounded-lg transition ${active ? ITEM_ACTIVE : ITEM_IDLE} ${
        open ? 'h-7 min-w-0 flex-1 gap-2 px-2' : 'h-8 w-8 justify-center'
    }`;
    const iconClass = active ? 'text-blue-400' : 'text-gray-400';
    const toggleSubmenu = () => setSubmenuOpen((prev) => !prev);

    const label = (
        <>
            <i className={`${item.icon} w-4 shrink-0 text-center text-xs ${iconClass}`} aria-hidden="true" />
            {open && <span className="min-w-0 flex-1 truncate whitespace-nowrap text-xs">{item.label}</span>}
        </>
    );

    return (
        <div className={`group relative ${open ? '' : 'flex justify-center'}`}>
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
                        aria-label={open ? undefined : item.label}
                        aria-expanded={showSubmenuPanel ? submenuShown : undefined}
                        className={`sidebar-link cursor-pointer select-none ${itemClass}`}
                    >
                        {label}
                    </div>
                ) : (
                    <Link
                        to={item.href}
                        aria-current={active ? 'page' : undefined}
                        aria-label={open ? undefined : item.label}
                        className={`sidebar-link ${itemClass}`}
                    >
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
                                className={`flex h-[1.1rem] min-w-[1.1rem] cursor-pointer items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white transition hover:bg-red-600 ${
                                    open
                                        ? 'shrink-0'
                                        : 'absolute -right-0.5 -top-0.5 ring-2 ring-neutral-900'
                                }`}
                            >
                                {vm.badgeLabel(item.key)}
                            </span>
                        )}
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
                        className={`${ICON_BTN} h-6 w-6 shrink-0`}
                        aria-label={item.label}
                        aria-expanded={submenuShown}
                    >
                        <i
                            className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${submenuShown ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                        />
                    </button>
                )}
            </div>

            {showSubmenuPanel && open && (
                <div
                    className={`ml-4 grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                        submenuShown ? 'mt-0.5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                    <div className="flex flex-col gap-px overflow-hidden border-l pl-2 border-neutral-700">
                        {item.submenu.map((sub) => {
                            const subActive = isHrefActive(sub.href, pathname);
                            return (
                                <Link
                                    key={sub.href}
                                    to={sub.href}
                                    aria-current={subActive ? 'page' : undefined}
                                    title={sub.legacy ? `${sub.label} — легасі-сторінка, доступ закрито` : sub.label}
                                    className={`flex h-6 items-center gap-1.5 rounded-md px-2 text-[11px] transition ${
                                        subActive ? ITEM_ACTIVE : ITEM_IDLE
                                    } ${sub.legacy ? 'opacity-60' : ''}`}
                                >
                                    <i
                                        className={`${sub.icon} w-3.5 shrink-0 text-center text-[11px] ${
                                            subActive ? 'text-blue-400' : 'text-gray-400'
                                        }`}
                                        aria-hidden="true"
                                    />
                                    <span className="min-w-0 truncate">{sub.label}</span>
                                    {sub.legacy && (
                                        <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded px-1 text-[9px] font-semibold uppercase bg-neutral-700 text-gray-400">
                                            <i className="fa-solid fa-lock text-[8px]" aria-hidden="true" />
                                            легасі
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {!open && (
                <div className="pointer-events-none invisible absolute left-[calc(100%+0.75rem)] top-1/2 z-[1300] -translate-y-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 border-neutral-700 bg-neutral-800 text-gray-200">
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

    const toggleButton = (
        <button
            type="button"
            onClick={vm.toggleOpen}
            className={`${ICON_BTN} ${open ? 'h-10 w-10' : 'h-11 w-11'}`}
            aria-label={open ? SIDEBAR_UI.collapse : SIDEBAR_UI.expand}
            title={open ? SIDEBAR_UI.collapse : SIDEBAR_UI.expand}
        >
            <i className={`fa-solid ${open ? 'fa-angles-left' : 'fa-angles-right'} text-sm`} aria-hidden="true" />
        </button>
    );

    return (
        <aside
            data-i-doc="component:sidebar"
            aria-label="Головне меню"
            // Висота — рівно екран (не за вмістом сторінки): sticky лишає сайдбар на місці, поки
            // скролиться вікно, а довге меню прокручується всередині (flex-1 + overflow-y-auto).
            className={`sticky top-0 flex h-screen shrink-0 flex-col self-start overflow-hidden border-r transition-[width] duration-300 border-neutral-700 bg-neutral-900 text-gray-300 ${
                open ? 'w-[280px]' : 'w-[72px]'
            }`}
        >
            {/* Висота шапки = глобальний Header (50px), щоб нижні межі йшли однією лінією. */}
            <div
                className={`flex h-[50px] shrink-0 items-center border-b border-neutral-700 ${
                    open ? 'justify-between pl-5 pr-3' : 'justify-center'
                }`}
            >
                <Link
                    to="/"
                    title="Портал"
                    aria-label={open ? undefined : 'Портал'}
                    className="flex items-center gap-2.5 rounded-lg"
                >
                    <PortalLogo className="h-[30px] w-[30px] shrink-0 text-blue-400" />
                    {open && (
                        <span className="text-lg font-bold tracking-wide text-white">Портал</span>
                    )}
                </Link>
                {open && toggleButton}
            </div>

            {!open && <div className="mt-3 flex shrink-0 justify-center">{toggleButton}</div>}

            <div
                className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden [scrollbar-color:#525252_transparent] ${
                    // У 72px-колонці смуга прокрутки перекриває іконки — ховаємо її (колесо працює).
                    open ? 'px-2 py-2 [scrollbar-width:thin]' : 'py-1.5 [scrollbar-width:none]'
                }`}
            >
                <nav className="flex flex-col gap-px">
                    {vm.isMenuLoading ? (
                        <SidebarNavSkeleton open={open} />
                    ) : (
                        vm.items.map((item) => <NavItem key={item.key} vm={vm} item={item} pathname={pathname} />)
                    )}
                </nav>

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

            <div
                className={`flex shrink-0 flex-col gap-3 border-t py-3 border-neutral-700 ${
                    open ? 'px-3' : 'items-center'
                }`}
            >
                <button
                    type="button"
                    onClick={ui.openFeedback}
                    title={`${SIDEBAR_UI.feedback} (Alt+B)`}
                    aria-label={open ? undefined : SIDEBAR_UI.feedback}
                    className={`flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition border-blue-400/40 bg-blue-800/20 text-blue-300 hover:bg-blue-800/35 ${
                        open ? 'h-10 w-full' : 'h-11 w-11'
                    }`}
                >
                    <i className="fa-solid fa-circle-exclamation text-[15px]" aria-hidden="true" />
                    {open && <span>{SIDEBAR_UI.feedback}</span>}
                </button>

                {vm.isAuthenticated && <SidebarUserMenu collapsed={!open} />}

                {vm.version && (
                    <Link
                        to="/developer-posts"
                        className={`text-center transition text-gray-400 hover:text-white ${
                            open ? 'text-xs' : 'text-[11px]'
                        }`}
                        title="Що нового"
                    >
                        {open ? `Портал · версія ${vm.version}` : `v${vm.version}`}
                    </Link>
                )}

                {open && (
                    <Link
                        to="/welcome"
                        className="-mt-2 truncate text-center text-[11px] text-gray-400 hover:text-white"
                    >
                        © {new Date().getFullYear()} Sanctions policy support centre
                    </Link>
                )}
            </div>
        </aside>
    );
}

export default observer(Sidebar);
