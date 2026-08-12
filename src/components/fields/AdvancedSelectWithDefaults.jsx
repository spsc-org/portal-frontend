import Select from 'react-select';

const AdvancedSelectWithDefaults = ({
                            options = [],
                            selectedOptions = [],
                            label = '',
                            id = '',
                            isMulti = false,
                            width = '100%',
                            onChange,
                            closeMenuOnSelect = false,
                            size = "sm",
                            ...props
                        }) => {

    // Map raw options to { value, label } format for react-select
    const mappedOptions = Array.isArray(options)
        ? options.map(o => ({
            ...(o), // Keep original object properties
            value: o.id !== undefined ? o.id : o.value,
            label: o.caption !== undefined ? o.caption : o.name,
        }))
        : [];

    // Find the selected value object(s) from the mapped options
    const getSelectedValue = () => {
        if (isMulti) {
            if (!Array.isArray(selectedOptions)) return [];
            const selectedValues = selectedOptions.map(so => so.id !== undefined ? so.id : so.value);
            return mappedOptions.filter(o => selectedValues.includes(o.value));
        }
        if (!selectedOptions) return null;
        const selectedValue = selectedOptions.id !== undefined ? selectedOptions.id : selectedOptions.value;
        return mappedOptions.find(o => o.value === selectedValue);
    };

    // Pass the full original object back to the parent component
    const handleChange = (selected) => {
        if (onChange) {
            if (isMulti) {
                onChange(selected || []);
            } else {
                onChange(selected || null);
            }
        }
    };

    return (
        <div style={{width: width}}>
            <label htmlFor={id}
                   className={`block text-${size} text-gray-500 dark:text-gray-300`}>{label}</label>
            <Select
                id={id}
                isMulti={isMulti}
                value={getSelectedValue()}
                onChange={handleChange}
                name={label}
                {...props}
                options={mappedOptions}
                menuPosition="fixed"
                styles={{
                    menuPortal: (base) => ({...base, zIndex: 9999}),
                    menu: (base) => ({...base, zIndex: 9999}),
                }}
                closeMenuOnSelect={closeMenuOnSelect}
                hideSelectedOptions={false}
                placeholder="Оберіть"
                noOptionsMessage={() => <span>Не знайдено</span>}
                classNames={{
                    container: () => `bg-grey-500 text-${size} z-1  dark:text-gray-300`,
                    control: () => 'bg-grey-500  dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300',
                    input: () => 'dark:text-gray-300',
                    menuList: () => 'dark:text-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300',
                    singleValue: () => 'dark:text-gray-300',
                    option: (state,) => state.isFocused && 'dark:text-gray-300 dark:bg-gray-500',
                }}
            />
        </div>
    );
};

export default AdvancedSelectWithDefaults;
