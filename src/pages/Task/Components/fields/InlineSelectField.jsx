import React, {useState} from "react";
import {Spinner} from "@material-tailwind/react";
import SingleSelect from "../../../../Components/fields/SingleSelect.jsx";
import MetaRow from "../../../../Components/MetaRow.jsx";

const optionCaption = (option) => option?.caption || option?.name || option?.label || "";

/**
 * Клікабельне однозначне поле картки (тип/пріоритет/проєкт тощо):
 * значення (через renderValue або підпис за замовчуванням) + олівець →
 * SingleSelect на місці. Спільний для TaskViewPanel і CreateTaskModal —
 * консистентний вигляд і поведінка в обох місцях.
 */
const InlineSelectField = ({
                               icon, label, options = [], value, onSave,
                               renderValue, canEdit = true, isPending = false,
                               isClearable = false, isCreatable = false, formatCreateLabel,
                           }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleChange = (option) => {
        setIsEditing(false);
        onSave(option);
    };

    return (
        <MetaRow icon={icon} label={label}>
            {isEditing ? (
                <SingleSelect
                    size="xs"
                    closeMenuOnSelect
                    isClearable={isClearable}
                    isCreatable={isCreatable}
                    formatCreateLabel={formatCreateLabel}
                    options={options}
                    value={value || null}
                    onChange={handleChange}
                    onBlur={() => setIsEditing(false)}
                />
            ) : (
                <span className="inline-flex items-center gap-1.5">
                    {isPending
                        ? <Spinner className="h-3 w-3"/>
                        : (renderValue ? renderValue(value) : (value ? optionCaption(value) : "—"))}
                    {canEdit && !isPending &&
                        <button type="button"
                                onClick={() => setIsEditing(true)}
                                title={`Змінити: ${label}`}
                                className="text-slate-400 transition hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400">
                            <i className="fa-regular fa-pen text-[10px]"></i>
                        </button>
                    }
                </span>
            )}
        </MetaRow>
    );
};

export default InlineSelectField;
