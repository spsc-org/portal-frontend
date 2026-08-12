import Select from 'react-select';

const mapSelectOptions = (options = []) => {
    if (!Array.isArray(options)) return [];

    return options
        .map((o) => {
            const value = o?.id ?? o?.value ?? o?.userId;
            const label = o?.caption ?? o?.name ?? o?.label;
            if (value === undefined || value === null || !label) return null;
            return {value, label};
        })
        .filter(Boolean);
};

const AdvancedSelect = ({
                            options = [],
                            selectedOptions = [],
                            label = '',
                            id = '',
                            isMulti = false,
                            width = '100%',
                            onChange,
                            closeMenuOnSelect = false,
                            size= "sm",
                            ...props
                        }) => {
    return (
        <div style={{width: width}}>
            <label htmlFor={id}
                   className={`block text-${size} text-gray-500 dark:text-gray-300`}>{label}</label>
            <Select
                id={id}
                isMulti
                value={selectedOptions}
                onChange={onChange}
                name={label}
                {...props}
                options={mapSelectOptions(options)}
                closeMenuOnSelect={closeMenuOnSelect}
                hideSelectedOptions={false}
                placeholder="Оберіть"
                noOptionsMessage={() => <span>Не знайдено</span>}
                menuPosition="fixed"
                styles={{
                    menuPortal: (base) => ({...base, zIndex: 9999}),
                    menu: (base) => ({...base, zIndex: 9999}),
                }}
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

export default AdvancedSelect;
