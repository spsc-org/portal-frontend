import {useState} from "react";
import {Spinner} from "@material-tailwind/react";

/**
 * Клікабельна назва задачі (h3): клік → textarea, Enter (без Shift) або
 * blur — зберегти, Escape — скасувати. Спільний для TaskViewPanel і
 * CreateTaskModal.
 */
const InlineTitleField = ({value, onSave, isPending = false, canEdit = true, placeholder = "Без назви…"}) => {
    const [draft, setDraft] = useState(null);

    const save = () => {
        const nextValue = (draft ?? "").trim();
        setDraft(null);
        if (nextValue === (value || "")) return;
        onSave(nextValue);
    };

    if (draft !== null) {
        return (
            <textarea
                autoFocus
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        save();
                    }
                    if (e.key === 'Escape') {
                        // не даємо Esc долетіти до вікна — там він закриває панель/модалку
                        e.stopPropagation();
                        setDraft(null);
                    }
                }}
                className="mt-2 w-full resize-none rounded-md border border-blue-300 bg-white p-1.5 text-base font-semibold leading-snug text-gray-900 focus:outline-none dark:border-blue-700 dark:bg-neutral-900 dark:text-gray-100"
            />
        );
    }

    return (
        <h3 onClick={canEdit ? () => setDraft(value || "") : undefined}
            title={canEdit ? "Натисніть, щоб змінити назву" : undefined}
            className={`mt-2 text-base font-semibold leading-snug text-gray-900 dark:text-gray-100 ${canEdit ? "group cursor-text rounded-md px-1 -mx-1 transition hover:bg-gray-100 dark:hover:bg-neutral-700/60" : ""}`}>
            {isPending && <Spinner className="mr-1.5 inline-block h-3 w-3"/>}
            {value || placeholder}
            {canEdit &&
                <i className="fa-regular fa-pen ml-1.5 align-middle text-[10px] text-gray-500 opacity-0 transition group-hover:opacity-100 dark:text-gray-500"></i>
            }
        </h3>
    );
};

export default InlineTitleField;
