import { observer } from "mobx-react-lite";
import Select from "react-select";
import MultiSelect from "../../../../components/fields/MultiSelect.jsx";
import { SELECT, borderFor } from "./formStyles.js";

/** Повідомлення валідації під/біля поля (legacy span#warningSpan-{name}). */
export const FieldNote = ({ issue, className = "" }) =>
    issue?.message ? (
        <span className={`text-xs font-normal normal-case ${issue.level === "warning" ? "text-orange-500" : "text-red-500"} ${className}`}>
            {issue.level === "warning" ? "⚠️" : "🛑️"} {issue.message}
        </span>
    ) : null;

/** Швидкі підказки (останні значення) під полем. */
export const Hints = observer(({ items, onPick }) => (
    <div className="flex h-6 flex-wrap gap-1 overflow-hidden pt-1 text-xs">
        {items.map((hint) => (
            <button
                key={hint.id}
                type="button"
                title={hint.caption}
                onClick={() => onPick(hint.id)}
                className="cursor-pointer rounded bg-gray-200 px-1 italic text-blue-500 hover:bg-blue-100 dark:bg-blue-800 dark:text-gray-300"
            >
                {hint.short}
            </button>
        ))}
    </div>
));

const optionLabel = (option) => option.caption ?? option.label ?? String(option.id);
const optionValue = (option) => String(option.id);

/** Мультивибір зі словника (react-select, тема як у components/fields/MultiSelect). */
export const VocMulti = ({ options, value, onChange, issue, id }) => (
    <div className={issue ? `rounded-md border ${borderFor(issue)}` : ""}>
        <MultiSelect
            id={id}
            options={options}
            value={value}
            onChange={onChange}
            getOptionLabel={optionLabel}
            getOptionValue={optionValue}
        />
    </div>
);

/** Один елемент зі словника з пошуком і очищенням (указ). */
export const VocSearchSelect = ({ options, value, onChange, id }) => (
    <Select
        inputId={id}
        options={options}
        value={options.find((option) => Number(option.id) === Number(value)) ?? null}
        onChange={(option) => onChange(option ? Number(option.id) : null)}
        getOptionLabel={optionLabel}
        getOptionValue={optionValue}
        isClearable
        placeholder="Оберіть"
        noOptionsMessage={() => "Нічого не знайдено"}
        menuPosition="fixed"
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }), menu: (base) => ({ ...base, zIndex: 9999 }) }}
        classNames={{
            container: () => "text-sm dark:text-gray-300",
            control: () => "dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300",
            singleValue: () => "dark:text-gray-300",
            input: () => "dark:text-gray-300",
            menuList: () => "dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300",
            option: (state) => (state.isFocused ? "dark:bg-gray-500 dark:text-gray-300" : "dark:bg-gray-900 dark:text-gray-300"),
        }}
    />
);

/** Нативний селект зі словника: порожнє значення → null. */
export const VocSelect = ({ name, options, value, onChange, issue, className = SELECT, empty = true }) => (
    <select
        name={name}
        className={`${className} ${borderFor(issue)}`}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        title={issue?.message}
    >
        {empty && <option value="" />}
        {options.map((option) => (
            <option key={option.id} value={option.id} title={option.caption}>
                {option.caption}
            </option>
        ))}
    </select>
);
