import TextFilter from "../../../shared/ui/TextFilter.jsx";
import MultiSelectFilter from "../../../shared/ui/MultiSelectFilter.jsx";

const formatAttributeOption = (option) => (
    <span title={option.title}>
        {option.icon && <i className={`${option.icon} mr-1`} />}
        {option.label}
    </span>
);

// View: панель фільтрів. vm — useProjectFiltersViewModel().
const ProjectFilters = ({ vm }) => (
    <div
        data-i-doc="component:project-list-filters"
        className="rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800"
    >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] items-end gap-2">
            {vm.fields.map((field) =>
                field.kind === "text" ? (
                    <TextFilter key={field.key} id={field.id} label={field.label} value={field.value} onChange={(value) => vm.onChange(field.key, value)} />
                ) : (
                    <MultiSelectFilter
                        key={field.key}
                        id={field.id}
                        label={field.label}
                        options={field.options}
                        isLoading={field.isLoading}
                        value={field.value}
                        onChange={(value) => vm.onChange(field.key, value)}
                        formatOptionLabel={field.kind === "attribute" ? formatAttributeOption : undefined}
                    />
                )
            )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <button
                type="button"
                onClick={vm.onToggleCompact}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-gray-600 hover:border-blue-300 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:text-blue-300"
            >
                <i className={`fa-solid ${vm.compact ? "fa-chevron-down" : "fa-chevron-up"}`} />
                {vm.compact ? "Розширені фільтри" : "Згорнути фільтри"}
                {vm.hiddenActiveCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-gray-900" title="Активні приховані фільтри">
                        {vm.hiddenActiveCount}
                    </span>
                )}
            </button>
            {vm.canReset && (
                <button
                    type="button"
                    onClick={vm.onReset}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                    <i className="fa-solid fa-filter-circle-xmark" />
                    Скинути фільтри
                </button>
            )}
            {vm.proposalExtendedCount !== null && (
                <span
                    className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300"
                    title="Налаштовується кнопкою «Фільтр за поданням» у тулбарі"
                >
                    <i className="fa-regular fa-filter" />
                    Фільтр за поданням: {vm.proposalExtendedCount} подань
                </span>
            )}
        </div>
    </div>
);

export default ProjectFilters;
