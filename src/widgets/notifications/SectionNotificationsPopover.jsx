import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { useViewModel } from '../../shared/mvvm/useViewModel.js';
import { SectionNotificationsViewModel } from './SectionNotificationsViewModel.js';
import NotificationPanelRow, { EmptyNotifications } from './NotificationPanelRow.jsx';
import { positionStyle } from './anchoredPosition.js';
import { useDismissOnOutside } from './useDismissOnOutside.js';

/**
 * Монтується лише у відкритому стані: `{open && <SectionNotificationsPopover … />}`.
 * anchorRef — тригер (бейдж), клік по ньому не вважається "кліком поза".
 */
function SectionNotificationsPopover({ section, title, anchorRef, onClose }) {
    const vm = useViewModel((deps) => new SectionNotificationsViewModel({
        ...deps,
        section,
        anchorRect: anchorRef.current?.getBoundingClientRect(),
        onClose,
    }));
    const panelRef = useRef(null);

    useDismissOnOutside(true, [panelRef, anchorRef], onClose, 'mousedown');

    return createPortal(
        <div data-i-doc="component:notification-list-popover" className="pointer-events-none fixed inset-0 z-[999999]">
            <div
                ref={panelRef}
                style={positionStyle(vm.position)}
                className="pointer-events-auto absolute w-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
            >
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2.5 dark:border-neutral-700">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-500">{title}</p>
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
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Закрити"
                            className="text-gray-600 transition hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    </div>
                </div>

                {vm.isLoading && (
                    <div className="flex justify-center py-8">
                        <i className="fa-solid fa-spinner fa-spin text-gray-300 dark:text-gray-600" />
                    </div>
                )}

                {!vm.isLoading && vm.items.length === 0 && <EmptyNotifications />}

                {vm.items.map((n, idx) => (
                    <NotificationPanelRow
                        key={n.id}
                        notification={n}
                        isLast={idx === vm.items.length - 1}
                        onOpen={vm.openNotification}
                        onMarkRead={vm.markRead}
                    />
                ))}
            </div>
        </div>,
        document.getElementById('overlay-root') || document.body,
    );
}

export default observer(SectionNotificationsPopover);
