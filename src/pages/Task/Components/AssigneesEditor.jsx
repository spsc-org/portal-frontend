import {useState} from "react";
import {Spinner} from "@material-tailwind/react";
import {PersonPill} from "../utils.jsx";
import MultiSelect from "../../../components/fields/MultiSelect.jsx";

/**
 * Редактор пов'язаних осіб задачі (0..N): переюзабельний між TaskViewPanel
 * (картка) і CreateTaskModal (чернетка при створенні).
 */
const AssigneesEditor = ({assignedUsers = [], options = [], onAdd, onRemove, isPending = false, canEdit = true}) => {
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = (selected) => {
        setIsAdding(false);
        onAdd(selected);
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-1">
                {assignedUsers.map(user => (
                    <PersonPill key={user.id} name={user.name}
                                onRemove={canEdit && !isPending ? () => onRemove(user.id) : undefined}/>
                ))}
                {assignedUsers.length === 0 && !canEdit && <span className="text-xs text-gray-600 dark:text-gray-400">—</span>}
                {canEdit && !isAdding &&
                    <button type="button"
                            onClick={() => setIsAdding(true)}
                            disabled={isPending}
                            className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:border-blue-500 hover:text-blue-600 dark:border-neutral-600 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:text-blue-400">
                        <i className="fa-regular fa-plus mr-1"></i>Учасник
                    </button>
                }
                {isPending && <Spinner className="h-3 w-3"/>}
            </div>
            {canEdit && isAdding &&
                <div className="mt-1.5">
                    <MultiSelect
                        closeMenuOnSelect
                        id="task-assignees-editor-add"
                        options={options}
                        value={[]}
                        onChange={handleAdd}
                        onBlur={() => setIsAdding(false)}
                        placeholder="Оберіть користувача"
                    />
                </div>
            }
        </div>
    );
};

export default AssigneesEditor;
