/* eslint-disable react-refresh/only-export-components -- реєстр презентерів комірок (об'єкт колонка → компонент) */
import FlagSanctionBadge from "../atoms/FlagSanctionBadge.jsx";

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

const DecreeRenderer = ({ row, highlightText, filters }) => {
    const datasetId  = row.original.datasetId;
    const originalData = row.original.original_data || {};

    return (
        <FlagSanctionBadge
            datasetId={datasetId}
            originalData={originalData}
            highlightText={highlightText}
            filters={filters}
        />
    );
};

export default {
    default:     DefaultRenderer,
    captions:    DefaultRenderer,
    identifiers: DefaultRenderer,
    decree:      DecreeRenderer,
    other:       DefaultRenderer,
};
