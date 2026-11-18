// Portal UI kit — блоки «підпис — значення» у модалках деталей.
//   DetailSection — заголовок секції (section-label 14px bold) з роздільником border-default
//   DetailItem    — підпис caption-text ink-muted, значення body-text ink-strong; порожнє — «—»
//   DetailGrid    — сітка полів (2 колонки від md)

const isEmpty = (value) => value === null || value === undefined || value === "";

export const DetailSection = ({ title, children, className = "" }) => (
    <section className={className}>
        <h4 className="mb-3 border-b border-gray-200 pb-1.5 text-sm font-bold text-gray-800 dark:border-neutral-700 dark:text-gray-200">{title}</h4>
        {children}
    </section>
);

export const DetailGrid = ({ children, className = "" }) => (
    <div className={`grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2 ${className}`}>{children}</div>
);

export const DetailItem = ({ label, value, children, className = "", empty = "—" }) => (
    <div className={`min-w-0 ${className}`}>
        <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
        <div className="mt-0.5 break-words text-sm text-gray-800 dark:text-gray-200">
            {children ?? (isEmpty(value) ? <span className="text-gray-500 dark:text-gray-500">{empty}</span> : value)}
        </div>
    </div>
);
