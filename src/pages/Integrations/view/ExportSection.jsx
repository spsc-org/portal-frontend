import { observer } from "mobx-react-lite";
import { Card, Typography, Tooltip } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import ImportResultDialog from "./ImportResultDialog.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TD, TH, TR } from "../../../components/Table/tableStyles.js";

/** vm — ExportViewModel. */
const ExportSection = ({ vm }) => {
    const exportFiles = vm.files;
    const { exportMutation, exportResult } = vm;
    const deleteExportMutation = vm.deleteMutation;
    const handleExportResultClose = vm.closeResult;
    const handleDownload = vm.download;
    const handleDelete = vm.remove;

    return (
        <div className="mt-6 bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2 dark:text-gray-200">Експорт даних</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Інструменти для експорту даних для зовнішніх систем.
                    </p>
                </div>
                <LoadingButton
                    color="green"
                    onClick={vm.runExport}
                    isLoading={exportMutation.isPending}
                >
                    <i className="fa-solid fa-robot mr-2" />
                    Експорт для бота
                </LoadingButton>
            </div>

            {exportFiles.length > 0 && (
                <div className="mt-4">
                    <Typography variant="small" className="font-semibold text-blue-gray-600 dark:text-gray-400 mb-2">
                        Історія експортів:
                    </Typography>
                    <Card className="w-full overflow-auto shadow-none border border-gray-200 dark:border-neutral-700 dark:bg-neutral-800">
                        <table className={twMerge(TABLE, "w-full min-w-max table-auto text-left")}>
                            <thead>
                                <tr>
                                    <th className={TH}>
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-gray-400">
                                            Файл
                                        </Typography>
                                    </th>
                                    <th className={TH}>
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-gray-400">
                                            Дата створення
                                        </Typography>
                                    </th>
                                    <th className={TH}>
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-gray-400">
                                            Розмір
                                        </Typography>
                                    </th>
                                    <th className={twMerge(TH, "w-24 text-center")}>
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-gray-400">
                                            Дії
                                        </Typography>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {exportFiles.map((file, index) => {
                                    const isLast = index === exportFiles.length - 1;
                                    const classes = isLast ? "p-2" : "p-2 border-b border-blue-gray-50 dark:border-neutral-700";
                                    return (
                                        <tr key={file.name} className={twMerge(TR, "transition-colors")}>
                                            <td className={classes}>
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-file-code text-blue-500 dark:text-blue-400"></i>
                                                    <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                        {file.name}
                                                    </Typography>
                                                </div>
                                            </td>
                                            <td className={classes}>
                                                <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                    {file.created_at}
                                                </Typography>
                                            </td>
                                            <td className={classes}>
                                                <Typography variant="small" color="blue-gray" className="font-normal dark:text-gray-300">
                                                    {file.size_formatted}
                                                </Typography>
                                            </td>
                                            <td className={classes}>
                                                <div className="flex justify-center gap-2">
                                                    <Tooltip content="Завантажити">
                                                        <IconButton
                                                            variant="text"
                                                            color="blue"
                                                            size="sm"
                                                            onClick={() => handleDownload(file.download_url, file.name)}
                                                            className="dark:text-blue-400 dark:hover:bg-neutral-600"
                                                        >
                                                            <i className="fa-solid fa-download text-lg" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip content="Видалити">
                                                        <IconButton
                                                            variant="text"
                                                            color="red"
                                                            size="sm"
                                                            onClick={() => handleDelete(file.name)}
                                                            disabled={deleteExportMutation.isPending}
                                                            className="dark:text-red-400 dark:hover:bg-neutral-600"
                                                        >
                                                            <i className="fa-solid fa-trash text-lg" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            <ImportResultDialog
                open={!!exportResult}
                onClose={handleExportResultClose}
                result={exportResult}
                onDownload={vm.downloadResult}
            />
        </div>
    );
};

export default observer(ExportSection);
