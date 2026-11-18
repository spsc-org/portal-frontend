import { observer } from "mobx-react-lite";
import React from 'react';
import { Chip, Tooltip } from "@material-tailwind/react"
import IconButton from "../../../../components/Buttons/IconButton.jsx"
import { convertDate } from "../../../../lib/utils.js";
import { PaginationFooter, StatusChip } from "../ImportLogShared.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TD_EMPTY, TH, TR } from "../../../../components/Table/tableStyles.js";

const STATUS_LABELS = { success: 'Успішно', failed: 'Помилка', partial: 'Частково' };
const TYPE_LABELS = { sanctions: 'Списки', details: 'Деталі' };

const DetailsSummary = ({ summary }) => (
    <div className="flex flex-wrap gap-4 py-1 text-xs text-gray-600 dark:text-gray-400">
        <span>було: {summary.previousCount}</span>
        <span>залито: {summary.importedCount}</span>
        <span className="text-green-600">+{summary.addedCount}</span>
        <span className="text-red-500">-{summary.removedCount}</span>
        <span>без змін: {summary.unchangedCount}</span>
        <span>дублів у файлі: {summary.duplicatesInSource}</span>
        {summary.invalidRows > 0 && (
            <span className="text-amber-700 dark:text-amber-400">пропущено невалідних: {summary.invalidRows}</span>
        )}
    </div>
);

const SanctionsSummary = ({ summary }) => (
    <table className={twMerge(TABLE, "w-full")}>
        <tbody>
            {Object.entries(summary).map(([sheet, s]) => (
                <tr key={sheet} className={TR}>
                    <td className={TD}>{sheet}</td>
                    {s.recognized ? (
                        <>
                            <td className={TD}>залито: {s.imported}</td>
                            <td className={TD}>було: {s.previousCount}</td>
                            <td className={twMerge(TD, "text-green-600")}>+{s.addedCount}</td>
                            <td className={twMerge(TD, "text-red-500")}>-{s.removedCount}</td>
                            <td className={TD}>без змін: {s.unchangedCount}</td>
                            <td className={TD}>дублів у файлі: {s.duplicatesInSource}</td>
                        </>
                    ) : (
                        <td className={TD} colSpan={6}>вкладка не розпізнана</td>
                    )}
                </tr>
            ))}
        </tbody>
    </table>
);

/** list — PagedListViewModel спільного журналу (списки + деталі). */
const VesselImoLogTable = ({ list }) => {
    const { page, setPage } = list;
    const expandedId = list.expandedId;
    const setExpandedId = list.setExpanded;
    const isFetching = list.query.isFetching;
    const logs = list.rows;
    const meta = list.meta;

    return (
        <div className="mt-6 bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Журнал імпортів</h2>
            <div className={TABLE_WRAP}>
                <table className={twMerge(TABLE, "w-full min-w-max table-auto text-left")}>
                    <thead>
                        <tr>
                            {['Тип', 'Файл', 'Користувач', 'Початок', 'Тривалість', 'Статус', ''].map((label) => (
                                <th key={label} className={TH}>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => {
                            const durationSec = log.finishedAt
                                ? Math.round((new Date(log.finishedAt) - new Date(log.startedAt)) / 1000)
                                : null;
                            return (
                                <React.Fragment key={log.id}>
                                    <tr className={TR}>
                                        <td className={TD}>
                                            <Chip
                                                size="sm"
                                                variant="ghost"
                                                color={log.type === 'details' ? 'purple' : 'blue'}
                                                value={TYPE_LABELS[log.type] ?? log.type}
                                            />
                                        </td>
                                        <td className={TD}>
                                            <div>{log.originalFilename || '—'}</div>
                                        </td>
                                        <td className={TD}>
                                            <div>{log.userName || 'N/A'}</div>
                                        </td>
                                        <td className={TD}>
                                            <div>{convertDate(log.startedAt)}</div>
                                        </td>
                                        <td className={TD}>
                                            <div>
                                                {durationSec !== null ? `${durationSec} с` : '—'}
                                            </div>
                                        </td>
                                        <td className={TD}>
                                            <StatusChip
                                                status={log.status}
                                                status_label={STATUS_LABELS[log.status] ?? log.status}
                                                error_message={log.errorMessage}
                                            />
                                        </td>
                                        <td className={TD}>
                                            {log.summary && (
                                                <Tooltip content="Деталі імпорту">
                                                    <IconButton
                                                        variant="text"
                                                        size="sm"
                                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                                       
                                                    >
                                                        <i className={`fa-solid fa-chevron-${expandedId === log.id ? 'up' : 'down'}`} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedId === log.id && log.summary && (
                                        <tr className={TR}>
                                            <td colSpan={7} className={TD}>
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
                            <tr className={TR}>
                                <td colSpan={7} className={TD_EMPTY}>
                                    Імпортів ще не було
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <PaginationFooter
                pagination={meta && { current_page: meta.page, last_page: meta.pages, total: meta.total }}
                page={page}
                onPageChange={setPage}
            />
        </div>
    );
};

export default observer(VesselImoLogTable);
