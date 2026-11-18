import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate } from 'react-router';
import { useViewModel } from '../../shared/mvvm/useViewModel.js';
import { groupNotificationsByCategory } from '../../lib/notificationTypes';
import { NotificationBellViewModel } from './NotificationBellViewModel.js';
import NotificationPanelRow, { EmptyNotifications } from './NotificationPanelRow.jsx';
import { positionStyle } from './anchoredPosition.js';
import { useDismissOnOutside } from './useDismissOnOutside.js';

function NotificationBell() {
    const vm = useViewModel((deps) => new NotificationBellViewModel(deps));
    const navigate = useNavigate();
    const btnRef = useRef(null);
    const panelRef = useRef(null);

    useDismissOnOutside(vm.open, [btnRef, panelRef], vm.close, 'click');

    const handleClick = () => {
        // Немає непрочитаних — одразу на сторінку всіх нотифікацій.
        if (vm.unreadCount === 0) {
            navigate('/notifications');
            return;
        }
        vm.toggle(btnRef.current?.getBoundingClientRect());
    };

    const groups = groupNotificationsByCategory(vm.items);
    const lastGroupKey = groups[groups.length - 1]?.key;

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={handleClick}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                title="Нотифікації"
                aria-label="Нотифікації"
            >
                <i className="fas fa-bell text-sm" />
                {vm.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1.5 py-1 text-[10px] leading-none text-white">
                        {vm.badgeLabel}
                    </span>
                )}
            </button>

            {vm.open && createPortal(
                // Повноекранний шар поверх layout (не child сайдбару з overflow-x-hidden).
                <div className="pointer-events-none fixed inset-0 z-[999999]">
                    <div
                        ref={panelRef}
                        style={positionStyle(vm.position)}
                        className="pointer-events-auto absolute w-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
                    >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2.5 dark:border-neutral-700">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-500">
                                Нотифікації
                            </p>
                            <div className="flex shrink-0 items-center gap-3">
                                {vm.items.length > 0 && (
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                        onClick={vm.markAllRead}
                                    >
                                        Прочитати всі
                                    </button>
                                )}
                                <Link
                                    to="/notifications"
                                    onClick={vm.close}
                                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Усі
                                </Link>
                            </div>
                        </div>

                        {vm.items.length === 0 && <EmptyNotifications />}

                        {groups.map((group) => (
                            <div key={group.key}>
                                <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50/60 px-4 py-1.5 dark:border-neutral-700 dark:bg-neutral-700/30">
                                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${group.dotClass}`} />
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-500">
                                        {group.label}
                                    </p>
                                </div>
                                {group.items.map((n, idx) => (
                                    <NotificationPanelRow
                                        key={n.id}
                                        notification={n}
                                        accentClass={`border-l-4 ${group.borderClass}`}
                                        isLast={group.key === lastGroupKey && idx === group.items.length - 1}
                                        onOpen={vm.openNotification}
                                        onMarkRead={vm.markRead}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>,
                document.getElementById('overlay-root') || document.body,
            )}
        </>
    );
}

export default observer(NotificationBell);
