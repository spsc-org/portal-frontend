import { useMemo } from "react";
import Select from "react-select";
import { FIELD_LABEL_CLASS } from "./fieldStyles.js";
import { selectMenuProps, useSelectMenuPortal } from "../../../../components/fields/selectMenuPortal.js";
import { kitSelectClassNames } from "../../../../components/fields/selectClassNames.js";

// Мультивибір фільтра на react-select, стилізований під Portal UI kit
// (border-input, radius-md, focus-ring, surface-card; темна тема — neutral-800).
// options — [{value, label, title?}]; value — масив value обраних опцій.
const MultiSelectFilter = ({ id, label, options, value, onChange, formatOptionLabel, isLoading = false }) => {
    const selected = useMemo(() => {
        const set = new Set(value);
        return options.filter((option) => set.has(option.value));
    }, [options, value]);
    const { anchorRef, menuPortalTarget } = useSelectMenuPortal();

    return (
        <div ref={anchorRef} className="min-w-0">
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
                {...selectMenuProps(menuPortalTarget)}
                unstyled
                classNames={kitSelectClassNames({ size: "xs", multiValueMaxWidth: "max-w-[10rem]" })}
            />
        </div>
    );
};

export default MultiSelectFilter;
