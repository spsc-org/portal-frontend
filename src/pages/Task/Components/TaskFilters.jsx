import { Menu, MenuHandler, MenuItem, MenuList } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import SearchInput from "../../../components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../components/fields/MultiSelectChip.jsx";
import ChipToggle from "../../../components/fields/ChipToggle.jsx";
import { chipToggleClassName } from "../../../components/fields/chipToggleStyles.js";
import ChipResetButton from "../../../components/fields/ChipResetButton.jsx";
import {SEGMENTED, segmentClassName} from "../utils.jsx";

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
        <div data-i-doc="view:task-filters" className="sticky top-[50px] z-20 mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
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
                <div role="group" aria-label="Групування списку" title="Групування списку" className={SEGMENTED}>
                    {[["status", "Статус"], ["project", "Проєкт"], ["priority", "Пріоритет"], ["none", "Без груп"]].map(([key, label]) => (
                        <button key={key} type="button"
                                onClick={() => onGroupBy(key)}
                                aria-pressed={groupBy === key}
                                className={segmentClassName(groupBy === key)}>
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
                    <MenuList className="min-w-[10rem] rounded-lg border border-gray-200 bg-white p-1 text-gray-700 shadow-lg dark:border-neutral-700 dark:!bg-neutral-800 dark:!text-gray-200">
                        {sortOptions.map(option => (
                            <MenuItem key={option.id}
                                      onClick={() => onSort(option)}
                                      className={`rounded-md text-xs text-gray-700 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700 dark:hover:text-gray-100 dark:focus:bg-neutral-700 ${sortValue?.id === option.id ? "!bg-blue-50 font-medium !text-blue-800 dark:!bg-blue-800/20 dark:!text-blue-300" : ""}`}>
                                {option.caption}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
                <button type="button"
                        onClick={onToggleDirection}
                        title={direction === 'asc' ? "За зростанням" : "За спаданням"}
                        aria-label={direction === 'asc' ? "Сортування за зростанням" : "Сортування за спаданням"}
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
