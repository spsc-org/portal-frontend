import React from "react";

// Рядок мета-блоку (іконка + лейбл + значення) — спільний каркас для
// Inline*Field компонентів задач, картки тікетів і сторінки налаштувань.
const MetaRow = ({icon, label, children, valueClassName = ""}) => (
    <div className="flex items-start gap-2.5 py-1.5">
        <i className={`${icon} w-4 pt-0.5 text-center text-slate-400 dark:text-slate-500 text-xs`}></i>
        <span className="w-24 shrink-0 text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`flex-1 text-xs font-medium text-slate-800 dark:text-slate-200 min-w-0 ${valueClassName}`}>
            {children || "—"}
        </div>
    </div>
);

export default MetaRow;
