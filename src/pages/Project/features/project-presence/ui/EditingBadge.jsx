
// View: бейдж "Редагує" у рядку списку. Колір — warning (amber), як і в легасі-бейджі:
// "хтось інший зараз змінює цей запис", не помилка й не блокування.
const EditingBadge = ({ editors }) => {
    if (editors.length === 0) return null;
    const names = editors.map((editor) => editor.name).join(", ");

    return (
        <div
            title={`Редагує зараз: ${names}`}
            className="mb-1 flex flex-col gap-0.5 rounded-md border border-amber-400 bg-amber-50 px-1.5 py-1 text-[11px] leading-tight text-amber-700 dark:border-amber-400/60 dark:bg-amber-900/40 dark:text-amber-300"
        >
            <span className="flex items-center gap-1 font-semibold">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
                Редагує
            </span>
            {editors.map((editor) => (
                <span key={editor.id} className="flex items-center gap-1 truncate">
                    <i className="fa-solid fa-user-pen text-[10px]" aria-hidden="true" />
                    {editor.name}
                </span>
            ))}
        </div>
    );
};

export default EditingBadge;
