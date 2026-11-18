import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { selectMenuProps, useSelectMenuPortal } from "./selectMenuPortal.js";
import { kitSelectClassNames } from "./selectClassNames.js";

/**
 * Багатовибірний селект на базі react-select.
 * Тематизація (світла/темна) узгоджена з SingleSelect.jsx.
 *
 * isCreatable=true -> дозволяє створювати нові опції (react-select/creatable).
 */
const MultiSelect = ({
                         options = [],
                         value = [],
                         label = '',
                         id = '',
                         width = '100%',
                         disabled = false,
                         error,
                         onChange,
                         isSearchable = true,
                         isClearable = false,
                         closeMenuOnSelect = false,
                         size = "sm",
                         surface = "card",
                         onBlur,
                         getOptionLabel = option => option.caption || option.label || option.name || option,
                         getOptionValue = option => option.id || option.value || option,
                         isOptionDisabled,
                         isRequired = false,
                         info = "",
                         isCreatable = false,
                         placeholder = "Оберіть",
                         formatCreateLabel = inputValue => `Створити "${inputValue}"`,
                         noOptionsMessage = () => <span>Не знайдено</span>,
                     }) => {
    const SelectComponent = isCreatable ? CreatableSelect : Select;

    const { anchorRef, menuPortalTarget } = useSelectMenuPortal();

    return (
        <div ref={anchorRef} style={{width: width}}>
            {(label || isRequired) && (
            <label htmlFor={id}
                   className={`mb-0.5 block truncate text-${size} text-gray-600 dark:text-gray-400`}>
                {label}
                {
                    isRequired &&
                    <i title="Обов'язкове поле" className="ml-1 fa-solid fa-asterisk text-red-600 text-xs"></i>
                }
            </label>
            )}
            <SelectComponent
                id={id}
                isMulti
                value={value}
                isClearable={isClearable}
                onChange={onChange}
                name={label}
                isOptionDisabled={isOptionDisabled}
                onBlur={onBlur ? () => onBlur(value) : undefined}
                isDisabled={disabled}
                options={options}
                required={isRequired}
                isSearchable={isSearchable}
                closeMenuOnSelect={closeMenuOnSelect}
                hideSelectedOptions={false}
                placeholder={placeholder}
                formatCreateLabel={formatCreateLabel}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                noOptionsMessage={noOptionsMessage}
                {...selectMenuProps(menuPortalTarget)}
                unstyled
                classNames={kitSelectClassNames({ size, invalid: Boolean(error), surface })}
            />
            {
                Boolean(info) &&
                <p className="font-normal text-xs text-gray-600 dark:text-gray-400">
                    <i className="fa-solid fa-circle-info"></i>
                    <span className="ml-1">{info}</span>
                </p>
            }
            {
                Boolean(error) &&
                <span className="text-sm font-medium text-red-500">
                <span className="mr-1">Помилка:</span>{error}</span>
            }
        </div>
    );
};

export default MultiSelect;