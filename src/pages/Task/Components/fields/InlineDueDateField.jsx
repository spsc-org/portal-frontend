import {useState} from "react";
import {Spinner} from "@material-tailwind/react";
import {format, isPast, isToday} from "date-fns";
import DatePicker from "../../../../components/fields/DatePicker.jsx";
import MetaRow from "../../../../components/MetaRow.jsx";

/**
 * Клікабельний термін задачі: значення (+ підсвітка прострочення) + олівець
 * → DatePicker, окрема кнопка прибрати термін. Спільний для TaskViewPanel і
 * CreateTaskModal.
 */
const InlineDueDateField = ({value, onSave, onClear, isPending = false, canEdit = true}) => {
    const [isEditing, setIsEditing] = useState(false);
    const dueDate = value ? new Date(value) : null;
    const isOverdue = Boolean(dueDate) && isPast(dueDate) && !isToday(dueDate);

    const handleChange = (date) => {
        setIsEditing(false);
        if (!date) return;
        onSave(format(date, "yyyy-MM-dd"));
    };

    const handleClear = () => {
        setIsEditing(false);
        onClear();
    };

    return (
        <MetaRow icon="fa-regular fa-calendar" label="Термін" valueClassName={isOverdue ? "!text-red-500 font-semibold" : ""}>
            {isEditing ? (
                <div className="flex items-center gap-1">
                    <DatePicker value={dueDate || undefined} onChange={handleChange}/>
                    <button type="button" onClick={() => setIsEditing(false)} title="Скасувати"
                            className="text-gray-600 transition hover:text-red-500">
                        <i className="fa-regular fa-xmark text-xs"></i>
                    </button>
                </div>
            ) : (
                <span className="inline-flex items-center gap-1.5">
                    {isPending
                        ? <Spinner className="h-3 w-3"/>
                        : <>
                            {dueDate ? format(dueDate, "yyyy-MM-dd") : "—"}
                            {isOverdue ? " (прострочено)" : ""}
                        </>}
                    {canEdit && !isPending &&
                        <>
                            <button type="button" onClick={() => setIsEditing(true)} title="Змінити термін"
                                    className="text-gray-600 transition hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400">
                                <i className="fa-regular fa-pen text-[10px]"></i>
                            </button>
                            {Boolean(dueDate) &&
                                <button type="button" onClick={handleClear} title="Прибрати термін"
                                        className="text-gray-600 transition hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400">
                                    <i className="fa-regular fa-calendar-xmark text-[10px]"></i>
                                </button>
                            }
                        </>
                    }
                </span>
            )}
        </MetaRow>
    );
};

export default InlineDueDateField;
