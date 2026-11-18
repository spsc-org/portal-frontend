import Select from 'react-select';
import { selectMenuProps, useSelectMenuPortal } from "./selectMenuPortal.js";
import { kitSelectClassNames } from "./selectClassNames.js";

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
                            // вилучаємо з ...props: компонент завжди мультивибір (isMulti нижче)
                            isMulti: _isMulti = false,
                            width = '100%',
                            onChange,
                            closeMenuOnSelect = false,
                            size= "sm",
                            ...props
                        }) => {
    const { anchorRef, menuPortalTarget } = useSelectMenuPortal();
    return (
        <div ref={anchorRef} style={{width: width}}>
            <label htmlFor={id}
                   className={`mb-0.5 block truncate text-${size} text-gray-600 dark:text-gray-400`}>{label}</label>
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
                {...selectMenuProps(menuPortalTarget)}
                unstyled
                classNames={kitSelectClassNames({ size })}
            />
        </div>

    );
};

export default AdvancedSelect;
