import Select from 'react-select';
import { selectMenuProps, useSelectMenuPortal } from "./selectMenuPortal.js";
import { kitSelectClassNames } from "./selectClassNames.js";

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

    const { anchorRef, menuPortalTarget } = useSelectMenuPortal();

    return (
        <div ref={anchorRef} style={{width: width}}>
            <label htmlFor={id}
                   className={`mb-0.5 block truncate text-${size} text-gray-600 dark:text-gray-400`}>{label}</label>
            <Select
                id={id}
                isMulti={isMulti}
                value={getSelectedValue()}
                onChange={handleChange}
                name={label}
                {...props}
                options={mappedOptions}
                {...selectMenuProps(menuPortalTarget)}
                closeMenuOnSelect={closeMenuOnSelect}
                hideSelectedOptions={false}
                placeholder="Оберіть"
                noOptionsMessage={() => <span>Не знайдено</span>}
                unstyled
                classNames={kitSelectClassNames({ size })}
            />
        </div>
    );
};

export default AdvancedSelectWithDefaults;
