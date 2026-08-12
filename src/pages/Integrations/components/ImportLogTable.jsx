import React, { useEffect, useState } from 'react';
import {
    Card,
    IconButton,
    Input,
    Spinner,
    Tooltip,
    Typography,
} from "@material-tailwind/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useDialog } from "@/hooks/useDialog.js";
import ImportLogDetailsDialog from "./ImportLogDetailsDialog.jsx";
import { convertDate } from "../../../utils.js";
import { formatBytes, formatDuration, getImportTypeIcon, PaginationFooter, StatusChip } from "./ImportLogShared.jsx";

const COLUMNS = ['', 'Датасет', 'Статус', 'Користувач', 'Дата', 'Тривалість', 'Записи', 'Файл', 'Розмір', ''];

const fetchImportLogs = async ({ queryKey }) => {
    const [, { page, limit, search }] = queryKey;
    const { data } = await axios.get('/api/consolidated-data/import/logs', { // Оновлено URL
        params: { page, per_page: limit, search },
    });
    return data;
};

const ImportLogTable = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 15;

    const {
        open: detailsOpen,
        handleOpen: handleOpenDetails,
        handleClose: handleCloseDetails,
        dialogProps: detailsDialogProps,
    } = useDialog();

    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(id);
    }, [search]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const { data: logData, isLoading, isError, error } = useQuery({
        queryKey: ['importLogs', { page, limit, search: debouncedSearch }],
        queryFn: fetchImportLogs,
        keepPreviousData: true,
    });

    const logs = logData?.data ?? [];
    const pagination = logData?.pagination;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 dark:text-slate-200">Журнал імпорту</h2>

            <div className="w-full md:w-72 mb-4">
                <Input
                    label="Пошук по назві датасету або помилці"
                    icon={<i className="fa-solid fa-magnifying-glass" />}
                    value={search}
                    onChange={handleSearchChange}
                    className="dark:text-white"
                    labelProps={{
                        className: "dark:!text-slate-400 dark:peer-focus:!text-blue-300",
                    }}
                />
            </div>

            <Card className="w-full overflow-auto dark:bg-slate-800 shadow-none">
                {isLoading && !logData ? (
                    <div className="flex justify-center items-center h-48">
                        <Spinner className="h-12 w-12" />
                    </div>
                ) : isError ? (
                    <p className="p-4 text-red-500">
                        Помилка завантаження логів: {error.message}
                    </p>
                ) : (
                    <table className="w-full table-auto text-left">
                        <thead>
                            <tr>
                                {COLUMNS.map((head, i) => (
                                    <th key={i} className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 p-3">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-slate-400">
                                            {head}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => {
                                const isLast = index === logs.length - 1;
                                const classes = isLast ? 'p-3' : 'p-3 border-b border-blue-gray-50 dark:border-slate-700';

                                return (
                                    <tr key={log.id} className="even:bg-blue-gray-50/50 dark:even:bg-slate-700/30 hover:bg-blue-gray-50 dark:hover:bg-slate-700/50">
                                        <td className={classes}>{getImportTypeIcon(log.import_type)}</td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
                                                {log.dataset_name}
                                            </Typography>
                                        </td>
                                        <td className={classes}><StatusChip {...log} /></td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
                                                {log.user?.name || 'Система'}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
                                                {convertDate(log.started_at)}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
                                                {formatDuration(log.duration_seconds)}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Tooltip content={`До: ${log.records_before}, Після: ${log.records_after}, Різниця: ${log.records_difference}`}>
                                                <Typography variant="small" color="blue-gray" className="font-normal cursor-help dark:text-slate-300">
                                                    {`${log.records_processed} / ${log.records_processed + (log.records_failed || 0)}`}
                                                </Typography>
                                            </Tooltip>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
                                                {log.file_name || 'N/A'}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
                                                {formatBytes(log.file_size) || 'N/A'}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Tooltip content="Детальна інформація">
                                                <IconButton variant="text" size="sm" onClick={() => handleOpenDetails({ logId: log.id })} className="dark:text-slate-400 dark:hover:text-slate-200">
                                                    <i className="fa-solid fa-circle-info text-lg text-blue-gray-500 dark:text-slate-400" />
                                                </IconButton>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </Card>

            <PaginationFooter pagination={pagination} page={page} onPageChange={setPage} />

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

export default ImportLogTable;
