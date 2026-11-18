import { Fragment } from 'react';
import { NOTIFICATION_CHANNEL_COLUMNS } from './notificationChannels.js';

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
        return <p className="text-xs text-gray-600 dark:text-gray-400">Немає доступних категорій.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-neutral-700">
            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-700/60">
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                            Категорія
                        </th>
                        {NOTIFICATION_CHANNEL_COLUMNS.map((col) => (
                            <th key={col.channel} className="w-24 px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                    {categories.map((item) => (
                        <Fragment key={item.category}>
                            <tr className="bg-white dark:bg-neutral-800">
                                <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
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
                                                    className="h-3.5 w-3.5 cursor-pointer accent-blue-500 disabled:cursor-not-allowed dark:border-gray-600"
                                                />
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">—</span>
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
