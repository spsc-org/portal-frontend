import Select from "react-select";
import CreatableSelect from "react-select/creatable";

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
                          onBlur,
                          getOptionLabel = option => option.caption || option.label || option.name || option,
                          isOptionDisabled,
                          isRequired = false,
                          info = "",
                          isCreatable = false,
                          formatCreateLabel = inputValue => `Створити "${inputValue}"`,
                      }) => {
    const SelectComponent = isCreatable ? CreatableSelect : Select;

    return (
        <div style={{width: width}}>
            <label htmlFor={id}
                   className={`block text-${size} text-gray-500 dark:text-gray-300`}>
                {label}
                {
                    isRequired &&
                    <i title="Обов'язкове поле" className="ml-1 fa-solid  fa-asterisk text-red-600 text-xs"></i>
                }
            </label>
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
                menuPosition="fixed"
                formatCreateLabel={isCreatable ? formatCreateLabel : undefined}
                styles={{
                    menuPortal: (base) => ({...base, zIndex: 9999}),
                    menu: (base) => ({...base, zIndex: 9999}),
                }}

                getOptionLabel={getOptionLabel}
                getOptionValue={option => option.id || option.value || option}
                noOptionsMessage={() => <span>Не знайдено</span>}
                classNames={{
                    container: () => `bg-grey-500 text-${size} z-1  dark:text-gray-300`,

                    control: () => 'bg-grey-500  dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300',
                    input: (props) => `dark:text-gray-300 leading-none p-0 ${props.isDisabled ? "cursor-default" : "cursor-pointer"}`,
                    menuList: () => ' dark:text-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300',
                    singleValue: () => 'dark:text-gray-300',
                    dropdownIndicator: (props) => `${props.isDisabled && "opacity-0"}`,
                    indicatorSeparator: (props) => `${props.isDisabled && "opacity-0"}`,
                    option: (state,) => state.isFocused && 'dark:text-gray-300 dark:bg-gray-500',
                }}
            />
            {
                Boolean(info) &&
                <p className=" font-normal text-xs text-slate-500 dark:text-slate-400">
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
