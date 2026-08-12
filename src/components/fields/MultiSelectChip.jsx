import React, {useMemo, useState} from "react";
import {Menu, MenuHandler, MenuList} from "@material-tailwind/react";

const optionCaption = (option) => option?.caption || option?.name || option?.label || "";

/**
 * Компактний чип-фільтр з мультивибором (заміна одиничного select у
 * панелях фільтрації): клік по опції не закриває меню (dismiss.itemPress
 * вимкнено) — можна відмітити кілька значень поспіль, лічильник вибраних
 * показується прямо в чипі. Для довгих списків — локальний пошук у меню.
 */
const MultiSelectChip = ({label, icon, options = [], value = [], onChange}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search) return options;
        const needle = search.toLowerCase();
        return options.filter(option => optionCaption(option).toLowerCase().includes(needle));
    }, [options, search]);

    const selectedIds = value.map(option => option.id);
    const active = value.length > 0;

    const toggleOption = (option) => {
        onChange(selectedIds.includes(option.id)
            ? value.filter(item => item.id !== option.id)
            : [...value, option]);
    };

    return (
        <Menu placement="bottom-start" open={open} handler={setOpen} dismiss={{itemPress: false}}>
            <MenuHandler>
                <button type="button"
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${active
                            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"}`}>
                    <i className={`${icon} text-[10px]`}></i>
                    {active
                        ? <span>{label}: <span className="font-semibold">{value.length}</span></span>
                        : label}
                    {active ? (
                        <span role="button" title="Скинути фільтр"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onChange([]);
                              }}
                              className="ml-0.5 opacity-60 transition hover:opacity-100">
                            <i className="fa-solid fa-xmark"></i>
                        </span>
                    ) : (
                        <i className="fa-solid fa-chevron-down text-[8px] opacity-50"></i>
                    )}
                </button>
            </MenuHandler>
            <MenuList className="max-h-72 min-w-[13rem] overflow-y-auto border border-slate-200 bg-white p-1 text-slate-700 dark:border-slate-600 dark:!bg-slate-800 dark:!text-slate-200">
                {options.length > 8 &&
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Пошук…"
                        className="mb-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-300 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    />
                }
                {filtered.map(option => {
                    const isChecked = selectedIds.includes(option.id);
                    return (
                        <div key={option.id}
                             role="button"
                             onClick={() => toggleOption(option)}
                             className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition dark:text-slate-300 ${isChecked
                                 ? "bg-blue-50 dark:bg-blue-900/30"
                                 : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                            <i className={`${isChecked
                                ? "fa-solid fa-square-check text-blue-500 dark:text-blue-400"
                                : "fa-regular fa-square text-slate-300 dark:text-slate-600"} text-[13px]`}></i>
                            <span className="flex-1">{optionCaption(option)}</span>
                        </div>
                    );
                })}
                {!filtered.length &&
                    <div className="px-2 py-1 text-xs text-slate-400 dark:text-slate-500">Не знайдено</div>
                }
            </MenuList>
        </Menu>
    );
};

export default MultiSelectChip;
