import {Button} from "@material-tailwind/react";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../components/fields/MultiSelectChip.jsx";
import ChipToggle, {chipToggleClassName} from "../../../components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../components/fields/ChipResetButton.jsx";

const MONTH_OPTIONS = [
    {id: 1, caption: "Січень"}, {id: 2, caption: "Лютий"}, {id: 3, caption: "Березень"},
    {id: 4, caption: "Квітень"}, {id: 5, caption: "Травень"}, {id: 6, caption: "Червень"},
    {id: 7, caption: "Липень"}, {id: 8, caption: "Серпень"}, {id: 9, caption: "Вересень"},
    {id: 10, caption: "Жовтень"}, {id: 11, caption: "Листопад"}, {id: 12, caption: "Грудень"},
];

// Панель фільтрів в один рядок — та сама структура/стилістика, що й
// ReactPages/Task/Components/TaskFilters.jsx.
const BirthdayFilters = ({q, onChangeQ, scope, onChangeScope, scopeOptions = [], month, onChangeMonth, onClear, canCreate, onCreate, canImport, onImport}) => {
    const selectedMonths = month ? [MONTH_OPTIONS.find((m) => m.id === month)].filter(Boolean) : [];
    const hasActive = Boolean(q || (scope && scope !== "all") || month);

    return (
        <div data-i-doc="view:handbook-birthday-filters" className="sticky top-[50px] z-20 -mx-1 mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-1 py-2 dark:border-slate-700 dark:bg-neutral-900">
            <div className="w-56">
                <SearchInput
                    size="xs"
                    name="q"
                    value={q}
                    onChange={(e) => onChangeQ(e.target.value || undefined)}
                    placeholder="Пошук за ім'ям…"
                    icon="fa-regular fa-magnifying-glass"
                />
            </div>
            {scopeOptions.map((option) => (
                <ChipToggle
                    key={option.value}
                    active={scope === option.value}
                    onClick={() => onChangeScope(scope === option.value ? "all" : option.value)}
                    label={option.label}
                />
            ))}
            <MultiSelectChip label="Місяць" icon="fa-regular fa-calendar"
                              options={MONTH_OPTIONS} value={selectedMonths}
                              onChange={(selected) => onChangeMonth(selected[0]?.id)}/>
            <ChipResetButton onClick={onClear} hasActive={hasActive}/>

            {(canCreate || canImport) &&
                <div className="ml-auto flex items-center gap-1.5">
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
            }
        </div>
    );
};

export default BirthdayFilters;
