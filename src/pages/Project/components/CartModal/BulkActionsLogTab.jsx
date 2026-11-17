import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/index.js";

// tab-3 — "Лог операцій". `data` (JSON) містить `projectIdList` — показуємо
// як список id через кому (так само, як processData() у cartManager.js);
// `log` — багаторядковий текст, рядки довші за 100 символів легасі обрізає
// до 150 (== залишає майже без змін, але формат зберігаємо як є для парності).
const processLogText = (text) => {
    if (!text || typeof text !== "string") return "";
    return text.split(/\r?\n/).map((line) => (line.length > 100 ? line.slice(0, 150) : line));
};

const processLogData = (text) => {
    if (!text || typeof text !== "string") return "";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed?.projectIdList) ? parsed.projectIdList.join(", ") : "";
    } catch {
        return text;
    }
};

// BulkTaskService::getResultState() повертає не лише "complete"/помилку —
// є ще "complete (skipped)" (усе пропущено, напр. "вже актуально": не
// помилка, просто нічого не змінилось). Легасі-кошик фарбував усе, що не
// точний рядок "complete", червоним — тобто "complete (skipped)" виглядав
// як помилка. Тут розрізняємо всі 3 реальні стани.
const STATE_CLASS = {
    complete: "bg-green-300 dark:bg-green-800 dark:text-green-100",
    "complete (skipped)": "bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100",
};
const stateClass = (state) => STATE_CLASS[state] ?? "bg-red-300 dark:bg-red-800 dark:text-red-100";

const BulkActionsLogTab = () => {
    const { log, isLogLoading: isLoading } = useVM().cartModal;
    const rows = useMemo(() => log, [log]);

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-neutral-600 dark:bg-neutral-750">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    <i className="fas fa-history mr-1.5" />Журнал масових операцій
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-400">
                            <th className="whitespace-nowrap px-3 py-2">ID</th>
                            <th className="whitespace-nowrap px-3 py-2">Операція</th>
                            <th className="whitespace-nowrap px-3 py-2">Причина</th>
                            <th className="whitespace-nowrap px-3 py-2">Проєкти</th>
                            <th className="min-w-[260px] px-3 py-2">Лог</th>
                            <th className="whitespace-nowrap px-3 py-2">Стан</th>
                            <th className="whitespace-nowrap px-3 py-2">Дата</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                        {isLoading && (
                            <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400 dark:text-gray-500">Завантаження…</td></tr>
                        )}
                        {!isLoading && rows.length === 0 && (
                            <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400 dark:text-gray-500">Журнал порожній</td></tr>
                        )}
                        {rows.map((item) => {
                            const logLines = processLogText(item.log);
                            return (
                            <tr key={item.id} className="align-top text-gray-700 dark:text-gray-200">
                                <td className="whitespace-nowrap px-3 py-2">{item.id}</td>
                                <td className="whitespace-nowrap px-3 py-2">{item.bulkName || ""}</td>
                                <td className="px-3 py-2">{item.reason || ""}</td>
                                <td className="px-3 py-2">{processLogData(item.data)}</td>
                                <td className="px-3 py-2">
                                    {logLines.map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < logLines.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2">
                                    <span className={`rounded px-1.5 ${stateClass(item.state)}`}>{item.state}</span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2">{item.createdAt || ""}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default observer(BulkActionsLogTab);
