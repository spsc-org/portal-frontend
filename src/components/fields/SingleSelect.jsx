import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { selectMenuProps, useSelectMenuPortal } from "./selectMenuPortal.js";
import { kitSelectClassNames } from "./selectClassNames.js";

/**
 * isCreatable=true -> дозволяє створити нову опцію (react-select/creatable),
 * той самий патерн, що й MultiSelect (напр. динамічне створення проєкту).
 */
const SingleSelect = ({
                          options = [],
                          value = null,
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
                          isOptionDisabled,
                          isRequired = false,
                          info = "",
                          isCreatable = false,
                          formatCreateLabel = inputValue => `Створити "${inputValue}"`,
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
                    <i title="Обов'язкове поле" className="ml-1 fa-solid  fa-asterisk text-red-600 text-xs"></i>
                }
            </label>
            )}
            <SelectComponent
                id={id}
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
                placeholder="Оберіть"
                formatCreateLabel={isCreatable ? formatCreateLabel : undefined}
                {...selectMenuProps(menuPortalTarget)}

                getOptionLabel={getOptionLabel}
                getOptionValue={option => option.id || option.value || option}
                noOptionsMessage={() => <span>Не знайдено</span>}
                unstyled
                classNames={kitSelectClassNames({ size, invalid: Boolean(error), surface })}
            />
            {
                Boolean(info) &&
                <p className=" font-normal text-xs text-gray-600 dark:text-gray-400">
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

export default SingleSelect;
