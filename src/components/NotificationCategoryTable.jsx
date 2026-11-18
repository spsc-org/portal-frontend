import { Fragment } from 'react';
import { NOTIFICATION_CHANNEL_COLUMNS } from './notificationChannels.js';
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "./Table/tableStyles.js";

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
        <div className={twMerge(TABLE_WRAP, "")}>
            <table className={twMerge(TABLE, "w-full")}>
                <thead>
                    <tr>
                        <th className={twMerge(TH, "text-left")}>
                            Категорія
                        </th>
                        {NOTIFICATION_CHANNEL_COLUMNS.map((col) => (
                            <th key={col.channel} className={twMerge(TH, "w-24 text-center")}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {categories.map((item) => (
                        <Fragment key={item.category}>
                            <tr className={TR}>
                                <td className={twMerge(TD, "font-medium")}>
                                    {item.label}
                                </td>
                                {NOTIFICATION_CHANNEL_COLUMNS.map((col) => {
                                    const ch = item.channels.find((c) => c.channel === col.channel);
                                    return (
                                        <td key={col.channel} className={twMerge(TD, "text-center")}>
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
