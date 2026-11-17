import {useState} from "react";
import {Button, Spinner} from "@material-tailwind/react";

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
                    className="w-full resize-y rounded-md border border-blue-300 bg-white p-2 text-sm leading-relaxed text-slate-700 focus:outline-none dark:border-blue-700 dark:bg-slate-800 dark:text-slate-300"
                />
                <div className="mt-1.5 flex gap-2">
                    <Button size="sm" color="green" className="py-1.5 px-3" disabled={isPending} onClick={save}>
                        Зберегти
                    </Button>
                    <Button size="sm" variant="text" color="blue-gray" className="py-1.5 px-3" onClick={() => setDraft(null)}>
                        Скасувати
                    </Button>
                </div>
            </>
        );
    }

    return (
        <p onClick={canEdit ? () => setDraft(value || "") : undefined}
           title={canEdit ? "Натисніть, щоб змінити опис" : undefined}
           className={`whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${canEdit ? "group cursor-text rounded-md px-1 -mx-1 transition hover:bg-slate-100 dark:hover:bg-slate-800/60" : ""}`}>
            {isPending && <Spinner className="mr-1.5 inline-block h-3 w-3"/>}
            {value || (canEdit ? placeholder : "—")}
            {canEdit &&
                <i className="fa-regular fa-pen ml-1.5 align-middle text-[10px] text-slate-400 opacity-0 transition group-hover:opacity-100 dark:text-slate-500"></i>
            }
        </p>
    );
};

export default InlineDescriptionField;
