import { observer } from "mobx-react-lite";
import { Spinner, Tooltip } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import ImportLogDetailsDialog from "./ImportLogDetailsDialog.jsx";
import { formatBytes, formatDuration, getImportTypeIcon, PaginationFooter, StatusChip } from "./ImportLogShared.jsx";
import { convertDate } from "../../../lib/utils.js";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TD_EMPTY, TH, TR } from "../../../components/Table/tableStyles.js";


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

    const datasetName = dataset?.caption || dataset?.name || "";

    return (
        <Modal open={open} onClose={handleCloseDialog} size="xl">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    Журнал імпорту{datasetName && <span className="ml-2 normal-case text-blue-600 dark:text-blue-400">{datasetName}</span>}
                </h3>
            </ModalHeader>

            <ModalBody>
                {isLoading ? (
                    <div className="flex h-48 items-center justify-center">
                        <Spinner className="h-12 w-12" />
                    </div>
                ) : isError ? (
                    <p className="p-4 text-center text-sm text-red-600 dark:text-red-400">
                        Помилка завантаження логів: {error.message}
                    </p>
                ) : (
                    <>
                        <div className={TABLE_WRAP}>
                            <table className={TABLE}>
                                <thead>
                                    <tr>
                                        {COLUMNS.map((head, i) => (
                                            <th key={i} scope="col" className={twMerge(TH, i === 0 || i === COLUMNS.length - 1 ? "w-px" : "")}>
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={COLUMNS.length} className={TD_EMPTY}>
                                                Для цього датасету ще немає записів у журналі.
                                            </td>
                                        </tr>
                                    )}
                                    {logs.map((log) => (
                                        <tr key={log.id} className={TR}>
                                            <td className={twMerge(TD, "text-center")}>{getImportTypeIcon(log.import_type)}</td>
                                            <td className={TD}><StatusChip {...log} /></td>
                                            <td className={TD}>{log.user?.name || "Система"}</td>
                                            <td className={TD}>{convertDate(log.started_at)}</td>
                                            <td className={TD}>{formatDuration(log.duration_seconds)}</td>
                                            <td className={TD}>
                                                <Tooltip content={`Було: ${log.records_before}, Стало: ${log.records_after}, Різниця: ${log.records_difference}`}>
                                                    <span className="cursor-help">{log.records_processed}</span>
                                                </Tooltip>
                                            </td>
                                            <td className={TD}>
                                                <div className="max-w-[150px] truncate" title={log.file_name}>{log.file_name || "N/A"}</div>
                                            </td>
                                            <td className={TD}>{formatBytes(log.file_size) || "N/A"}</td>
                                            <td className={twMerge(TD, "text-center")}>
                                                <Tooltip content="Детальна інформація">
                                                    <IconButton variant="text" size="sm" title="Детальна інформація" onClick={() => handleOpenDetails({ logId: log.id })}>
                                                        <i className="fa-solid fa-circle-info text-base text-gray-600 dark:text-gray-400" />
                                                    </IconButton>
                                                </Tooltip>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationFooter pagination={pagination} page={page} onPageChange={setPage} />
                    </>
                )}
            </ModalBody>

            <ModalFooter>
                <Button color="secondary" onClick={handleCloseDialog}>
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
