import { observer } from "mobx-react-lite";
import { Card, Input, Spinner, Tooltip, Typography } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import ImportLogDetailsDialog from "./ImportLogDetailsDialog.jsx";
import { convertDate } from "../../../lib/utils.js";
import { formatBytes, formatDuration, getImportTypeIcon, PaginationFooter, StatusChip } from "./ImportLogShared.jsx";

const COLUMNS = ['', 'Датасет', 'Статус', 'Користувач', 'Дата', 'Тривалість', 'Записи', 'Файл', 'Розмір', ''];


/** list — PagedListViewModel журналу (сторінки, пошук з дебаунсом, деталі). */
const ImportLogTable = ({ list }) => {
    const { page, setPage } = list;
    const logData = list.query.data;
    const { isLoading, isError, error } = list.query;
    const logs = list.rows;
    const pagination = logData?.pagination;
    const handleOpenDetails = ({ logId }) => list.setExpanded(logId);
    const detailsOpen = list.expandedId != null;
    const handleCloseDetails = () => list.setExpanded(null);
    const detailsDialogProps = { logId: list.expandedId };
    const search = list.search;
    const handleSearchChange = (e) => list.setSearch(e.target.value);

    return (
        <div className="bg-white dark:bg-neutral-700 p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Журнал імпорту</h2>

            <div className="w-full md:w-72 mb-4">
                <Input
                    label="Пошук по назві датасету або помилці"
                    icon={<i className="fa-solid fa-magnifying-glass" />}
                    value={search}
                    onChange={handleSearchChange}
                    className="dark:text-white"
                    labelProps={{
                        className: "dark:!text-gray-400 dark:peer-focus:!text-blue-300",
                    }}
                />
            </div>

            <Card className="w-full overflow-auto dark:bg-neutral-700 shadow-none">
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
                                    <th key={i} className="border-b border-blue-gray-100 dark:border-neutral-700 bg-blue-gray-50 dark:bg-neutral-800 p-3">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-gray-400">
                                            {head}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => {
                                const isLast = index === logs.length - 1;
                                const classes = isLast ? 'p-3' : 'p-3 border-b border-blue-gray-50 dark:border-neutral-700';

                                return (
                                    <tr key={log.id} className="even:bg-blue-gray-50/50 dark:even:bg-neutral-600/30 hover:bg-blue-gray-50 dark:hover:bg-neutral-600/50">
                                        <td className={classes}>{getImportTypeIcon(log.import_type)}</td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                {log.dataset_name}
                                            </Typography>
                                        </td>
                                        <td className={classes}><StatusChip {...log} /></td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                {log.user?.name || 'Система'}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                {convertDate(log.started_at)}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                {formatDuration(log.duration_seconds)}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Tooltip content={`До: ${log.records_before}, Після: ${log.records_after}, Різниця: ${log.records_difference}`}>
                                                <Typography variant="small" color="blue-gray" className="font-normal cursor-help dark:text-gray-300">
                                                    {`${log.records_processed} / ${log.records_processed + (log.records_failed || 0)}`}
                                                </Typography>
                                            </Tooltip>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                {log.file_name || 'N/A'}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                {formatBytes(log.file_size) || 'N/A'}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Tooltip content="Детальна інформація">
                                                <IconButton variant="text" size="sm" onClick={() => handleOpenDetails({ logId: log.id })} className="dark:text-gray-400 dark:hover:text-gray-200">
                                                    <i className="fa-solid fa-circle-info text-lg text-blue-gray-500 dark:text-gray-400" />
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

export default observer(ImportLogTable);
