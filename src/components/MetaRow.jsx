
// Рядок мета-блоку (іконка + лейбл + значення) — спільний каркас для
// Inline*Field компонентів задач, картки тікетів і сторінки налаштувань.
const MetaRow = ({icon, label, children, valueClassName = ""}) => (
    <div className="flex items-start gap-2.5 py-1.5">
        <i className={`${icon} w-4 pt-0.5 text-center text-gray-600 dark:text-gray-500 text-xs`}></i>
        <span className="w-24 shrink-0 text-xs text-gray-600 dark:text-gray-400">{label}</span>
        <div className={`flex-1 text-xs font-medium text-gray-800 dark:text-gray-200 min-w-0 ${valueClassName}`}>
            {children || "—"}
        </div>
    </div>
);

export default MetaRow;
