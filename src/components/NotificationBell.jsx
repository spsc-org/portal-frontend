import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { groupNotificationsByCategory, isGeneralNotification, notificationBody, notificationTitle, notificationUrl } from '../lib/notificationTypes';

function currentUserId() {
    const raw = document.querySelector('meta[name="userId"]')?.getAttribute('content');
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState([]);
    const [panelPos, setPanelPos] = useState({ placement: 'above', bottom: 0, top: 0, left: 0, maxHeight: 384 });
    const btnRef = useRef(null);
    const panelRef = useRef(null);
    const openRef = useRef(false);

    const loadUnreadCount = () => {
        axios.get('/api/notifications/unread-count').then((res) => setUnreadCount(res.data.data.count));
    };

    const loadUnreadItems = () => {
        // general=1 — лише нотифікації без розділу сайдбару (system.message):
        // предметні типи (task/dossier/project_ticket/inventory/announcement)
        // тепер живуть у бейджах сайдбару, не в дзвінику.
        axios.get('/api/notifications', { params: { unread: 1, general: 1, per_page: 20 } }).then((res) => {
            setItems(res.data.data);
        });
    };

    const removeItem = (id) => {
        setItems((prev) => prev.filter((n) => n.id !== id));
    };

    const fetchNotificationIfUnread = (id) => {
        axios.get(`/api/notifications/${id}`).then((res) => {
            const row = res.data.data;
            // Сокет .notification.created прилітає для БУДЬ-якого типу (щоб
            // дзвіник міг оновити свій лічильник) — але в саму панель дзвіника
            // підвантажуємо рядок, лише якщо це справді загальна нотифікація
            // (предметні типи тепер у бейджах сайдбару, не тут).
            if (row.read_at || !isGeneralNotification(row.type)) {
                return;
            }
            setItems((prev) => {
                if (prev.some((n) => n.id === row.id)) {
                    return prev.map((n) => (n.id === row.id ? row : n));
                }
                return [row, ...prev].slice(0, 20);
            });
        });
    };

    useEffect(() => {
        openRef.current = open;
    }, [open]);

    useEffect(() => {
        loadUnreadCount();
    }, []);

    useEffect(() => {
        const userId = currentUserId();
        if (!userId || !window.Echo) {
            return undefined;
        }

        const channel = window.Echo.private(`notifications.${userId}`);

        channel.listen('.notification.created', (e) => {
            if (typeof e.unread_count === 'number') {
                setUnreadCount(e.unread_count);
            } else {
                loadUnreadCount();
            }
            if (openRef.current && e.id) {
                fetchNotificationIfUnread(e.id);
            }
        });

        channel.listen('.notification.read', (e) => {
            if (typeof e.unread_count === 'number') {
                setUnreadCount(e.unread_count);
            }
            if (e.id) {
                removeItem(e.id);
            }
        });

        channel.listen('.notifications.read_all', (e) => {
            setUnreadCount(typeof e.unread_count === 'number' ? e.unread_count : 0);
            setItems([]);
        });

        return () => {
            window.Echo.leave(`notifications.${userId}`);
        };
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (
                btnRef.current && !btnRef.current.contains(e.target) &&
                panelRef.current && !panelRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const toggle = () => {
        if (unreadCount === 0) {
            window.location.href = '/notifications';
            return;
        }

        const next = !open;
        if (next && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const gap = 8;
            const margin = 16;
            const minHeight = 160;
            const spaceAbove = rect.top - margin;
            const spaceBelow = window.innerHeight - rect.bottom - margin;

            // Якщо над кнопкою недостатньо місця — відкриваємо вниз, інакше
            // панель вилазить за верх екрана (той самий фікс, що й у
            // NotificationListPopover.jsx).
            if (spaceAbove >= minHeight || spaceAbove >= spaceBelow) {
                setPanelPos({
                    placement: 'above',
                    bottom: window.innerHeight - rect.top + gap,
                    left: rect.right + gap,
                    maxHeight: Math.max(minHeight, spaceAbove),
                });
            } else {
                setPanelPos({
                    placement: 'below',
                    top: rect.bottom + gap,
                    left: rect.right + gap,
                    maxHeight: Math.max(minHeight, spaceBelow),
                });
            }
            loadUnreadItems();
        }
        setOpen(next);
    };

    const markRead = (id) => {
        removeItem(id);
        setUnreadCount((c) => Math.max(0, c - 1));

        return axios.patch(`/api/notifications/${id}/read`).catch(() => {
            loadUnreadCount();
            if (openRef.current) {
                loadUnreadItems();
            }
        });
    };

    const markAllRead = () => {
        setItems([]);
        setUnreadCount(0);
        setOpen(false);

        axios.post('/api/notifications/read-all').catch(() => {
            loadUnreadCount();
        });
    };

    const openNotification = (n, url) => (e) => {
        e.preventDefault();
        const go = () => {
            if (url) {
                window.location.href = url;
            }
        };

        if (n.read_at) {
            go();
            return;
        }

        markRead(n.id).finally(go);
    };

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Нотифікації"
                aria-label="Нотифікації"
            >
                <i className="fas fa-bell text-sm" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1.5 py-1 text-[10px] leading-none text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && createPortal(
                // Повноекранний шар поверх усього layout (не child сайдбару з
                // overflow-x-hidden): у частині браузерів звичайний fixed+z-index
                // на body все одно програвав stacking context у <main>.
                <div className="pointer-events-none fixed inset-0 z-[999999]">
                <div
                    ref={panelRef}
                    style={{
                        ...(panelPos.placement === 'below' ? { top: panelPos.top } : { bottom: panelPos.bottom }),
                        left: panelPos.left,
                        maxHeight: panelPos.maxHeight,
                    }}
                    className="pointer-events-auto absolute w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            Нотифікації
                        </p>
                        <div className="flex shrink-0 items-center gap-3">
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                    onClick={markAllRead}
                                >
                                    Прочитати всі
                                </button>
                            )}
                            <a
                                href="/notifications"
                                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                                Усі
                            </a>
                        </div>
                    </div>
                    {items.length === 0 && (
                        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                            <i className="fa-regular fa-bell-slash text-xl text-slate-300 dark:text-slate-600" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Немає непрочитаних сповіщень</p>
                        </div>
                    )}
                    {(() => {
                        const groups = groupNotificationsByCategory(items);
                        const lastGroupKey = groups[groups.length - 1]?.key;

                        return groups.map((group) => (
                            <div key={group.key}>
                                <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/60 px-4 py-1.5 dark:border-slate-800 dark:bg-slate-800/30">
                                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${group.dotClass}`} />
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                        {group.label}
                                    </p>
                                </div>
                                {group.items.map((n, idx) => {
                                    const url = notificationUrl(n);
                                    const actor = n.payload?.actor;
                                    const isLastRow = group.key === lastGroupKey && idx === group.items.length - 1;

                                    return (
                                        <div
                                            key={n.id}
                                            className={`group relative flex gap-2.5 border-l-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${group.borderClass} ${
                                                isLastRow ? '' : 'border-b border-slate-100 dark:border-slate-800'
                                            }`}
                                        >
                                            {actor?.avatar_url ? (
                                                <img
                                                    src={actor.avatar_url}
                                                    alt={actor.name}
                                                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                    <i className="fa-solid fa-bell text-[11px]" />
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1 pr-6">
                                                {url ? (
                                                    <a
                                                        href={url}
                                                        className="block text-xs font-medium text-slate-800 hover:underline dark:text-slate-200"
                                                        onClick={openNotification(n, url)}
                                                    >
                                                        {notificationTitle(n)}
                                                    </a>
                                                ) : (
                                                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                        {notificationTitle(n)}
                                                    </p>
                                                )}
                                                {notificationBody(n) && (
                                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                        {notificationBody(n)}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => markRead(n.id)}
                                                title="Позначити прочитаним"
                                                aria-label="Позначити прочитаним"
                                                className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                            >
                                                <i className="fa-regular fa-circle-check text-xs" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ));
                    })()}
                </div>
                </div>,
                document.getElementById('overlay-root') || document.body,
            )}
        </>
    );
}
