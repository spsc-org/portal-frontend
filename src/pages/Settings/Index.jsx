import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import TaskLayout from '../../Components/TaskLayout';
import MetaRow from '../../Components/MetaRow';
import NotificationCategoryTable, { NOTIFICATION_CHANNEL_COLUMNS } from '../../Components/NotificationCategoryTable.jsx';
import { useMe, patchUiSettings } from '../../hooks/useMe';

/** Конвенція ключа KV; публічний контракт — settings.ui.theme з GET /api/me. */
const THEME_KEY = 'ui.theme';
/** Конвенція ключа KV; публічний контракт — settings.ui.showIDocLabels з GET /api/me. */
const SHOW_IDOC_LABELS_KEY = 'ui.showIDocLabels';

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    document.cookie = `theme=${encodeURIComponent(theme)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=Strict`;
}

function SectionCard({ title, hint = null, children }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {title}
                </p>
                {hint ? (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
                ) : null}
            </div>
            <div className="px-4 py-3">
                {children}
            </div>
        </div>
    );
}

function SegmentedControl({ value, options, disabled, onChange }) {
    return (
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(option.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                        value === option.value
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function saveErrorMessage(error, fallback) {
    return error?.response?.data?.message ?? fallback;
}

export default function SettingsIndex() {
    // Тема — зі спільного кешу /api/me (той самий, що й острівець у сайдбарі,
    // hooks/useMe.js): своєї окремої мережі тут більше нема, лише підписка.
    const me = useMe();
    const [saving, setSaving] = useState(false);
    const [theme, setTheme] = useState('light');
    const [showIDocLabels, setShowIDocLabels] = useState(false);
    const [themeReady, setThemeReady] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [projectTicketSubscribed, setProjectTicketSubscribed] = useState(false);

    useEffect(() => {
        if (me.loading) {
            return;
        }
        if (me.data) {
            const nextTheme = me.data.settings?.ui?.theme === 'dark' ? 'dark' : 'light';
            setTheme(nextTheme);
            applyTheme(nextTheme);
            setShowIDocLabels(Boolean(me.data.settings?.ui?.showIDocLabels));
        }
        if (me.error) {
            toast.error(saveErrorMessage(me.error, 'Не вдалося завантажити налаштування'));
        }
        setThemeReady(true);
    }, [me.loading, me.data, me.error]);

    const loadCategories = () => {
        setCategoriesLoading(true);
        axios.get('/api/notifications/preferences')
            .then((res) => {
                setCategories(res.data?.data?.categories ?? []);
                setProjectTicketSubscribed(Boolean(res.data?.data?.subscriptions?.project_ticket));
            })
            .catch((error) => {
                toast.error(saveErrorMessage(error, 'Не вдалося завантажити налаштування повідомлень'));
            })
            .finally(() => {
                setCategoriesLoading(false);
            });
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const loading = !themeReady || categoriesLoading;

    const onThemeChange = (next) => {
        if (next === theme || saving) {
            return;
        }

        const previous = theme;
        setTheme(next);
        applyTheme(next);
        patchUiSettings({ theme: next });
        setSaving(true);

        axios.patch('/api/user-settings', { settings: { [THEME_KEY]: next } })
            .then(() => {
                toast.success('Налаштування збережено');
            })
            .catch((error) => {
                setTheme(previous);
                applyTheme(previous);
                patchUiSettings({ theme: previous });
                toast.error(saveErrorMessage(error, 'Не вдалося зберегти тему'));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const onShowIDocLabelsChange = (next) => {
        if (next === showIDocLabels || saving) {
            return;
        }

        const previous = showIDocLabels;
        setShowIDocLabels(next);
        patchUiSettings({ showIDocLabels: next });
        setSaving(true);

        axios.patch('/api/user-settings', { settings: { [SHOW_IDOC_LABELS_KEY]: next } })
            .then(() => {
                toast.success('Налаштування збережено');
            })
            .catch((error) => {
                setShowIDocLabels(previous);
                patchUiSettings({ showIDocLabels: previous });
                toast.error(saveErrorMessage(error, 'Не вдалося зберегти налаштування'));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const onChannelToggle = (category, channel, enabled) => {
        if (saving) {
            return;
        }

        const previous = categories;
        setCategories((prev) => prev.map((item) => (
            item.category === category
                ? { ...item, channels: item.channels.map((ch) => (ch.channel === channel ? { ...ch, enabled } : ch)) }
                : item
        )));
        setSaving(true);

        axios.patch('/api/notifications/preferences', {
            categories: { [category]: { [channel]: enabled } },
        })
            .then((res) => {
                const nextCategories = res.data?.data?.categories;
                // Форма відповіді неочікувана — лишаємо вже застосований
                // оптимістичний стан замість падіння на undefined.
                if (Array.isArray(nextCategories)) {
                    setCategories(nextCategories);
                }
                toast.success('Налаштування збережено');
            })
            .catch((error) => {
                setCategories(previous);
                toast.error(saveErrorMessage(error, 'Не вдалося зберегти налаштування повідомлень'));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const onProjectTicketSubscriptionToggle = (subscribed) => {
        if (saving) {
            return;
        }

        const previous = projectTicketSubscribed;
        setProjectTicketSubscribed(subscribed);
        setSaving(true);

        axios.patch('/api/notifications/preferences', {
            subscriptions: { project_ticket: subscribed },
        })
            .then((res) => {
                const value = res.data?.data?.subscriptions?.project_ticket;
                if (typeof value === 'boolean') {
                    setProjectTicketSubscribed(value);
                }
                toast.success('Налаштування збережено');
            })
            .catch((error) => {
                setProjectTicketSubscribed(previous);
                toast.error(saveErrorMessage(error, 'Не вдалося зберегти підписку на тікети'));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    if (loading) {
        return (
            <TaskLayout title="Налаштування">
                <p className="text-xs text-slate-500 dark:text-slate-400">Завантаження…</p>
            </TaskLayout>
        );
    }

    return (
        <TaskLayout data-i-doc="page:settings" title="Налаштування">
            <div className="max-w-2xl space-y-3">
                <SectionCard title="Вигляд">
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/60 px-3 dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-800/40">
                        <MetaRow icon="fa-regular fa-moon" label="Тема">
                            <SegmentedControl
                                value={theme}
                                disabled={saving}
                                onChange={onThemeChange}
                                options={[
                                    { value: 'light', label: 'Світла' },
                                    { value: 'dark', label: 'Темна' },
                                ]}
                            />
                        </MetaRow>
                    </div>
                </SectionCard>

                <SectionCard
                    title="Нотифікації"
                    hint="Для кожної категорії оберіть, якими каналами отримувати сповіщення."
                >
                    <NotificationCategoryTable
                        categories={categories}
                        onToggle={onChannelToggle}
                        disabled={saving}
                        renderCategoryExtra={(item) => (
                            item.category === 'project_ticket' ? (
                                <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                                    <td colSpan={1 + NOTIFICATION_CHANNEL_COLUMNS.length} className="px-3 py-2 pl-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-slate-600 dark:text-slate-300">
                                                Підписка на нові тікети
                                                <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
                                                    Якщо увімкнено, ви отримуватимете сповіщення про КОЖЕН
                                                    новий тікет будь-якого проєкту в системі.
                                                </span>
                                            </span>
                                            <SegmentedControl
                                                value={projectTicketSubscribed ? 'on' : 'off'}
                                                disabled={saving}
                                                onChange={(next) => onProjectTicketSubscriptionToggle(next === 'on')}
                                                options={[
                                                    { value: 'on', label: 'Увімк.' },
                                                    { value: 'off', label: 'Вимк.' },
                                                ]}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ) : null
                        )}
                    />
                </SectionCard>

                <SectionCard
                    title="Мітки i-doc"
                    hint="Кольорові підписи над елементами інтерфейсу — назва сторінки/модалки/вкладки тощо, для навігації в документації."
                >
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 dark:border-slate-700 dark:bg-slate-800/40">
                        <MetaRow icon="fa-regular fa-tag" label="Показувати мітки">
                            <SegmentedControl
                                value={showIDocLabels ? 'on' : 'off'}
                                disabled={saving}
                                onChange={(next) => onShowIDocLabelsChange(next === 'on')}
                                options={[
                                    { value: 'on', label: 'Увімк.' },
                                    { value: 'off', label: 'Вимк.' },
                                ]}
                            />
                        </MetaRow>
                    </div>
                </SectionCard>
            </div>
        </TaskLayout>
    );
}
