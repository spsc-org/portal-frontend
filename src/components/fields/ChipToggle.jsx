
const BASE = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition";
const IDLE = "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100";
const ACTIVE = {
    blue: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    amber: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    green: "border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/40 dark:text-green-300",
};

// Спільний className чип-кнопки (панелі фільтрів Task/Announcement/DeveloperPost) —
// експортується окремо для кнопок, які не вписуються в ChipToggle 1:1 (напр. з меню/іконкою праворуч).
export const chipToggleClassName = (active, color = "blue") => `${BASE} ${active ? ACTIVE[color] : IDLE}`;

/**
 * Компактна чип-кнопка перемикача фільтра ("лише мої", "непрочитані", групування
 * тощо) — спільний атомарний стиль панелей фільтрів, щоб не дублювати
 * className-рядки в кожній сторінці окремо (раніше — локальні chipBase/chipIdle/
 * chipActiveBlue в TaskFilters.jsx і AnnouncementList.jsx нарізно).
 */
const ChipToggle = ({active, onClick, icon, label, title, color = "blue", type = "button", disabled = false}) => (
    <button
        type={type}
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`${chipToggleClassName(active, color)} disabled:cursor-not-allowed disabled:opacity-50`}
    >
        {icon && <i className={`${icon} text-[10px]`}></i>}
        {label}
    </button>
);

export default ChipToggle;
