import React, { useMemo, useState } from 'react';
import { Button, Card, Typography, IconButton, Tooltip } from "@material-tailwind/react";
import { convertDate } from "../../../utils.js";
import ImportDatasetResultDialog from './ImportDatasetResultDialog.jsx';
import { getImportTypeIcon, StatusChip } from "./ImportLogShared.jsx";
import { useDialog } from "@/hooks/useDialog.js";
import ImportLogDetailsDialog from "./ImportLogDetailsDialog.jsx";

const COLUMNS = [
    { key: 'format',               label: 'Формат' },
    { key: 'caption',              label: 'Назва датасету' },
    { key: 'country',              label: 'Країна' },
    { key: 'last_updated_at',      label: 'Останнє оновлення' },
    { key: 'updated_by_name',      label: 'Ким оновлено' },
    { key: 'last_run_record_count', label: 'Кількість записів' },
    { key: 'last_import_status',   label: 'Останній імпорт' },
    { key: null,                   label: 'Дії' },
];

const DatasetTable = ({ datasets = [], onImportClick }) => {
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'caption', direction: 'ascending' });

    const {
        open: detailsOpen,
        handleOpen: handleOpenDetails,
        handleClose: handleCloseDetails,
        dialogProps: detailsDialogProps,
    } = useDialog();

    const sortedDatasets = useMemo(() => {
        if (!sortConfig.key) return datasets;
        return [...datasets].sort((a, b) => {
            const valA = a[sortConfig.key] ?? '';
            const valB = b[sortConfig.key] ?? '';
            const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
            return sortConfig.direction === 'ascending' ? cmp : -cmp;
        });
    }, [datasets, sortConfig]);

    const requestSort = (key) => {
        if (!key) return;
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 dark:text-slate-200">Доступні датасети для імпорту</h2>

            <Card className="w-full overflow-auto dark:bg-slate-800 shadow-none">
                <table className="w-full min-w-max table-auto text-left">
                    <thead className="sticky top-0 z-10">
                        <tr>
                            {COLUMNS.map(({ key, label }) => (
                                <th
                                    key={label}
                                    className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 py-2 px-2 cursor-pointer"
                                    onClick={() => requestSort(key)}
                                >
                                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-slate-400">
                                        {label}{getSortIndicator(key)}
                                    </Typography>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDatasets.map((dataset, index) => {
                            const isLast = index === sortedDatasets.length - 1;
                            const classes = isLast ? 'py-2 px-2' : 'py-2 px-2 border-b border-blue-gray-50 dark:border-slate-700';

                            return (
                                <tr key={dataset.id} className="even:bg-blue-gray-50/50 dark:even:bg-slate-700/30 hover:bg-blue-gray-50 dark:hover:bg-slate-700/50">
                                    <td className={classes}>
                                        <div className="flex items-center gap-2">
                                            {getImportTypeIcon(dataset.format)}
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none dark:text-slate-300">
                                                {dataset.format || '—'}
                                            </Typography>
                                        </div>
                                    </td>
                                    <td className={classes}>
                                        <div className="flex flex-col">
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none dark:text-slate-200">
                                                {dataset.caption || dataset.name || '—'}
                                            </Typography>
                                            {dataset.url && (
                                                <a
                                                    href={dataset.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-500 hover:underline mt-1 truncate max-w-[200px] dark:text-blue-400"
                                                >
                                                    {dataset.url}
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className={classes}>
                                        <div className="flex items-center gap-2">
                                            {dataset.country && (
                                                <img
                                                    src={`/flag-svg/${dataset.country.toLowerCase()}.svg`}
                                                    alt={dataset.country}
                                                    className="h-4 w-6 object-contain border border-blue-gray-50 dark:border-slate-600"
                                                />
                                            )}
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none dark:text-slate-300">
                                                {dataset.country || '—'}
                                            </Typography>
                                        </div>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none dark:text-slate-300">
                                            {convertDate(dataset.last_updated_at) || '—'}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none dark:text-slate-300">
                                            {dataset.updated_by_name || 'N/A'}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none dark:text-slate-300">
                                            {dataset.last_run_record_count ?? '—'}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        {dataset.last_import_log ? (
                                            <div className="flex items-center gap-2">
                                                <StatusChip
                                                    status={dataset.last_import_log.status}
                                                    status_label={dataset.last_import_log.status_label}
                                                    has_warnings={dataset.last_import_log.has_warnings}
                                                    warnings_count={dataset.last_import_log.warnings_count}
                                                    error_message={dataset.last_import_log.error_message}
                                                    onClick={() => handleOpenDetails({ logId: dataset.last_import_log.id })}
                                                />
                                                {!dataset.last_import_log.has_warnings && dataset.last_import_log.status !== 'failed' && (
                                                    <Tooltip content="Деталі останнього імпорту">
                                                        <IconButton
                                                            variant="text"
                                                            size="sm"
                                                            onClick={() => handleOpenDetails({ logId: dataset.last_import_log.id })}
                                                            className="dark:text-slate-400 dark:hover:text-slate-200"
                                                        >
                                                            <i className="fa-solid fa-circle-info text-blue-gray-500 dark:text-slate-400" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        ) : (
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-50 dark:text-slate-500">
                                                -
                                            </Typography>
                                        )}
                                    </td>
                                    <td className={classes}>
                                        <div className="flex gap-x-2">
                                            <Button size="sm" variant="gradient" color="blue" onClick={() => onImportClick(dataset)}>
                                                Імпорт
                                            </Button>
                                            <Button size="sm" variant="outlined" color="blue-gray" onClick={() => setSelectedDataset(dataset)} className="dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-700">
                                                Журнал
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>

            <ImportDatasetResultDialog
                open={!!selectedDataset}
                onClose={() => setSelectedDataset(null)}
                dataset={selectedDataset}
            />

            {detailsOpen && (
                <ImportLogDetailsDialog
                    open={detailsOpen}
                    onClose={handleCloseDetails}
                    logId={detailsDialogProps?.logId}
                />
            )}
        </div>
    );
};

export default DatasetTable;
