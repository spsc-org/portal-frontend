import {useMemo} from "react";
import { Chip, Spinner, Tooltip } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import {canManageBirthdayEntry} from "../shared/lib/permissions.js";

const MONTH_NAMES = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];

// Дензе-подання списку (Task-style): груповано за місяцем народження, рядок
// однією лінією (іконка / дата / ім'я / примітка / бейдж власності), дії
// при ховері. Значно простіше за TaskList (без drag&drop, тегів, статусів).
const BirthdayList = ({entries = [], loading = false, selectedId, onSelect, onDelete, auth}) => {
    const groups = useMemo(() => {
        const byMonth = new Map();
        entries.forEach((entry) => {
            const month = entry.date_of_birth ? new Date(entry.date_of_birth).getMonth() : 0;
            if (!byMonth.has(month)) byMonth.set(month, []);
            byMonth.get(month).push(entry);
        });
        return [...byMonth.keys()].sort((a, b) => a - b).map((month) => ({month, entries: byMonth.get(month)}));
    }, [entries]);

    if (loading && !entries.length) {
        return (
            <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-neutral-700 dark:bg-neutral-800">
                <Spinner className="h-8 w-8"/>
            </div>
        );
    }

    if (!entries.length) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white py-16 text-gray-600 dark:border-neutral-700 dark:bg-neutral-800">
                <i className="fa-regular fa-cake-candles text-2xl"></i>
                <span className="text-sm">Записів не знайдено</span>
            </div>
        );
    }

    return (
        <div data-i-doc="view:handbook-birthday-list" className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
            {groups.map((group) => (
                <div key={group.month}>
                    <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-700/60">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{MONTH_NAMES[group.month]}</span>
                        <span className="text-[11px] text-gray-600">{group.entries.length}</span>
                    </div>
                    {group.entries.map((entry) => {
                        const isSelected = entry.id === selectedId;
                        const canManage = canManageBirthdayEntry(auth, entry);
                        return (
                            <div key={entry.id}
                                 onClick={() => onSelect(entry.id)}
                                 className={`group flex cursor-pointer items-center gap-2.5 border-b border-gray-100 px-3 py-2 transition dark:border-neutral-700 ${isSelected
                                     ? "bg-blue-50 dark:bg-blue-900/25"
                                     : "hover:bg-gray-50 dark:hover:bg-neutral-700/50"}`}>
                                <i className="fa-solid fa-cake-candles w-4 shrink-0 text-center text-xs text-amber-500"></i>
                                <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-600 dark:text-gray-400">
                                    {entry.date_of_birth ? format(new Date(entry.date_of_birth), "d MMMM", {locale: uk}) : "—"}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-200">
                                    {entry.name}
                                </span>
                                {entry.note &&
                                    <span className="hidden max-w-[16rem] shrink truncate text-[11px] text-gray-600 dark:text-gray-500 sm:inline">
                                        {entry.note}
                                    </span>
                                }
                                <Tooltip content={entry.is_default ? "Спільний список" : `Особистий (${entry.owner?.name || "—"})`}>
                                    <Chip size="sm" variant="ghost" color={entry.is_default ? "blue" : "gray"}
                                          className={`shrink-0 py-0.5 text-[9px] ${entry.is_default ? "dark:!bg-blue-500/30 dark:!text-blue-300" : "dark:!bg-neutral-400/20 dark:!text-gray-300"}`}
                                          value={entry.is_default ? "Спільний" : "Особистий"}/>
                                </Tooltip>
                                {!entry.is_default && entry.shared_groups?.length > 0 &&
                                    <Tooltip content={`Розшарено з групами: ${entry.shared_groups.map((g) => g.name).join(", ")}`}>
                                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-gray-600 dark:text-gray-500">
                                            <i className="fa-regular fa-share-nodes"></i>{entry.shared_groups.length}
                                        </span>
                                    </Tooltip>
                                }
                                <span className="flex shrink-0 justify-end opacity-0 transition group-hover:opacity-100">
                                    {canManage &&
                                        <Tooltip content="Видалити">
                                            <Button size="sm" variant="text" color="red" className="px-2 py-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(entry.id);
                                                    }}>
                                                <i className="fa-regular fa-trash-can"></i>
                                            </Button>
                                        </Tooltip>
                                    }
                                </span>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default BirthdayList;
