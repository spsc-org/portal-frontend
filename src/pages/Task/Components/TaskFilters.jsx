import React from "react";
import {Button, Menu, MenuHandler, MenuItem, MenuList} from "@material-tailwind/react";
import SearchInput from "../../../Components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../Components/fields/MultiSelectChip.jsx";
import ChipToggle, {chipToggleClassName} from "../../../Components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../Components/fields/ChipResetButton.jsx";

const optionCaption = (option) => option?.caption || option?.name || option?.label || "";

// Спеціальна панель фільтрів сторінки задач в один ряд: пошук + чипи-фільтри
// зліва, групування і сортування справа (заміна стандартної сітки селектів;
// стара версія — за USE_LEGACY_TABLE)
const TaskFilters = ({
                         filters, onChangeOption, onChangeTitle, onClear,
                         statuses = [], priorities = [], types = [], projects = [], users = [],
                         groupBy, onGroupBy,
                         sortOptions = [], sortValue, direction, onSort, onToggleDirection,
                         onCreate, onToggleFavoritesOnly, onToggleHideDeleted,
                         showOnlyMineToggle = false, onToggleOnlyMine,
                         onExport, isExporting = false,
                     }) => {
    const hasActive = Boolean(
        filters.title || filters.statusId?.length || filters.priorityId?.length || filters.typeId?.length
        || filters.projectId?.length || filters.assignedUserId?.length || filters.createdUserId?.length
        || filters.onlyFavorite || filters.hideDeleted || filters.onlyMine
    );

    return (
        // Стікі-панель: непрозорий фон (не /90) — інакше в dark просвічує світлий контент
        <div data-i-doc="view:task-filters" className="sticky top-0 z-20 -mx-1 mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-1 py-2 dark:border-slate-700 dark:bg-neutral-900">
            <div className="w-56">
                <SearchInput
                    size="xs"
                    name="title"
                    value={filters.title || ""}
                    onChange={(e) => onChangeTitle(e.target.value || undefined)}
                    placeholder="Пошук задач…"
                    icon="fa-regular fa-magnifying-glass"
                />
            </div>
            <MultiSelectChip label="Статус" icon="fa-regular fa-circle-half-stroke"
                              options={statuses} value={filters.statusId || []} onChange={onChangeOption('statusId')}/>
            <MultiSelectChip label="Пріоритет" icon="fa-regular fa-flag"
                              options={priorities} value={filters.priorityId || []} onChange={onChangeOption('priorityId')}/>
            <MultiSelectChip label="Тип" icon="fa-regular fa-shapes"
                              options={types} value={filters.typeId || []} onChange={onChangeOption('typeId')}/>
            <MultiSelectChip label="Проєкт" icon="fa-regular fa-folder"
                              options={projects} value={filters.projectId || []} onChange={onChangeOption('projectId')}/>
            <MultiSelectChip label="Учасник" icon="fa-regular fa-user"
                              options={users} value={filters.assignedUserId || []} onChange={onChangeOption('assignedUserId')}/>
            <MultiSelectChip label="Автор" icon="fa-regular fa-user-pen"
                              options={users} value={filters.createdUserId || []} onChange={onChangeOption('createdUserId')}/>
            {showOnlyMineToggle &&
                <ChipToggle
                    active={Boolean(filters.onlyMine)}
                    onClick={() => onToggleOnlyMine(!filters.onlyMine)}
                    title="Показати лише мої задачі (де я власник або учасник)"
                    icon="fa-regular fa-user-check"
                    label="Тільки мої"
                />
            }
            <ChipToggle
                active={Boolean(filters.onlyFavorite)}
                onClick={() => onToggleFavoritesOnly(!filters.onlyFavorite)}
                title="Показати тільки обрані задачі"
                icon={`${filters.onlyFavorite ? "fa-solid" : "fa-regular"} fa-star`}
                color="amber"
            />
            <ChipToggle
                active={Boolean(filters.hideDeleted)}
                onClick={() => onToggleHideDeleted(!filters.hideDeleted)}
                title={filters.hideDeleted ? "Видалені приховано — показати знову" : "Приховати видалені задачі"}
                icon="fa-regular fa-eye-slash"
            />
            <ChipResetButton onClick={onClear} hasActive={hasActive} label="Скинути всі"/>

            {/* Правий блок: групування + сортування */}
            <div className="ml-auto flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800"
                     title="Групування списку">
                    {[["status", "Статус"], ["project", "Проєкт"], ["priority", "Пріоритет"], ["none", "Без груп"]].map(([key, label]) => (
                        <button key={key} type="button"
                                onClick={() => onGroupBy(key)}
                                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${groupBy === key
                                    ? "bg-blue-500 text-white"
                                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                            {label}
                        </button>
                    ))}
                </div>
                <Menu placement="bottom-end">
                    <MenuHandler>
                        <button type="button" title="Сортування"
                                className={chipToggleClassName(false)}>
                            <i className="fa-regular fa-arrow-down-arrow-up text-[10px]"></i>
                            {optionCaption(sortValue)}
                            <i className="fa-solid fa-chevron-down text-[8px] opacity-50"></i>
                        </button>
                    </MenuHandler>
                    <MenuList className="min-w-[10rem] border border-slate-200 bg-white p-1 text-slate-700 dark:border-slate-600 dark:!bg-slate-800 dark:!text-slate-200">
                        {sortOptions.map(option => (
                            <MenuItem key={option.id}
                                      onClick={() => onSort(option)}
                                      className={`text-xs dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:focus:bg-slate-700 ${sortValue?.id === option.id ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}>
                                {option.caption}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
                <button type="button"
                        onClick={onToggleDirection}
                        title={direction === 'asc' ? "За зростанням" : "За спаданням"}
                        className={`${chipToggleClassName(false)} px-2`}>
                    <i className={`fa-solid ${direction === 'asc' ? "fa-arrow-up-short-wide" : "fa-arrow-down-wide-short"}`}></i>
                </button>
                {Boolean(onExport) &&
                    <button type="button"
                            onClick={onExport}
                            disabled={isExporting}
                            title="Експортувати поточний список у Excel"
                            className={`${chipToggleClassName(false)} px-2 disabled:opacity-50`}>
                        <i className={`fa-solid ${isExporting ? "fa-spinner fa-spin" : "fa-file-excel"}`}></i>
                    </button>
                }
                {Boolean(onCreate) &&
                    <Button size="sm" color="blue" onClick={onCreate}
                            className="ml-1 flex items-center gap-1.5 px-3 py-2 text-[11px] normal-case">
                        <i className="fa-regular fa-plus"></i>Додати
                    </Button>
                }
            </div>
        </div>
    );
};

export default TaskFilters;
