import { observer } from "mobx-react-lite";
import { Spinner, Tooltip } from "@material-tailwind/react"
import SearchInput from "../../../components/fields/SearchInput.jsx"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import ImportLogDetailsDialog from "./ImportLogDetailsDialog.jsx";
import { convertDate } from "../../../lib/utils.js";
import { formatBytes, formatDuration, getImportTypeIcon, PaginationFooter, StatusChip } from "./ImportLogShared.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "../../../components/Table/tableStyles.js";

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
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Журнал імпорту</h2>

            <div className="mb-3 w-full md:w-80">
                <SearchInput
                    size="xs"
                    name="import-log-search"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Пошук по назві датасету або помилці"
                    icon="fa-regular fa-magnifying-glass"
                />
            </div>

            <div className={TABLE_WRAP}>
                {isLoading && !logData ? (
                    <div className="flex justify-center items-center h-48">
                        <Spinner className="h-12 w-12" />
                    </div>
                ) : isError ? (
                    <p className="p-4 text-sm text-red-600 dark:text-red-400">
                        Помилка завантаження логів: {error.message}
                    </p>
                ) : (
                    <table className={twMerge(TABLE, "w-full table-auto text-left")}>
                        <thead>
                            <tr>
                                {COLUMNS.map((head, i) => (
                                    <th key={i} className={TH}>{head}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {

                                return (
                                    <tr key={log.id} className={TR}>
                                        <td className={TD}>{getImportTypeIcon(log.import_type)}</td>
                                        <td className={TD}>
                                            <div>
                                                {log.dataset_name}
                                            </div>
                                        </td>
                                        <td className={TD}><StatusChip {...log} /></td>
                                        <td className={TD}>
                                            <div>
                                                {log.user?.name || 'Система'}
                                            </div>
                                        </td>
                                        <td className={TD}>
                                            <div>
                                                {convertDate(log.started_at)}
                                            </div>
                                        </td>
                                        <td className={TD}>
                                            <div>
                                                {formatDuration(log.duration_seconds)}
                                            </div>
                                        </td>
                                        <td className={TD}>
                                            <Tooltip content={`До: ${log.records_before}, Після: ${log.records_after}, Різниця: ${log.records_difference}`}>
                                                <div className="cursor-help">
                                                    {`${log.records_processed} / ${log.records_processed + (log.records_failed || 0)}`}
                                                </div>
                                            </Tooltip>
                                        </td>
                                        <td className={TD}>
                                            <div>
                                                {log.file_name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className={TD}>
                                            <div>
                                                {formatBytes(log.file_size) || 'N/A'}
                                            </div>
                                        </td>
                                        <td className={TD}>
                                            <Tooltip content="Детальна інформація">
                                                <IconButton variant="text" size="sm" onClick={() => handleOpenDetails({ logId: log.id })} >
                                                    <i className="fa-solid fa-circle-info text-lg text-gray-600 dark:text-gray-400" />
                                                </IconButton>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

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
