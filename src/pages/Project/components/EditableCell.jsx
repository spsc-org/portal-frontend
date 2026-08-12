import {useState} from "react";
import Input from "../../../Components/fields/Input.jsx";

const EditableCell = ({getValue, row, column, table, ...props}) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);

    const onBlur = () => {
        table.options.meta?.updateData(row.index, column.id, value);
    };

    return (
        <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            {...props}
            onBlur={onBlur}
            className="w-full px-2 py-0.5 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        />
    )
};

export default EditableCell;
