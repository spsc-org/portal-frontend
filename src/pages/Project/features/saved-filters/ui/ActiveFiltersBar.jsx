import { observer } from "mobx-react-lite";
import Button from "../../../../../components/Buttons/Button.jsx";
import SavedFiltersMenu from "./SavedFiltersMenu.jsx";
import SaveFiltersModal from "./SaveFiltersModal.jsx";
import ManageSavedFiltersModal from "./ManageSavedFiltersModal.jsx";

// Рядок під панеллю фільтрів /project: «Активні фільтри:» (чипи з ×, «Скинути все»),
// праворуч — «Збережені:» і «Зберегти фільтри». filters — page.filters, saved — page.savedFilters.
const ActiveFiltersBar = ({ filters, saved }) => {
    const chips = filters.activeChips;
    return (
        <div data-i-doc="component:project-active-filters" className="flex flex-wrap items-center gap-1.5 px-0.5">
            <span className="text-xs text-gray-600 dark:text-gray-400">Активні фільтри:</span>
            {chips.length === 0 ? (
                <span className="text-xs text-gray-600 dark:text-gray-400">немає</span>
            ) : (
                chips.map((chip) => (
                    <span
                        key={chip.key}
                        title={chip.title}
                        className="inline-flex max-w-[22rem] items-center gap-1 whitespace-nowrap rounded bg-white py-0.5 pl-2 pr-1 text-xs leading-[18px] text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-800/20 dark:text-blue-300 dark:ring-blue-800"
                    >
                        <span className="truncate">
                            {chip.caption}: {chip.text}
                        </span>
                        <button
                            type="button"
                            aria-label={`Прибрати фільтр «${chip.caption}»`}
                            onClick={() => filters.onRemoveChip(chip)}
                            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-blue-800 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800/40"
                        >
                            <i className="fa-solid fa-xmark text-[10px]" aria-hidden="true" />
                        </button>
                    </span>
                ))
            )}
            {filters.canReset && (
                <button
                    type="button"
                    onClick={filters.onReset}
                    title={saved.defaultSet ? `Скинути до набору «${saved.defaultSet.name}»` : "Скинути всі фільтри"}
                    className="px-1.5 py-0.5 text-xs text-blue-600 hover:underline dark:text-blue-300"
                >
                    Скинути все
                </button>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <SavedFiltersMenu saved={saved} />
                {saved.canSave && (
                    <Button
                        size="xs"
                        variant="outlined"
                        onClick={() => saved.openSave()}
                        data-testid="saved-filters-save"
                        iconBefore={<i className="fa-regular fa-bookmark text-[11px]" aria-hidden="true" />}
                        className="h-[26px] border-blue-200 bg-white text-blue-700 dark:border-blue-300/45 dark:bg-transparent"
                    >
                        Зберегти фільтри
                    </Button>
                )}
            </div>

            <SaveFiltersModal saved={saved} />
            <ManageSavedFiltersModal saved={saved} />
        </div>
    );
};

export default observer(ActiveFiltersBar);
