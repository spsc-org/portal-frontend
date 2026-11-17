
/**
 * Кнопка "Скинути всі фільтри" панелі фільтрів — спільний атомарний стиль
 * (активна/неактивна залежно від наявності активних фільтрів), щоб не
 * дублювати className-рядки в кожній сторінці окремо (Task/Announcement/DeveloperPost).
 */
const ChipResetButton = ({onClick, hasActive, label, title}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={!hasActive}
        title={title || (hasActive ? "Скинути всі фільтри" : "Немає активних фільтрів")}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${hasActive
            ? "border-red-200 bg-white text-red-500 hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
            : "cursor-default border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-600"}`}
    >
        <i className="fa-regular fa-filter-slash text-[10px]"></i>
        {label}
    </button>
);

export default ChipResetButton;
