import React, {useState} from "react";
import {Spinner} from "@material-tailwind/react";
import MultiSelect from "../../../Components/fields/MultiSelect.jsx";
import {TagPill} from "../utils.jsx";

/**
 * Редактор тегів задачі (пілюлі + кнопка додавання): переюзабельний між
 * TaskViewPanel (картка) і CreateTaskModal (чернетка при створенні) —
 * обидва просто передають поточний список тегів і mutate-функцію.
 * onAdd отримує "сирий" вибір з MultiSelect (масив опцій, остання — нова);
 * розбір __isNew__ лишається на виклику, бо різні місця по-різному
 * будують opts (createdBy/pivot тощо).
 */
const TagsEditor = ({tags = [], options = [], onAdd, onRemove, isPending = false, canEdit = true, canRemoveTag}) => {
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = (selected) => {
        setIsAdding(false);
        onAdd(selected);
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-1">
                {tags.map(tag => (
                    <TagPill key={tag.id} tag={tag}
                             onRemove={canEdit && (!canRemoveTag || canRemoveTag(tag)) && !isPending
                                 ? () => onRemove(tag.id)
                                 : undefined}/>
                ))}
                {tags.length === 0 && !canEdit && <span className="text-xs text-slate-400 dark:text-slate-500">—</span>}
                {canEdit && !isAdding &&
                    <button type="button"
                            onClick={() => setIsAdding(true)}
                            disabled={isPending}
                            className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] text-slate-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400">
                        <i className="fa-regular fa-plus mr-1"></i>Тег
                    </button>
                }
                {isPending && <Spinner className="h-3 w-3"/>}
            </div>
            {canEdit && isAdding &&
                <div className="mt-1.5">
                    <MultiSelect
                        isCreatable
                        closeMenuOnSelect
                        id="task-tags-editor-add"
                        options={options}
                        value={[]}
                        onChange={handleAdd}
                        onBlur={() => setIsAdding(false)}
                        placeholder="Оберіть або створіть тег"
                        formatCreateLabel={(inputValue) => `Створити "${inputValue}"`}
                    />
                </div>
            }
        </div>
    );
};

export default TagsEditor;
