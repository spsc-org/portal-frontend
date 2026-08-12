import React, {useState} from "react";
import SingleSelect from "../../../Components/fields/SingleSelect.jsx";

const EditableCellSelect = ({getValue, row, column, table, options, isOptionDisabled}) => {
    const initialValue = getValue() ? options.find(o=>o.id === Number(getValue())) : undefined;
    const [value, setValue] = useState(initialValue);
    const onBlur = (select) => {
        table.options.meta?.updateData(row.index, column.id, select?.id);
    };

    const handleSelect = (select) => {
        setValue(select);
    }

    return (
        <SingleSelect
            closeMenuOnSelect
            options={options}
            isOptionDisabled={isOptionDisabled}
            size="xs"
            onBlur={onBlur}
            value={value}
            onChange={handleSelect}/>
    )
};

export default EditableCellSelect;
