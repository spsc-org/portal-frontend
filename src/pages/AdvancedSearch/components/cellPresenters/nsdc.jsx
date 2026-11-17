/* eslint-disable react-refresh/only-export-components -- реєстр презентерів комірок (об'єкт колонка → компонент) */
import DecreeBadge from "../atoms/DecreeBadge.jsx";
import ExpiryDateBadge from "../atoms/ExpiryDateBadge.jsx";

// Кольори для типів дій РНБО
const ACTION_TYPE_CONFIG = {
    'застосування санкцій': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'зміна санкцій':        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'скасування санкцій':   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'зупинення санкцій':    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const getActionTypeClass = (actionType) => {
    if (!actionType) return 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400';
    const key = actionType.toLowerCase();
    for (const [pattern, cls] of Object.entries(ACTION_TYPE_CONFIG)) {
        if (key.includes(pattern)) return cls;
    }
    return 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400';
};

const DefaultRenderer = ({ value, highlightText, filters, columnId }) => {
    if (!value) return <span className="text-gray-400 dark:text-slate-500">----</span>;

    let displayedValue = value;
    if (columnId !== 'other' && value.length > 500) {
        displayedValue = value.substring(0, 500) + '...';
    }

    return (
        <div className="whitespace-pre-wrap dark:text-slate-300">
            {highlightText(displayedValue, filters.search)}
        </div>
    );
};

// Кастомний рендер колонки "Ідентифікатори" для NSDC датасетів
const IdentifiersRenderer = ({ row, highlightText, filters }) => {
    const od = row.original.original_data || {};

    const groups = [
        { field: 'identity_docs', icon: 'fa-regular fa-id-card',      color: 'text-gray-500 dark:text-slate-400' },
        { field: 'reg_id',        icon: 'fa-solid fa-building',        color: 'text-blue-600 dark:text-blue-400' },
        { field: 'tax_id',        icon: 'fa-solid fa-sack-dollar',     color: 'text-green-600 dark:text-green-400' },
    ];

    const items = [];
    for (const { field, icon, color } of groups) {
        const raw = od[field];
        if (!raw) continue;
        // Поле може містити кілька значень через кому
        const parts = String(raw).split(',').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
            items.push({ text: part, icon, color });
        }
    }

    if (items.length === 0) return <span className="text-gray-400 dark:text-slate-500">----</span>;

    return (
        <div className="flex flex-col gap-1 text-xs">
            {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                    <i className={`${item.icon} mt-0.5 text-[10px] flex-shrink-0 ${item.color}`}></i>
                    <span className="leading-tight text-gray-800 dark:text-slate-200">
                        {highlightText(item.text, filters.search)}
                    </span>
                </div>
            ))}
        </div>
    );
};

// Кастомний рендер колонки "Указ / Рішення" для NSDC датасетів
const DecreeRenderer = ({ row, highlightText, filters }) => {
    const od = row.original.original_data || {};

    // Sanc datasets (20, 21, 24): last_action_decree + status + sanctions_end_date
    // Action datasets (22, 23, 25): action_type + decree + sanctions_end_date

    const decreeNumber  = od.last_action_decree || od.decree || null;
    const endDate       = od.sanctions_end_date || null;
    const status        = od.status || null;
    const actionType    = od.action_type || null;

    if (!decreeNumber && !endDate && !status && !actionType) {
        return <span className="text-gray-400 dark:text-slate-500">----</span>;
    }

    return (
        <div className="flex flex-col gap-1 text-xs">
            {/* Тип дії (для action датасетів) */}
            {actionType && (
                <span className={`inline-flex w-fit text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getActionTypeClass(actionType)}`}>
                    {actionType}
                </span>
            )}

            {/* Номер указу */}
            {decreeNumber && (
                <DecreeBadge
                    code={decreeNumber}
                    highlightText={highlightText}
                    filters={filters}
                />
            )}

            {/* Статус (для sanc датасетів) */}
            {status && (
                <span className="inline-flex w-fit text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300">
                    {status}
                </span>
            )}

            {/* Дата закінчення санкцій */}
            {endDate && (
                <ExpiryDateBadge
                    date={endDate}
                    highlightText={highlightText}
                    filters={filters}
                    label="До:"
                />
            )}
        </div>
    );
};

export default {
    default:     DefaultRenderer,
    captions:    DefaultRenderer,
    identifiers: IdentifiersRenderer,
    decree:      DecreeRenderer,
    other:       DefaultRenderer,
};
