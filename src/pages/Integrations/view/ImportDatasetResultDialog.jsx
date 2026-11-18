import { observer } from "mobx-react-lite";
import { Typography, Card, Spinner, Tooltip } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import ImportLogDetailsDialog from "./ImportLogDetailsDialog.jsx";
import { formatBytes, formatDuration, getImportTypeIcon, PaginationFooter, StatusChip } from "./ImportLogShared.jsx";
import { convertDate } from "../../../lib/utils.js";


const COLUMNS = ['', 'Статус', 'Користувач', 'Дата', 'Тривалість', 'Записи', 'Файл', 'Розмір', ''];

/** list — PagedListViewModel журналу обраного датасету. */
const ImportDatasetResultDialog = ({ open, onClose, dataset, list }) => {
    const { page, setPage } = list;
    const logData = list.query.data;
    const { isLoading, isError, error } = list.query;
    const logs = list.rows;
    const pagination = logData?.pagination;
    const handleOpenDetails = ({ logId }) => list.setExpanded(logId);
    const detailsOpen = list.expandedId != null;
    const handleCloseDetails = () => list.setExpanded(null);
    const detailsDialogProps = { logId: list.expandedId };
    const handleCloseDialog = onClose;

    return (
        <Modal open={open} handler={handleCloseDialog} size="xl">
            <ModalHeader>
                Журнал імпорту для:{' '}
                <span className="text-blue-600 dark:text-blue-400 ml-2">{dataset?.caption || dataset?.name || ''}</span>
            </ModalHeader>

            <ModalBody divider className="p-0 border-t border-b border-blue-gray-50">
                <Card className="w-full shadow-none rounded-none max-h-[75vh] overflow-y-auto dark:bg-neutral-700">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Spinner className="h-12 w-12" />
                        </div>
                    ) : isError ? (
                        <p className="p-4 text-red-500 text-center">
                            Помилка завантаження логів: {error.message}
                        </p>
                    ) : logs.length === 0 ? (
                        <p className="p-4 text-center text-gray-600 dark:text-gray-400">
                            Для цього датасету ще немає записів в журналі.
                        </p>
                    ) : (
                        <table className="w-full table-auto text-left">
                            <thead>
                                <tr>
                                    {COLUMNS.map((head, i) => (
                                        <th key={i} className={`sticky top-0 border-b border-blue-gray-100 dark:border-neutral-700 bg-blue-gray-50 dark:bg-neutral-800 p-3 z-10 ${i === 0 || i === COLUMNS.length - 1 ? 'w-px' : ''}`}>
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
                                            <td className={`${classes} text-center`}>{getImportTypeIcon(log.import_type)}</td>
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
                                                <Tooltip content={`Було: ${log.records_before}, Стало: ${log.records_after}, Різниця: ${log.records_difference}`}>
                                                    <Typography variant="small" color="blue-gray" className="font-normal cursor-help dark:text-gray-300">
                                                        {log.records_processed}
                                                    </Typography>
                                                </Tooltip>
                                            </td>
                                            <td className={classes}>
                                                <Typography variant="small" color="blue-gray" className="font-normal truncate max-w-[150px] dark:text-gray-300" title={log.file_name}>
                                                    {log.file_name || 'N/A'}
                                                </Typography>
                                            </td>
                                            <td className={classes}>
                                                <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                    {formatBytes(log.file_size) || 'N/A'}
                                                </Typography>
                                            </td>
                                            <td className={`${classes} text-center`}>
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
            </ModalBody>

            <ModalFooter className="justify-between border-t border-blue-gray-50">
                <PaginationFooter pagination={pagination} page={page} onPageChange={setPage} />
                <Button variant="text" color="blue-gray" onClick={handleCloseDialog} className="dark:text-gray-300 dark:hover:bg-neutral-600">
                    Закрити
                </Button>
            </ModalFooter>

            {detailsOpen && (
                <ImportLogDetailsDialog
                    open={detailsOpen}
                    onClose={handleCloseDetails}
                    logId={detailsDialogProps?.logId}
                />
            )}
        </Modal>
    );
};

export default observer(ImportDatasetResultDialog);
