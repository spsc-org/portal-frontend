import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/index.js";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "../../../../components/Table/tableStyles.js";

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

            <div className={twMerge(TABLE_WRAP, "")}>
                <table className={twMerge(TABLE, "w-full")}>
                    <thead>
                        <tr className="text-left">
                            <th className={twMerge(TH, "whitespace-nowrap")}>ID</th>
                            <th className={twMerge(TH, "whitespace-nowrap")}>Операція</th>
                            <th className={twMerge(TH, "whitespace-nowrap")}>Причина</th>
                            <th className={twMerge(TH, "whitespace-nowrap")}>Проєкти</th>
                            <th className={twMerge(TH, "min-w-[260px]")}>Лог</th>
                            <th className={twMerge(TH, "whitespace-nowrap")}>Стан</th>
                            <th className={twMerge(TH, "whitespace-nowrap")}>Дата</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr className={TR}><td colSpan={7} className={twMerge(TD, "text-center")}>Завантаження…</td></tr>
                        )}
                        {!isLoading && rows.length === 0 && (
                            <tr className={TR}><td colSpan={7} className={twMerge(TD, "text-center")}>Журнал порожній</td></tr>
                        )}
                        {rows.map((item) => {
                            const logLines = processLogText(item.log);
                            return (
                            <tr key={item.id} className={twMerge(TR, "align-top")}>
                                <td className={twMerge(TD, "whitespace-nowrap")}>{item.id}</td>
                                <td className={twMerge(TD, "whitespace-nowrap")}>{item.bulkName || ""}</td>
                                <td className={TD}>{item.reason || ""}</td>
                                <td className={TD}>{processLogData(item.data)}</td>
                                <td className={TD}>
                                    {logLines.map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < logLines.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </td>
                                <td className={twMerge(TD, "whitespace-nowrap")}>
                                    <span className={`rounded px-1.5 ${stateClass(item.state)}`}>{item.state}</span>
                                </td>
                                <td className={twMerge(TD, "whitespace-nowrap")}>{item.createdAt || ""}</td>
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
