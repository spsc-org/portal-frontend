import React from "react";

// Кнопка-чип "увімкнено/вимкнено" для булевих фільтрів панелі (needs_review, has_avatar тощо) —
// винесено з ProfilesMasterList, де той самий розмітковий блок повторювався двічі.
const ToggleChip = ({active, onClick, icon, label, title, activeClasses, idleClasses, disabled}) => (
    <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        title={title}
        className={`inline-flex items-center gap-1.5 h-[30px] px-[11px] border rounded-full text-xs font-semibold transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${active ? activeClasses : idleClasses}`}
    >
        <i className={`${icon} text-[10px]`}></i>{label}
    </button>
);

export default ToggleChip;
