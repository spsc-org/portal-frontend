import { Fragment } from 'react';

// Фіксований порядок і повний набір колонок таблиці — незалежно від того, чи
// підтримує канал конкретна категорія (тоді клітинка — просто "—"), щоб рядки
// з різною кількістю каналів (Task/Announcement мають Mattermost, решта — ні)
// не "гуляли" по вертикалі.
export const NOTIFICATION_CHANNEL_COLUMNS = [
    { channel: 'in_app', label: 'В додатку' },
    { channel: 'mail', label: 'Пошта' },
    { channel: 'mattermost', label: 'Mattermost' },
];

/**
 * Спільна таблиця "категорія × канал" — використовується і на `/settings`
 * (персональні переваги, інтерактивна), і на `/admin-notifications`
 * (глобальна матриця, лише на читання: `readOnly`, без `onToggle`) — той
 * самий вигляд, різний режим.
 *
 * `categories`: list<{category, label, channels: list<{channel, label, enabled}>}>
 * (той самий контракт, що повертають і `/api/notifications/preferences`,
 * і `/api/admin-notifications/categories`).
 */
const NotificationCategoryTable = ({ categories, onToggle, disabled = false, readOnly = false, renderCategoryExtra }) => {
    if (categories.length === 0) {
        return <p className="text-xs text-slate-500 dark:text-slate-400">Немає доступних категорій.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                        <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">
                            Категорія
                        </th>
                        {NOTIFICATION_CHANNEL_COLUMNS.map((col) => (
                            <th key={col.channel} className="w-24 px-3 py-2 text-center font-medium text-slate-500 dark:text-slate-400">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {categories.map((item) => (
                        <Fragment key={item.category}>
                            <tr className="bg-white dark:bg-slate-900">
                                <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                                    {item.label}
                                </td>
                                {NOTIFICATION_CHANNEL_COLUMNS.map((col) => {
                                    const ch = item.channels.find((c) => c.channel === col.channel);
                                    return (
                                        <td key={col.channel} className="px-3 py-2 text-center">
                                            {ch ? (
                                                <input
                                                    type="checkbox"
                                                    checked={ch.enabled}
                                                    disabled={readOnly || disabled}
                                                    title={`${col.label}: ${ch.enabled ? 'увімкнено' : 'вимкнено'}`}
                                                    onChange={readOnly ? undefined : () => onToggle(item.category, col.channel, !ch.enabled)}
                                                    className="h-3.5 w-3.5 cursor-pointer accent-blue-500 disabled:cursor-not-allowed dark:border-slate-600"
                                                />
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">—</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                            {renderCategoryExtra?.(item) ?? null}
                        </Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default NotificationCategoryTable;
