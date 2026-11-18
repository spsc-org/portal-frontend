
// svg — ISO 3166-1 alpha-2 код (lowercase), null якщо немає файлу
const DATASET_META = {
    11: { svg: 'us', label: 'OFAC SDN',         refField: 'ofacId',            programField: 'programs' },
    12: { svg: 'us', label: 'OFAC Consolidated', refField: 'ofacId',            programField: 'programs' },
    13: { svg: 'eu', label: 'EU Sanctions',       refField: 'euReferenceNumber', programField: 'programme' },
    14: { svg: 'gb', label: 'UK OFSI',           refField: 'ukSanctionsListRef', programField: 'regimeName' },
    15: { svg: 'ca', label: 'Canada SEMA',       refField: 'referenceId',       programField: 'schedule' },
    16: { svg: 'au', label: 'Australia DFAT',    refField: null,                programField: null },
    26: { svg: 'ch', label: 'Swiss SECO',        refField: 'ssid',              programField: 'sanctions_set_id' },
};

const Flag = ({ svg, label }) => {
    if (svg) {
        return (
            <img
                src={`/flag-svg/${svg}.svg`}
                alt={label}
                className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
            />
        );
    }
    // EU fallback — синій квадратик з зірками (немає svg-файлу)
    return <span className="text-base leading-none">🇪🇺</span>;
};

/**
 * Бейдж для іноземних санкційних датасетів.
 * Показує прапор + системний референс + програму санкцій.
 */
const FlagSanctionBadge = ({ datasetId, originalData = {}, highlightText, filters }) => {
    const meta = DATASET_META[datasetId];
    if (!meta) return null;

    const refValue     = meta.refField     ? originalData[meta.refField]     : null;
    const programValue = meta.programField ? originalData[meta.programField] : null;

    return (
        <div className="flex flex-col gap-1 text-xs">
            {/* Прапор + мітка датасету */}
            <div className="inline-flex items-center gap-1.5 w-fit bg-gray-100 dark:bg-neutral-600 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                <Flag svg={meta.svg} label={meta.label} />
                <span className="font-semibold text-[10px] text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    {meta.label}
                </span>
            </div>

            {/* Системний референс */}
            {refValue && (
                <div className="inline-flex items-center gap-1 w-fit font-mono text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                    <i className="fa-solid fa-hashtag text-[9px]"></i>
                    {highlightText ? highlightText(String(refValue), filters?.search) : String(refValue)}
                </div>
            )}

            {/* Програма / режим санкцій */}
            {programValue && (
                <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">
                    {highlightText ? highlightText(String(programValue), filters?.search) : String(programValue)}
                </div>
            )}
        </div>
    );
};

export default FlagSanctionBadge;
