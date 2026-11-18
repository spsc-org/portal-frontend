import { observer } from "mobx-react-lite";
import { Tooltip } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import { convertDate } from "../../../lib/utils.js";
import ImportDatasetResultDialog from './ImportDatasetResultDialog.jsx';
import { getImportTypeIcon, StatusChip } from "./ImportLogShared.jsx";
import ImportLogDetailsDialog from "./ImportLogDetailsDialog.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TD_EMPTY, TH, TR, ariaSort } from "../../../components/Table/tableStyles.js";
import SortButton from "../../../components/Table/SortButton.jsx";

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

/** vm — DatasetsViewModel (сортування, діалоги журналу/деталей). */
const DatasetTable = ({ vm, onImportClick }) => {
    const { sortedDatasets, requestSort, sortConfig } = vm;
    // VM: direction 'ascending' | 'descending' → SortButton: "asc" | "desc" | false
    const sortDirection = (key) => (sortConfig.key !== key ? false : sortConfig.direction === 'ascending' ? "asc" : "desc");
    const handleOpenDetails = ({ logId }) => vm.openDetails(logId);
    const selectedDataset = vm.historyDataset;
    const setSelectedDataset = (dataset) => (dataset ? vm.openHistory(dataset) : vm.closeHistory());
    const detailsOpen = vm.detailsLogId != null;
    const handleCloseDetails = vm.closeDetails;
    const detailsDialogProps = { logId: vm.detailsLogId };

    return (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Доступні датасети для імпорту</h2>

            <div className={TABLE_WRAP}>
                <table className={twMerge(TABLE, "w-full min-w-max table-auto text-left")}>
                    <thead>
                        <tr>
                            {COLUMNS.map(({ key, label }) => (
                                <th key={label} scope="col" className={TH} aria-sort={key ? ariaSort(sortDirection(key)) : undefined}>
                                    {key ? (
                                        <SortButton
                                            label={label}
                                            direction={sortDirection(key)}
                                            next={sortDirection(key) === "asc" ? "desc" : "asc"}
                                            onClick={() => requestSort(key)}
                                        />
                                    ) : (
                                        label
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDatasets.map((dataset) => {

                            return (
                                <tr key={dataset.id} className={TR}>
                                    <td className={TD}>
                                        <div className="flex items-center gap-2">
                                            {getImportTypeIcon(dataset.format)}
                                            <div>
                                                {dataset.format || '—'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={TD}>
                                        <div className="flex flex-col">
                                            <div>
                                                {dataset.caption || dataset.name || '—'}
                                            </div>
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
                                    <td className={TD}>
                                        <div className="flex items-center gap-2">
                                            {dataset.country && (
                                                <img
                                                    src={`/flag-svg/${dataset.country.toLowerCase()}.svg`}
                                                    alt={dataset.country}
                                                    className="h-4 w-6 object-contain border border-gray-200 dark:border-neutral-600"
                                                />
                                            )}
                                            <div>
                                                {dataset.country || '—'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={TD}>
                                        <div>
                                            {convertDate(dataset.last_updated_at) || '—'}
                                        </div>
                                    </td>
                                    <td className={TD}>
                                        <div>
                                            {dataset.updated_by_name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className={TD}>
                                        <div>
                                            {dataset.last_run_record_count ?? '—'}
                                        </div>
                                    </td>
                                    <td className={TD}>
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
                                                            
                                                        >
                                                            <i className="fa-solid fa-circle-info text-gray-600 dark:text-gray-400" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-gray-600 dark:text-gray-400">
                                                -
                                            </div>
                                        )}
                                    </td>
                                    <td className={TD}>
                                        <div className="flex gap-x-2">
                                            <Button size="sm" onClick={() => onImportClick(dataset)}>
                                                Імпорт
                                            </Button>
                                            <Button size="sm" color="secondary" onClick={() => setSelectedDataset(dataset)}>
                                                Журнал
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {sortedDatasets.length === 0 && (
                            <tr>
                                <td colSpan={COLUMNS.length} className={TD_EMPTY}>
                                    {vm.datasetsQuery.isPending ? "Завантаження датасетів…" : "Датасетів немає"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ImportDatasetResultDialog
                open={!!selectedDataset}
                onClose={() => setSelectedDataset(null)}
                dataset={selectedDataset}
                list={vm.historyLogs}
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

export default observer(DatasetTable);
