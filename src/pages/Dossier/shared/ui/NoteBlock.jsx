import {useState} from "react";
// Клікабельна примітка (профілю чи звʼязку): показує поточний текст/плейсхолдер,
// клік → textarea з явними Зберегти/Скасувати (Escape теж скасовує) — той самий
// патерн, що й InlineDescriptionField у Task-модулі, самостійна копія тут (Dossier
// не імпортує з ReactPages/Task, окремі домени). Спільне поле для всіх користувачів,
// без прив'язки до автора.
const NoteBlock = ({value, onSave, isPending = false, canEdit = true, placeholder = "Додати примітку…", label = "Примітка"}) => {
    const [draft, setDraft] = useState(null);

    const save = () => {
        const next = draft ?? "";
        setDraft(null);
        if ((value || "") === next) return;
        onSave(next);
    };

    if (draft !== null) {
        return (
            <div className="mt-3">
                <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{label}</p>
                <textarea
                    autoFocus
                    rows={3}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            e.stopPropagation();
                            setDraft(null);
                        }
                    }}
                    className="w-full resize-y rounded-md border border-blue-300 bg-white p-2 text-[12.5px] leading-relaxed text-gray-800 outline-none focus:border-blue-500 dark:border-blue-700 dark:bg-neutral-900 dark:text-gray-200"
                />
                <div className="mt-1.5 flex gap-2">
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={save}
                        className="h-[26px] rounded-md bg-green-600 px-3 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                        Зберегти
                    </button>
                    <button
                        type="button"
                        onClick={() => setDraft(null)}
                        className="h-[26px] rounded-md border border-gray-300 px-3 text-[11px] font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300"
                    >
                        Скасувати
                    </button>
                </div>
            </div>
        );
    }

    if (!canEdit && !value) {
        return null;
    }

    return (
        <div data-i-doc="component:sanction-profiles-note-block" className="mt-3">
            <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{label}</p>
            <p
                onClick={canEdit ? () => setDraft(value || "") : undefined}
                title={canEdit ? "Натисніть, щоб змінити примітку" : undefined}
                className={`whitespace-pre-wrap text-[12.5px] leading-relaxed text-gray-700 dark:text-gray-300 ${canEdit ? "group cursor-text rounded-md px-1 -mx-1 transition hover:bg-gray-100 dark:hover:bg-neutral-700/60" : ""}`}
            >
                {value || (canEdit ? placeholder : "—")}
                {canEdit &&
                    <i className="fa-regular fa-pen ml-1.5 align-middle text-[10px] text-gray-500 opacity-0 transition group-hover:opacity-100 dark:text-gray-500"></i>
                }
            </p>
        </div>
    );
};

export default NoteBlock;
