import React, { useState } from 'react';
import { Card, Chip, Typography, IconButton, Tooltip } from "@material-tailwind/react";
import { convertDate } from "../../../../utils.js";
import { StatusChip } from "../ImportLogShared.jsx";
import { useVesselImoLogsQuery } from "../../entities/vesselImo/queries.js";

const STATUS_LABELS = { success: 'Успішно', failed: 'Помилка', partial: 'Частково' };
const TYPE_LABELS = { sanctions: 'Списки', details: 'Деталі' };

const DetailsSummary = ({ summary }) => (
    <div className="flex flex-wrap gap-4 text-xs dark:text-slate-400 py-1">
        <span>було: {summary.previousCount}</span>
        <span>залито: {summary.importedCount}</span>
        <span className="text-green-600">+{summary.addedCount}</span>
        <span className="text-red-500">-{summary.removedCount}</span>
        <span>без змін: {summary.unchangedCount}</span>
        <span>дублів у файлі: {summary.duplicatesInSource}</span>
        {summary.invalidRows > 0 && (
            <span className="text-amber-500">пропущено невалідних: {summary.invalidRows}</span>
        )}
    </div>
);

const SanctionsSummary = ({ summary }) => (
    <table className="w-full text-xs">
        <tbody>
            {Object.entries(summary).map(([sheet, s]) => (
                <tr key={sheet} className="dark:text-slate-400">
                    <td className="pr-4">{sheet}</td>
                    {s.recognized ? (
                        <>
                            <td className="pr-4">залито: {s.imported}</td>
                            <td className="pr-4">було: {s.previousCount}</td>
                            <td className="pr-4 text-green-600">+{s.addedCount}</td>
                            <td className="pr-4 text-red-500">-{s.removedCount}</td>
                            <td className="pr-4">без змін: {s.unchangedCount}</td>
                            <td className="pr-4">дублів у файлі: {s.duplicatesInSource}</td>
                        </>
                    ) : (
                        <td className="pr-4" colSpan={6}>вкладка не розпізнана</td>
                    )}
                </tr>
            ))}
        </tbody>
    </table>
);

const VesselImoLogTable = () => {
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState(null);

    const { data, isFetching } = useVesselImoLogsQuery(page, 15);

    const logs = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 dark:text-slate-200">Журнал імпортів</h2>
            <Card className="w-full overflow-auto dark:bg-slate-800 shadow-none">
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr>
                            {['Тип', 'Файл', 'Користувач', 'Початок', 'Тривалість', 'Статус', ''].map((label) => (
                                <th key={label} className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 py-2 px-2">
                                    <Typography variant="small" className="font-normal opacity-70 dark:text-slate-400">{label}</Typography>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, index) => {
                            const classes = index === logs.length - 1 ? 'py-2 px-2' : 'py-2 px-2 border-b border-blue-gray-50 dark:border-slate-700';
                            const durationSec = log.finishedAt
                                ? Math.round((new Date(log.finishedAt) - new Date(log.startedAt)) / 1000)
                                : null;
                            return (
                                <React.Fragment key={log.id}>
                                    <tr className="even:bg-blue-gray-50/50 dark:even:bg-slate-700/30 hover:bg-blue-gray-50 dark:hover:bg-slate-700/50">
                                        <td className={classes}>
                                            <Chip
                                                size="sm"
                                                variant="ghost"
                                                color={log.type === 'details' ? 'purple' : 'blue'}
                                                value={TYPE_LABELS[log.type] ?? log.type}
                                            />
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" className="dark:text-slate-300">{log.originalFilename || '—'}</Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" className="dark:text-slate-300">{log.userName || 'N/A'}</Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" className="dark:text-slate-300">{convertDate(log.startedAt)}</Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" className="dark:text-slate-300">
                                                {durationSec !== null ? `${durationSec} с` : '—'}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <StatusChip
                                                status={log.status}
                                                status_label={STATUS_LABELS[log.status] ?? log.status}
                                                error_message={log.errorMessage}
                                            />
                                        </td>
                                        <td className={classes}>
                                            {log.summary && (
                                                <Tooltip content="Деталі імпорту">
                                                    <IconButton
                                                        variant="text"
                                                        size="sm"
                                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                                        className="dark:text-slate-400"
                                                    >
                                                        <i className={`fa-solid fa-chevron-${expandedId === log.id ? 'up' : 'down'}`} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedId === log.id && log.summary && (
                                        <tr>
                                            <td colSpan={7} className="p-2 bg-blue-gray-50/50 dark:bg-slate-900">
                                                {log.type === 'details'
                                                    ? <DetailsSummary summary={log.summary} />
                                                    : <SanctionsSummary summary={log.summary} />}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {!isFetching && logs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-4 text-gray-400 dark:text-slate-500">
                                    Імпортів ще не було
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
            {meta && meta.pages > 1 && (
                <div className="flex items-center justify-between border-t border-blue-gray-50 dark:border-slate-700 pt-4 mt-4">
                    <span className="text-sm text-blue-gray-600 dark:text-slate-400">
                        Сторінка {meta.page} з {meta.pages} (Всього: {meta.total})
                    </span>
                    <div className="flex gap-2">
                        <button
                            className="text-sm px-3 py-1 border border-blue-gray-300 dark:border-slate-600 rounded disabled:opacity-40 dark:text-slate-300"
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page === 1}
                        >
                            Попередня
                        </button>
                        <button
                            className="text-sm px-3 py-1 border border-blue-gray-300 dark:border-slate-600 rounded disabled:opacity-40 dark:text-slate-300"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page === meta.pages}
                        >
                            Наступна
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VesselImoLogTable;
