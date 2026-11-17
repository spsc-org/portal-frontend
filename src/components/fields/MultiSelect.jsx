import Select from "react-select";
import CreatableSelect from "react-select/creatable";

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

    return (
        <div style={{width: width}}>
            <label htmlFor={id}
                   className={`block text-${size} text-gray-500 dark:text-gray-300`}>
                {label}
                {
                    isRequired &&
                    <i title="Обов'язкове поле" className="ml-1 fa-solid fa-asterisk text-red-600 text-xs"></i>
                }
            </label>
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
                menuPosition="fixed"
                formatCreateLabel={formatCreateLabel}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                noOptionsMessage={noOptionsMessage}
                styles={{
                    menuPortal: (base) => ({...base, zIndex: 9999}),
                    menu: (base) => ({...base, zIndex: 9999}),
                }}
                classNames={{
                    container: () => `text-${size} dark:text-gray-300`,
                    control: (props) => `dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 ${props.isDisabled ? "cursor-default" : "cursor-pointer"}`,
                    input: () => 'dark:text-gray-300 leading-none p-0',
                    placeholder: () => 'dark:text-gray-400',
                    menuList: () => 'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300',
                    option: (state) => state.isFocused
                        ? 'dark:text-gray-300 dark:bg-gray-500'
                        : 'dark:text-gray-300 dark:bg-gray-900',
                    multiValue: () => 'dark:bg-gray-700',
                    multiValueLabel: () => 'dark:text-gray-200',
                    multiValueRemove: () => 'dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white',
                    dropdownIndicator: (props) => `${props.isDisabled ? "opacity-0" : ""}`,
                    indicatorSeparator: (props) => `${props.isDisabled ? "opacity-0" : ""}`,
                }}
            />
            {
                Boolean(info) &&
                <p className="font-normal text-xs text-slate-500 dark:text-slate-400">
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