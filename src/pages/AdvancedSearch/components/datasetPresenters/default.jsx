import React, {useState} from 'react';
import {Typography} from "@material-tailwind/react";

const SERVICE_KEYS = new Set([
    'id', 'dataset_name', 'dataset_id', 'datasetId', 'typeId', 'subjectTypeId',
    'full_name_data', 'establishment_data', 'precomputedData',
    'captions', 'identifiers', 'decree', 'other', 'country',
    'actions', 'weight',
]);

const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Так' : 'Ні';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const isEmpty = (value) => value === null || value === undefined || value === '';

const DefaultDatasetPresenter = ({record}) => {
    const [hideEmpty, setHideEmpty] = useState(true);

    if (!record) return null;

    const extraEntries = Object.entries(record)
        .filter(([key]) => !SERVICE_KEYS.has(key))
        .filter(([, value]) => !hideEmpty || !isEmpty(value));

    return (
        <div className="space-y-4">
            {record.full_name_data && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <Typography variant="h6" className="dark:text-slate-200 mb-2 text-sm font-bold uppercase tracking-wider">
                        Повна назва/дані
                    </Typography>
                    <Typography className="dark:text-slate-300 text-sm whitespace-pre-wrap">
                        {record.full_name_data}
                    </Typography>
                </div>
            )}

            {record.establishment_data && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <Typography variant="h6" className="dark:text-slate-200 mb-2 text-sm font-bold uppercase tracking-wider">
                        Дані установи
                    </Typography>
                    <Typography className="dark:text-slate-300 text-sm whitespace-pre-wrap">
                        {record.establishment_data}
                    </Typography>
                </div>
            )}

            {extraEntries.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-700/30 p-3 rounded border border-gray-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                        <Typography variant="h6" className="dark:text-slate-200 text-sm font-bold uppercase tracking-wider">
                            Деталі
                        </Typography>
                        <button
                            onClick={() => setHideEmpty(v => !v)}
                            className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                            title={hideEmpty ? 'Показати порожні поля' : 'Сховати порожні поля'}
                        >
                            <i className={`ti ${hideEmpty ? 'ti-eye' : 'ti-eye-off'} text-sm`}></i>
                            {hideEmpty ? 'Показати порожні' : 'Сховати порожні'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-sm">
                        {extraEntries.map(([key, value]) => (
                            <div key={key} className="flex flex-col sm:flex-row sm:gap-2 border-b border-gray-100 dark:border-slate-600 last:border-0 py-1 last:pb-0">
                                <span className="font-semibold text-gray-500 dark:text-slate-400 w-full sm:w-1/3 break-words">{key}:</span>
                                <span className={`w-full sm:w-2/3 break-words ${isEmpty(value) ? 'text-gray-300 dark:text-slate-600 italic' : 'text-gray-900 dark:text-slate-200'}`}>
                                    {formatValue(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DefaultDatasetPresenter;
