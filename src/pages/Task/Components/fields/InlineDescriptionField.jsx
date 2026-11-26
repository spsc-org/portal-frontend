import {useState} from "react";
import { Spinner } from "@material-tailwind/react"
import Button from "../../../../components/Buttons/Button.jsx"

/**
 * Клікабельний опис задачі: клік → textarea з явними кнопками
 * Зберегти/Скасувати (на відміну від назви — тут немає autosave на blur,
 * опис довший і випадковий клік поза текстом не мав би губити правки).
 * Спільний для TaskViewPanel і CreateTaskModal.
 */
const InlineDescriptionField = ({value, onSave, isPending = false, canEdit = true, placeholder = "Додати опис…"}) => {
    const [draft, setDraft] = useState(null);

    const save = () => {
        const nextValue = draft ?? "";
        setDraft(null);
        if ((value || "") === nextValue) return;
        onSave(nextValue);
    };

    if (draft !== null) {
        return (
            <>
                <textarea
                    autoFocus
                    rows={6}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            e.stopPropagation();
                            setDraft(null);
                        }
                    }}
                    className="w-full resize-y rounded-md border border-blue-500 bg-white p-2 text-sm leading-relaxed text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:border-blue-400 dark:bg-neutral-900 dark:text-gray-200"
                />
                <div className="mt-1.5 flex gap-2">
                    <Button size="sm" color="primary" disabled={isPending} onClick={save}>
                        Зберегти
                    </Button>
                    <Button size="sm" color="secondary" onClick={() => setDraft(null)}>
                        Скасувати
                    </Button>
                </div>
            </>
        );
    }

    return (
        <p onClick={canEdit ? () => setDraft(value || "") : undefined}
           title={canEdit ? "Натисніть, щоб змінити опис" : undefined}
           className={`whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 ${canEdit ? "group cursor-text rounded-md px-1 -mx-1 transition hover:bg-gray-100 dark:hover:bg-neutral-700/60" : ""}`}>
            {isPending && <Spinner className="mr-1.5 inline-block h-3 w-3"/>}
            {value || (canEdit ? placeholder : "—")}
            {canEdit &&
                <i className="fa-regular fa-pen ml-1.5 align-middle text-[10px] text-gray-500 opacity-0 transition group-hover:opacity-100 dark:text-gray-500"></i>
            }
        </p>
    );
};

export default InlineDescriptionField;
