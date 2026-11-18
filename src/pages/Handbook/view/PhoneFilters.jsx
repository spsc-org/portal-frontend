import { Menu, MenuHandler, MenuItem, MenuList } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import SearchInput from "../../../components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../components/fields/MultiSelectChip.jsx";
import ChipToggle from "../../../components/fields/ChipToggle.jsx";
import { chipToggleClassName } from "../../../components/fields/chipToggleStyles.js";
import ChipResetButton from "../../../components/fields/ChipResetButton.jsx";

// Однопунктовий dropdown (один з варіантів, не мультивибір) — той самий
// патерн, що й меню сортування в ReactPages/Task/Components/TaskFilters.jsx.
// Локальний для цього файлу: єдиний споживач поки що — Телефони (scope/
// status/сортування); якщо знадобиться десь іще — виносити в shared/fields.
const SingleSelectMenu = ({icon, options, value, onChange}) => {
    const current = options.find((option) => option.value === value) || options[0];

    return (
        <Menu placement="bottom-start">
            <MenuHandler>
                <button type="button" className={chipToggleClassName(false)}>
                    <i className={`${icon} text-[10px]`}></i>
                    {current?.label}
                    <i className="fa-solid fa-chevron-down text-[8px] opacity-50"></i>
                </button>
            </MenuHandler>
            <MenuList className="min-w-[9rem] border border-gray-200 bg-white p-1 text-gray-700 dark:border-gray-600 dark:!bg-neutral-700 dark:!text-gray-200">
                {options.map((option) => (
                    <MenuItem key={option.value}
                              onClick={() => onChange(option.value)}
                              className={`text-xs dark:text-gray-300 dark:hover:bg-neutral-600 dark:hover:text-gray-100 dark:focus:bg-neutral-600 ${value === option.value ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}>
                        {option.label}
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
};

// Та сама структура/стилістика, що й ReactPages/Task/Components/TaskFilters.jsx:
// dropdown-и для одновиборних фільтрів (стан), MultiSelectChip для
// багатовиборного (підрозділ — той самий компонент, що й "Проєкт"/"Учасник"
// у TaskFilters), сортування (поле + напрям) справа.
const PhoneFilters = ({
    q, onChangeQ,
    department = [], onChangeDepartment, departmentOptions = [],
    status, onChangeStatus, statusOptions = [],
    sort, onChangeSort, sortOptions = [],
    direction, onToggleDirection,
    onlyFavorite, onToggleOnlyFavorite,
    onlyConfirmed, onToggleOnlyConfirmed,
    onClear, canCreate, onCreate, canImport, onImport,
}) => {
    const hasActive = Boolean(
        q || department.length > 0 || (status && status !== "active") || onlyFavorite || onlyConfirmed,
    );
    // MultiSelectChip оперує {id, caption}-опціями (той самий контракт, що й
    // Task/Components/TaskFilters.jsx) — Підрозділ не має окремого id, тому
    // значення підрозділу саме й слугує id.
    const departmentSelectOptions = departmentOptions
        .filter((option) => option.value !== "all")
        .map((option) => ({id: option.value, caption: option.label}));

    return (
        <div data-i-doc="view:handbook-phone-filters" className="sticky top-[50px] z-20 mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="w-56">
                <SearchInput
                    size="xs"
                    name="q"
                    value={q}
                    onChange={(e) => onChangeQ(e.target.value || undefined)}
                    placeholder="Пошук за ім'ям, телефоном або приміткою…"
                    icon="fa-regular fa-magnifying-glass"
                />
            </div>

            {departmentSelectOptions.length > 0 &&
                <MultiSelectChip label="Підрозділ" icon="fa-regular fa-building"
                                  options={departmentSelectOptions}
                                  value={department.map((d) => ({id: d, caption: d}))}
                                  onChange={(next) => onChangeDepartment(next.map((option) => option.id))}/>
            }
            {statusOptions.length > 0 &&
                <SingleSelectMenu icon="fa-regular fa-box-archive" options={statusOptions} value={status} onChange={onChangeStatus}/>
            }
            {Boolean(onToggleOnlyFavorite) &&
                <ChipToggle
                    active={Boolean(onlyFavorite)}
                    onClick={() => onToggleOnlyFavorite(!onlyFavorite)}
                    title="Показати тільки обрані записи"
                    icon={`${onlyFavorite ? "fa-solid" : "fa-regular"} fa-star`}
                    color="amber"
                />
            }
            {Boolean(onToggleOnlyConfirmed) &&
                <ChipToggle
                    active={Boolean(onlyConfirmed)}
                    onClick={() => onToggleOnlyConfirmed(!onlyConfirmed)}
                    title="Показати тільки записи, де є підтверджений номер"
                    icon="fa-solid fa-circle-check"
                    color="green"
                />
            }

            <ChipResetButton onClick={onClear} hasActive={hasActive}/>

            <div className="ml-auto flex items-center gap-1.5">
                {sortOptions.length > 0 &&
                    <>
                        <SingleSelectMenu icon="fa-regular fa-arrow-down-arrow-up" options={sortOptions} value={sort} onChange={onChangeSort}/>
                        <button type="button"
                                onClick={onToggleDirection}
                                title={direction === "asc" ? "За зростанням" : "За спаданням"}
                                className={`${chipToggleClassName(false)} px-2`}>
                            <i className={`fa-solid ${direction === "asc" ? "fa-arrow-up-short-wide" : "fa-arrow-down-wide-short"}`}></i>
                        </button>
                    </>
                }
                {canImport &&
                    <button type="button" onClick={onImport}
                            title="Імпортувати з Excel"
                            className={chipToggleClassName(false)}>
                        <i className="fa-regular fa-file-arrow-up text-[10px]"></i>Імпорт
                    </button>
                }
                {canCreate &&
                    <Button size="sm" color="blue" onClick={onCreate}
                            className="flex items-center gap-1.5 px-3 py-2 text-[11px] normal-case">
                        <i className="fa-regular fa-plus"></i>Додати
                    </Button>
                }
            </div>
        </div>
    );
};

export default PhoneFilters;
