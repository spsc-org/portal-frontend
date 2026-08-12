import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    notificationBody,
    notificationCategory,
    notificationTitle,
    notificationUrl,
} from '../../lib/notificationTypes';

function currentUserId() {
    const raw = document.querySelector('meta[name="userId"]')?.getAttribute('content');
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
}

const STATUS_OPTIONS = [
    { value: 'unread', label: 'Непрочитані' },
    { value: 'read', label: 'Прочитані' },
    { value: 'all', label: 'Усі' },
];

function SegmentedControl({ value, options, onChange }) {
    return (
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 dark:border-slate-600 dark:bg-slate-800/80">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                        value === option.value
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function TypeChip({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                active
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
        >
            {children}
        </button>
    );
}

export default function NotificationsIndex() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeOptions, setTypeOptions] = useState([]);
    const [statusFilter, setStatusFilter] = useState('unread'); // all | unread | read
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        axios.get('/api/notifications/options').then((res) => setTypeOptions(res.data.data.types));
    }, []);

    const load = () => {
        setLoading(true);
        const params = {};
        if (statusFilter !== 'all') params.unread = statusFilter === 'unread' ? 1 : 0;
        if (typeFilter) params.type = typeFilter;

        axios.get('/api/notifications', { params }).then((res) => {
            setNotifications(res.data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [statusFilter, typeFilter]);

    useEffect(() => {
        const userId = currentUserId();
        if (!userId || !window.Echo) {
            return undefined;
        }

        const channel = window.Echo.private(`notifications.${userId}`);
        const reload = () => load();

        channel.listen('.notification.created', reload);
        channel.listen('.notification.read', reload);
        channel.listen('.notifications.read_all', reload);

        return () => {
            window.Echo.leave(`notifications.${userId}`);
        };
    }, [statusFilter, typeFilter]);

    const markRead = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        return axios.patch(`/api/notifications/${id}/read`).catch(load);
    };

    const markAllRead = () => {
        if (statusFilter === 'unread' || statusFilter === 'all') {
            setNotifications((prev) => (
                statusFilter === 'unread' ? [] : prev.map((n) => ({
                    ...n,
                    read_at: n.read_at ?? new Date().toISOString(),
                }))
            ));
        }

        axios.post('/api/notifications/read-all').then(load).catch(load);
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

    const typeLabel = (value) => typeOptions.find((o) => o.value === value)?.label ?? value;

    return (
        <div data-i-doc="page:notifications" className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Нотифікації
                </h1>
                <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    onClick={markAllRead}
                >
                    Прочитати всі
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="space-y-2.5 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <SegmentedControl
                        value={statusFilter}
                        options={STATUS_OPTIONS}
                        onChange={setStatusFilter}
                    />

                    {typeOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            <TypeChip active={typeFilter === ''} onClick={() => setTypeFilter('')}>
                                Усі типи
                            </TypeChip>
                            {typeOptions.map((option) => (
                                <TypeChip
                                    key={option.value}
                                    active={typeFilter === option.value}
                                    onClick={() => setTypeFilter(option.value)}
                                >
                                    {option.label}
                                </TypeChip>
                            ))}
                        </div>
                    )}
                </div>

                {loading && (
                    <p className="px-4 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                        Завантаження…
                    </p>
                )}

                {!loading && notifications.length === 0 && (
                    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                        <i className="fa-regular fa-bell-slash text-2xl text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-600 dark:text-slate-300">Немає нотифікацій</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Спробуйте змінити фільтри вище
                        </p>
                    </div>
                )}

                {!loading && notifications.map((n, idx) => {
                    const url = notificationUrl(n);
                    const actor = n.payload?.actor;
                    const category = notificationCategory(n);
                    const isLast = idx === notifications.length - 1;
                    const isRead = Boolean(n.read_at);

                    return (
                        <div
                            key={n.id}
                            className={`flex gap-3 border-l-4 px-4 py-3.5 ${category.borderClass} ${
                                isLast ? '' : 'border-b border-slate-100 dark:border-slate-800'
                            } ${
                                isRead
                                    ? ''
                                    : 'bg-blue-50/50 dark:bg-slate-800'
                            } hover:bg-slate-50 dark:hover:bg-slate-800`}
                        >
                            {actor?.avatar_url ? (
                                <img
                                    src={actor.avatar_url}
                                    alt={actor.name || ''}
                                    className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                />
                            ) : (
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
                                    <span className={`h-2 w-2 rounded-full ${category.dotClass}`} />
                                </span>
                            )}

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                            {typeLabel(n.type)}
                                        </p>

                                        {url ? (
                                            <a
                                                href={url}
                                                className={`mt-0.5 block text-sm font-medium hover:underline ${
                                                    isRead
                                                        ? 'text-slate-600 dark:text-slate-400'
                                                        : 'text-slate-900 dark:text-slate-100'
                                                }`}
                                                onClick={openNotification(n, url)}
                                            >
                                                {notificationTitle(n)}
                                            </a>
                                        ) : (
                                            <p
                                                className={`mt-0.5 text-sm font-medium ${
                                                    isRead
                                                        ? 'text-slate-600 dark:text-slate-400'
                                                        : 'text-slate-900 dark:text-slate-100'
                                                }`}
                                            >
                                                {notificationTitle(n)}
                                            </p>
                                        )}
                                    </div>

                                    {!isRead && (
                                        <button
                                            type="button"
                                            className="shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                            onClick={() => markRead(n.id)}
                                        >
                                            Прочитано
                                        </button>
                                    )}
                                </div>

                                {notificationBody(n) && (
                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                        {notificationBody(n)}
                                    </p>
                                )}

                                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                    {actor?.name ? `${actor.name} · ` : ''}{n.created_at}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
