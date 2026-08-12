import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { notificationBody, notificationTitle, notificationUrl } from '../lib/notificationTypes';

// Спливний список непрочитаних нотифікацій, прив'язаний до довільного
// тригера (зараз — бейдж розділу в сайдбарі, Sidebar.jsx). Той самий принцип,
// що й у дзвінику (NotificationBell.jsx): клік по рядку читає й веде на
// сутність; окрема кнопка-галочка читає БЕЗ переходу, рядок зникає зі списку,
// а сама панель лишається відкритою (закриває користувач сам або клік поза).
export default function NotificationListPopover({ open, onClose, anchorRef, filterParams, title }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [panelPos, setPanelPos] = useState({ placement: 'above', bottom: 0, top: 0, left: 0, maxHeight: 384 });
    const panelRef = useRef(null);
    const filterKey = JSON.stringify(filterParams);

    useEffect(() => {
        if (!open) return;

        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const gap = 8;
            const margin = 16;
            const minHeight = 160;
            const spaceAbove = rect.top - margin;
            const spaceBelow = window.innerHeight - rect.bottom - margin;

            // Якщо над тригером недостатньо місця (бейдж високо в сайдбарі) —
            // відкриваємо вниз, інакше панель вилазить за верх екрана.
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
        }

        setLoading(true);
        axios.get('/api/notifications', { params: { unread: 1, per_page: 20, ...filterParams } })
            .then((res) => setItems(res.data.data))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, filterKey]);

    useEffect(() => {
        if (!open) return undefined;

        // mousedown, не click: клік по "виконано" всередині панелі синхронно
        // видаляє рядок з DOM (React state update), тож поки та сама click-подія
        // добулькує до document, e.target уже відʼєднаний і panelRef.contains()
        // хибно поверне false. mousedown завжди передує click — перевірка встигає
        // спрацювати, поки вузол ще в DOM.
        const handler = (e) => {
            const insidePanel = panelRef.current && panelRef.current.contains(e.target);
            const insideAnchor = anchorRef.current && anchorRef.current.contains(e.target);
            if (!insidePanel && !insideAnchor) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onClose, anchorRef]);

    if (!open) {
        return null;
    }

    // Панель лишається відкритою після позначення одного пункту прочитаним,
    // ЯКЩО в списку залишаються інші пункти. Закривається сама лише коли
    // це був останній/єдиний пункт або натиснули "Прочитати всі".
    const markRead = (id) => {
        setItems((prev) => {
            const next = prev.filter((n) => n.id !== id);
            if (next.length === 0) {
                onClose();
            }

            return next;
        });

        return axios.patch(`/api/notifications/${id}/read`).catch(() => {});
    };

    const markAllRead = () => {
        const ids = items.map((n) => n.id);
        setItems([]);
        onClose();
        ids.forEach((id) => axios.patch(`/api/notifications/${id}/read`).catch(() => {}));
    };

    const openNotification = (n, url) => (e) => {
        e.preventDefault();
        const go = () => {
            if (url) window.location.href = url;
        };

        if (n.read_at) {
            go();
            return;
        }

        markRead(n.id).finally(go);
    };

    return createPortal(
        <div data-i-doc="component:notification-list-popover" className="pointer-events-none fixed inset-0 z-[999999]">
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
                        {title}
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
                        <button type="button" onClick={onClose} aria-label="Закрити"
                                className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300">
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center py-8">
                        <i className="fa-solid fa-spinner fa-spin text-slate-300 dark:text-slate-600" />
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                        <i className="fa-regular fa-bell-slash text-xl text-slate-300 dark:text-slate-600" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Немає непрочитаних сповіщень</p>
                    </div>
                )}

                {items.map((n, idx) => {
                    const url = notificationUrl(n);
                    const actor = n.payload?.actor;
                    const isLast = idx === items.length - 1;

                    return (
                        <div
                            key={n.id}
                            className={`group relative flex gap-2.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                isLast ? '' : 'border-b border-slate-100 dark:border-slate-800'
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
        </div>,
        document.getElementById('overlay-root') || document.body,
    );
}
