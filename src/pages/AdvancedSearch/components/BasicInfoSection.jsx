import {Tooltip} from "@material-tailwind/react";

// Хелпери розмітки — на рівні модуля (не створюються заново в кожному рендері).
// Helper для елемента інформації
const InfoItem = ({label, children, className = ""}) => (
    <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">{label}:</span>
        <span className="text-gray-900 dark:text-slate-200 text-sm font-medium">{children}</span>
    </div>
);


const BasicInfoSection = ({record, type, dataset, group, typeId, datasetId}) => {

    return (
        <div className="bg-gray-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 flex flex-wrap gap-x-6 gap-y-2 items-center">
            {/* ID */}
            <InfoItem label="ID">
                <span className="font-mono text-blue-gray-800 dark:text-slate-300">{record.id}</span>
            </InfoItem>

            {/* Type */}
            <InfoItem label="Тип">
                {type ? (
                    <span className="inline-flex items-center gap-1.5">
                        {type.icon && <i className={`${type.icon} text-blue-500 dark:text-blue-400`}></i>}
                        <span>{type.caption}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">({typeId})</span>
                    </span>
                ) : (
                    <span>{typeId || 'N/A'}</span>
                )}
            </InfoItem>

            {/* Dataset */}
            <InfoItem label="Датасет">
                {dataset ? (
                    <Tooltip content={dataset.caption} placement="bottom">
                        <span className="cursor-help border-b border-dashed border-gray-400 dark:border-slate-500 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {dataset.code || dataset.caption}
                        </span>
                    </Tooltip>
                ) : (
                    <span>{record.dataset_name || 'N/A'}</span>
                )}
            </InfoItem>

            {/* Group */}
            {group && (
                <InfoItem label="Група">
                    <span>{group.caption}</span>
                </InfoItem>
            )}

            {/* Dataset ID */}
            <InfoItem label="DS ID">
                <span className="font-mono text-gray-600 dark:text-slate-400">{datasetId || 'N/A'}</span>
            </InfoItem>
        </div>
    );
};

export default BasicInfoSection;
