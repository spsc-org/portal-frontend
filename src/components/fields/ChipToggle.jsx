
import {chipToggleClassName} from "./chipToggleStyles.js";

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
