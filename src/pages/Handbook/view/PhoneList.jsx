import React, {useMemo} from "react";
import {Button, Spinner, Tooltip} from "@material-tailwind/react";
import UserAvatars from "../../../components/UserAvatars.jsx";
import PhoneNumberBadge from "./PhoneNumberBadge.jsx";
import {canUpdatePhoneEntry} from "../shared/lib/permissions.js";

const NO_DEPARTMENT = "Без підрозділу";

// Дензе-подання списку (Task-style): груповано за підрозділом, рядок —
// CSS grid з фіксованими пропорціями колонок (телефони/ім'я/примітка до
// особи = 30/30/40%, grid-cols-[...3fr_3fr_4fr...]) — щоб усі сутності
// вирівнювались по вертикалі між рядками, а не "стрибали" залежно від
// довжини контенту конкретного запису. Власник — UserAvatars (аватар/
// ініціали, той самий спільний компонент, що й Task-список), не текстовий
// Chip. Коментарі/редагування — фіксовані вузькі колонки (кнопка видалення —
// лише в PhoneDetailPanel, не в списку; окрема "загальна" іконка-телефон
// перед колонкою номерів прибрана — зайва, бо кожен номер уже має власну
// іконку типу).
// Телефон(и) — PhoneNumberBadge (іконка типу: внутрішній/мобільний/інший,
// detectPhoneType.js), примітки до номерів НЕ виводяться в тексті — лише у
// власному тултипі КОЖНОГО номера (не всієї комірки одразу); зелена галочка
// біля номера — хоч раз підтверджений (PhoneEntryNumberConfirmation), деталі
// в тому ж тултипі. Перегляди картки (views_count) — завжди цифрою поруч із
// коментарями.
const PhoneList = ({entries = [], loading = false, selectedId, onSelect, onEdit, onToggleFavorite, auth, showStatusBadge = false}) => {
    const groups = useMemo(() => {
        const byDept = new Map();
        entries.forEach((entry) => {
            const dept = entry.department || NO_DEPARTMENT;
            if (!byDept.has(dept)) byDept.set(dept, []);
            byDept.get(dept).push(entry);
        });
        return [...byDept.keys()].sort((a, b) => a.localeCompare(b, "uk")).map((dept) => ({dept, entries: byDept.get(dept)}));
    }, [entries]);

    if (loading && !entries.length) {
        return (
            <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-gray-900">
                <Spinner className="h-8 w-8"/>
            </div>
        );
    }

    if (!entries.length) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-400 dark:border-slate-800 dark:bg-gray-900">
                <i className="fa-regular fa-phone text-2xl"></i>
                <span className="text-sm">Записів не знайдено</span>
            </div>
        );
    }

    return (
        <div data-i-doc="view:handbook-phone-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-gray-900">
            {groups.map((group) => (
                <div key={group.dept}>
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{group.dept}</span>
                        <span className="text-[11px] text-slate-400">{group.entries.length}</span>
                    </div>
                    {group.entries.map((entry) => {
                        const isSelected = entry.id === selectedId;
                        const canEdit = canUpdatePhoneEntry(auth, entry);
                        return (
                            <div key={entry.id}
                                 onClick={() => onSelect(entry.id)}
                                 className={`group grid cursor-pointer grid-cols-[1.25rem_3fr_3fr_4fr_7rem_2.5rem_2rem] items-center gap-2.5 border-b border-slate-100 px-3 py-2 transition dark:border-slate-800 ${isSelected
                                     ? "bg-blue-50 dark:bg-blue-900/25"
                                     : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                                {Boolean(onToggleFavorite) &&
                                    <button type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite(entry.id);
                                            }}
                                            title={entry.is_favorite ? "Прибрати з обраного" : "Додати в обране"}
                                            className={`transition ${entry.is_favorite
                                                ? "text-amber-400"
                                                : "text-slate-300 opacity-0 hover:text-amber-400 group-hover:opacity-100 dark:text-slate-600"}`}>
                                        <i className={`${entry.is_favorite ? "fa-solid" : "fa-regular"} fa-star text-xs`}></i>
                                    </button>
                                }
                                <span className="min-w-0 truncate whitespace-nowrap text-[11px]">
                                    {entry.phones?.length
                                        ? entry.phones.map((p, i) => (
                                            <React.Fragment key={p.id ?? i}>
                                                {i > 0 && <span className="text-slate-300 dark:text-slate-600">, </span>}
                                                <PhoneNumberBadge phone={p.phone} note={p.note}
                                                                  confirmationsCount={p.confirmations_count}
                                                                  latestConfirmation={p.latest_confirmation}/>
                                            </React.Fragment>
                                        ))
                                        : "—"}
                                </span>
                                <span className="min-w-0 truncate text-sm text-slate-800 dark:text-slate-200">
                                    {entry.name}
                                </span>
                                <span className="min-w-0 truncate text-[11px] text-slate-400 dark:text-slate-500">
                                    {entry.note || ""}
                                </span>
                                <span className="flex items-center gap-1 justify-self-start">
                                    {entry.owner &&
                                        <UserAvatars users={[entry.owner]} max={1}/>
                                    }
                                    {showStatusBadge && entry.status === "archived" &&
                                        <Tooltip content="Архівна">
                                            <i className="fa-solid fa-box-archive text-[10px] text-slate-400 dark:text-slate-500"></i>
                                        </Tooltip>
                                    }
                                </span>
                                <span className="inline-flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                                    <Tooltip content={`Переглядів: ${entry.views_count ?? 0}`}>
                                        <span className="inline-flex items-center gap-1">
                                            <i className="fa-regular fa-eye"></i>{entry.views_count ?? 0}
                                        </span>
                                    </Tooltip>
                                    {entry.comments_count > 0 &&
                                        <Tooltip content={`Коментарів: ${entry.comments_count}`}>
                                            <span className="inline-flex items-center gap-1">
                                                <i className="fa-regular fa-message"></i>{entry.comments_count}
                                            </span>
                                        </Tooltip>
                                    }
                                </span>
                                <span className="flex justify-end opacity-0 transition group-hover:opacity-100">
                                    {canEdit &&
                                        <Tooltip content="Редагувати">
                                            <Button size="sm" variant="text" color="blue-gray" className="px-2 py-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(entry);
                                                    }}>
                                                <i className="fa-regular fa-pen"></i>
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

export default PhoneList;
