import { observer } from "mobx-react-lite";
import { Popover, PopoverContent, PopoverHandler } from "@material-tailwind/react";
import Button from "../../../../../components/Buttons/Button.jsx";
import IconButton from "../../../../../components/Buttons/IconButton.jsx";

// Меню «Збережені:» (макет «Проєкти v2 — фільтри зверху»): тригер з назвою вибраного набору
// і бейджем «змінено», пошук, список наборів (вибраний — ✓, за замовчуванням — ★, видалення),
// футер «Зберегти поточні» / «Керувати наборами». saved — SavedFiltersViewModel.
const SavedFiltersMenu = ({ saved }) => {
    const active = saved.active;
    const items = saved.items;
    return (
        <div className="flex items-center gap-1.5">
            <span id="saved-filters-label" className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                Збережені:
            </span>
            <Popover open={saved.menuOpen} handler={saved.setMenuOpen} placement="bottom-end" offset={6}>
                <PopoverHandler>
                    <button
                        type="button"
                        aria-haspopup="true"
                        aria-expanded={saved.menuOpen}
                        aria-describedby="saved-filters-label"
                        data-testid="saved-filters-trigger"
                        className={`flex min-h-[26px] w-[230px] items-center justify-between gap-1.5 rounded-md border bg-white px-2 py-0.5 text-left text-[13px] text-gray-800 transition-colors dark:bg-neutral-900 dark:text-gray-200 ${
                            saved.menuOpen
                                ? "border-blue-600 ring-[3px] ring-blue-600/15 dark:border-blue-400"
                                : "border-gray-200 hover:border-gray-400 dark:border-neutral-600"
                        }`}
                    >
                        <span className="flex min-w-0 items-center gap-1.5">
                            <i className={`fa-regular fa-bookmark text-xs ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-500"}`} aria-hidden="true" />
                            <span className={`truncate ${active ? "" : "text-gray-500 dark:text-gray-400"}`}>{active ? active.name : "Оберіть набір"}</span>
                            {saved.isModified && (
                                <span
                                    title="Набір змінено"
                                    className="shrink-0 rounded px-1.5 text-[10px] leading-4 bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                                >
                                    змінено
                                </span>
                            )}
                        </span>
                        <i className={`fa-solid fa-chevron-down text-[10px] text-gray-500 transition-transform ${saved.menuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                </PopoverHandler>
                <PopoverContent className="w-[340px] overflow-hidden rounded-[10px] border border-gray-200 bg-white p-0 text-gray-800 shadow-lg dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200">
                    <div className="p-2">
                        <div className="flex h-[30px] items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 dark:border-neutral-600 dark:bg-neutral-900">
                            <i className="fa-regular fa-magnifying-glass text-xs text-gray-500" aria-hidden="true" />
                            <input
                                type="text"
                                value={saved.query}
                                onChange={(event) => saved.setQuery(event.target.value)}
                                aria-label="Пошук збережених фільтрів"
                                placeholder="Пошук наборів…"
                                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-0 dark:text-gray-200 dark:placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <p className="px-3 pb-3 pt-1 text-center text-xs text-gray-600 dark:text-gray-400">
                            {saved.sets.length === 0 ? "Збережених наборів ще немає" : "Нічого не знайдено"}
                        </p>
                    ) : (
                        <ul aria-label="Збережені набори фільтрів" className="m-0 max-h-72 list-none overflow-y-auto px-1 pb-1">
                            {items.map((item) => (
                                <li key={item.id} className={`flex items-center gap-0.5 rounded-md ${item.isActive ? "bg-blue-50 dark:bg-blue-800/20" : "hover:bg-gray-50 dark:hover:bg-neutral-700/60"}`}>
                                    <button
                                        type="button"
                                        aria-current={item.isActive ? "true" : undefined}
                                        onClick={() => saved.apply(item.id)}
                                        className={`flex min-w-0 flex-1 items-center gap-2 border-0 bg-transparent py-2 pr-2 text-left ${item.isActive ? "pl-2" : "pl-[30px]"}`}
                                    >
                                        {item.isActive && <i className="fa-solid fa-check text-xs text-blue-600 dark:text-blue-400" aria-hidden="true" />}
                                        <span className="min-w-0">
                                            <span className="flex items-center gap-1 truncate text-[13px] font-medium text-gray-800 dark:text-gray-200">
                                                <span className="truncate">{item.name}</span>
                                                {item.isDefault && <i className="fa-solid fa-star text-[10px] text-amber-500" role="img" aria-label="За замовчуванням" title="За замовчуванням" />}
                                            </span>
                                            <span className="block truncate text-[11px] text-gray-600 dark:text-gray-400" title={item.summary}>
                                                {item.summary}
                                            </span>
                                        </span>
                                    </button>
                                    <IconButton
                                        size="xs"
                                        variant="text"
                                        title={`Видалити «${item.name}»`}
                                        onClick={() => saved.remove(item.id)}
                                        className="hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        <i className="fa-regular fa-trash-can text-xs" aria-hidden="true" />
                                    </IconButton>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 p-2 dark:border-neutral-700 dark:bg-neutral-900/40">
                        <Button size="xs" disabled={!saved.hasActiveFilters} onClick={() => saved.openSave("new")} iconBefore={<i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />}>
                            Зберегти поточні
                        </Button>
                        <button
                            type="button"
                            onClick={saved.openManage}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-300"
                        >
                            Керувати наборами
                        </button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default observer(SavedFiltersMenu);
