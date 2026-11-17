/* eslint-disable react-refresh/only-export-components -- реєстр презентерів комірок (об'єкт колонка → компонент) */

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

// Дефолтні презентери комірок
export default {
    default: DefaultRenderer,
    captions: DefaultRenderer,
    identifiers: DefaultRenderer,
    decree: DefaultRenderer,
    other: DefaultRenderer,
};
