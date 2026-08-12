import React from 'react';
import DecreeBadge from "../atoms/DecreeBadge.jsx";
import ExpiryDateBadge from "../atoms/ExpiryDateBadge.jsx";

// Стандартний рендер для текстових полів
const DefaultRenderer = ({ value, highlightText, filters, columnId }) => {
    if (!value) return <span className="text-gray-400 dark:text-slate-500">----</span>;

    // Для довгих текстів обрізаємо (крім 'other', там може бути багато важливого)
    // Збільшено ліміт до 500 символів
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

// Кастомний рендер для указу (Dataset #3)
const DecreeRenderer = ({ row, highlightText, filters }) => {
    const originalData = row.original.original_data || {};
    const decreeNumber = originalData.decree_number;
    const thematicPackage = originalData.thematic_package;
    const expiryDate = originalData.expiry_date;

    if (!decreeNumber && !thematicPackage && !expiryDate) {
        return <span className="text-gray-400 dark:text-slate-500">----</span>;
    }

    return (
        <div className="flex flex-col gap-1.5 text-xs">
            {/* Указ з молотком */}
            {decreeNumber && (
                <DecreeBadge
                    code={decreeNumber}
                    highlightText={highlightText}
                    filters={filters}
                />
            )}

            {/* Тематичний пакет */}
            {thematicPackage && (
                <div className="text-gray-700 dark:text-slate-300 leading-tight">
                    {highlightText(thematicPackage, filters.search)}
                </div>
            )}

            {/* Дата закінчення */}
            {expiryDate && (
                <ExpiryDateBadge
                    date={expiryDate}
                    highlightText={highlightText}
                    filters={filters}
                    label="До:"
                />
            )}
        </div>
    );
};

// Дефолтні презентери комірок
export default {
    default: DefaultRenderer,
    captions: DefaultRenderer,
    identifiers: DefaultRenderer,
    decree: DecreeRenderer, // Використовуємо кастомний рендер
    other: DefaultRenderer,
};
