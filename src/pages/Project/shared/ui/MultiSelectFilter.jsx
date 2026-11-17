import { useMemo } from "react";
import Select from "react-select";
import { FIELD_LABEL_CLASS } from "./fieldStyles.js";

// Мультивибір фільтра на react-select, стилізований під Portal UI kit
// (border-input, radius-md, focus-ring, surface-card; темна тема — neutral-800).
// options — [{value, label, title?}]; value — масив value обраних опцій.
const MultiSelectFilter = ({ id, label, options, value, onChange, formatOptionLabel, isLoading = false }) => {
    const selected = useMemo(() => {
        const set = new Set(value);
        return options.filter((option) => set.has(option.value));
    }, [options, value]);

    return (
        <div className="min-w-0">
            <label htmlFor={id} className={FIELD_LABEL_CLASS}>
                {label}
            </label>
            <Select
                inputId={id}
                isMulti
                isClearable
                isLoading={isLoading}
                options={options}
                value={selected}
                onChange={(next) => onChange((next ?? []).map((option) => option.value))}
                formatOptionLabel={formatOptionLabel}
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                placeholder="Оберіть"
                noOptionsMessage={() => "Нічого не знайдено"}
                loadingMessage={() => "Завантаження…"}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                unstyled
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 1050 }) }}
                classNames={{
                    control: (state) =>
                        `min-h-[2.25rem] rounded-md border bg-white px-1.5 text-xs dark:bg-neutral-800 ${
                            state.isFocused
                                ? "border-blue-300 ring-2 ring-blue-300"
                                : "border-gray-200 hover:border-gray-400 dark:border-gray-600"
                        }`,
                    valueContainer: () => "gap-1 py-1",
                    placeholder: () => "text-gray-400 dark:text-gray-500",
                    input: () => "text-gray-700 dark:text-gray-300",
                    multiValue: () => "max-w-[10rem] items-center gap-0.5 rounded bg-gray-100 pl-1 dark:bg-gray-700",
                    multiValueLabel: () => "truncate text-[11px] text-gray-700 dark:text-gray-200",
                    multiValueRemove: () => "rounded px-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-600 dark:hover:text-white",
                    indicatorsContainer: () => "gap-0.5 text-gray-400",
                    clearIndicator: () => "cursor-pointer p-0.5 hover:text-gray-700 dark:hover:text-gray-200",
                    dropdownIndicator: () => "cursor-pointer p-0.5 hover:text-gray-700 dark:hover:text-gray-200",
                    indicatorSeparator: () => "my-1.5 w-px bg-gray-200 dark:bg-gray-600",
                    menu: () =>
                        "mt-1 w-max min-w-full max-w-[26rem] overflow-hidden rounded-lg border border-gray-200 bg-white text-xs shadow-lg dark:border-neutral-700 dark:bg-neutral-800",
                    menuList: () => "max-h-72 py-1",
                    option: (state) =>
                        `cursor-pointer px-2 py-1.5 ${
                            state.isSelected
                                ? "bg-blue-50 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300"
                                : state.isFocused
                                    ? "bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-200"
                                    : "text-gray-700 dark:text-gray-300"
                        }`,
                    noOptionsMessage: () => "px-2 py-1.5 text-gray-500",
                    loadingMessage: () => "px-2 py-1.5 text-gray-500",
                }}
            />
        </div>
    );
};

export default MultiSelectFilter;
