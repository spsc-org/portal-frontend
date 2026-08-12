import React, { useState } from 'react';
import {
    Alert,
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Input,
    Spinner,
    Typography,
} from "@material-tailwind/react";
import LoadingButton from "@/Components/Buttons/LoadingButton.jsx";
import {
    usePreviewVesselImoDetailsImportMutation,
    useCommitVesselImoDetailsImportMutation,
} from "../../entities/vesselImo/queries.js";

const SummaryGrid = ({ summary }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div><span className="text-gray-500 dark:text-slate-400">Було:</span> <span className="font-medium dark:text-slate-200">{summary.previousCount}</span></div>
        <div><span className="text-gray-500 dark:text-slate-400">Залито:</span> <span className="font-medium dark:text-slate-200">{summary.importedCount}</span></div>
        <div><span className="text-gray-500 dark:text-slate-400">Додано:</span> <span className={`font-medium ${summary.addedCount > 0 ? 'text-green-600' : 'dark:text-slate-200'}`}>{summary.addedCount}</span></div>
        <div><span className="text-gray-500 dark:text-slate-400">Видалено:</span> <span className={`font-medium ${summary.removedCount > 0 ? 'text-red-500' : 'dark:text-slate-200'}`}>{summary.removedCount}</span></div>
        <div><span className="text-gray-500 dark:text-slate-400">Без змін:</span> <span className="font-medium dark:text-slate-200">{summary.unchangedCount}</span></div>
        <div><span className="text-gray-500 dark:text-slate-400">Дублів у файлі:</span> <span className="font-medium dark:text-slate-200">{summary.duplicatesInSource}</span></div>
        {summary.invalidRows > 0 && (
            <div className="col-span-2 sm:col-span-3 text-amber-500">
                Рядків з невалідним/відсутнім IMO (пропущено): {summary.invalidRows}
            </div>
        )}
    </div>
);

const VesselImoDetailsImportDialog = ({ open, onClose, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);

    const previewMutation = usePreviewVesselImoDetailsImportMutation();
    const importMutation = useCommitVesselImoDetailsImportMutation();

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError(null);
            previewMutation.reset();
        }
    };

    const handleAnalyze = () => {
        if (!file) {
            setError('Будь ласка, виберіть файл.');
            return;
        }
        previewMutation.mutate(file);
    };

    const handleConfirmImport = () => {
        importMutation.mutate(file, {
            onSuccess: () => onImportSuccess?.(),
        });
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        previewMutation.reset();
        importMutation.reset();
        onClose();
    };

    const isImportSettled = importMutation.isSuccess || importMutation.isError;

    const renderImportResult = () => {
        const success = importMutation.isSuccess;
        const result = success ? importMutation.data : null;
        const errorMessage = !success
            ? (importMutation.error?.response?.data?.message ?? importMutation.error?.message)
            : null;

        return (
            <div>
                <Alert color={success ? 'green' : 'red'} className="mb-4">
                    {success ? `Імпорт завершено (${result?.status})` : errorMessage}
                </Alert>
                {result?.summary && <SummaryGrid summary={result.summary} />}
            </div>
        );
    };

    const renderPreview = () => {
        const summary = previewMutation.data?.summary;
        const errorMessage = previewMutation.error?.response?.data?.message ?? previewMutation.error?.message;
        const hasChanges = summary ? (summary.addedCount > 0 || summary.removedCount > 0) : false;

        return (
            <div>
                <Typography className="dark:text-slate-300 mb-4">
                    Аналіз файлу «{file?.name}» — стан ДО імпорту.
                </Typography>
                {previewMutation.isError && <Alert color="red" className="mb-4">{errorMessage}</Alert>}
                {summary && !hasChanges && (
                    <Alert color="blue" className="mb-4">
                        Змін немає — дані файлу ідентичні поточному стану бази.
                    </Alert>
                )}
                {summary && <SummaryGrid summary={summary} />}
            </div>
        );
    };

    const renderBody = () => {
        if (importMutation.isPending) {
            return (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <Spinner className="h-12 w-12" />
                    <Typography className="dark:text-slate-200">Йде імпорт, будь ласка, зачекайте…</Typography>
                </div>
            );
        }

        if (isImportSettled) {
            return renderImportResult();
        }

        if (previewMutation.isPending) {
            return (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <Spinner className="h-12 w-12" />
                    <Typography className="dark:text-slate-200">Аналізуємо файл…</Typography>
                </div>
            );
        }

        if (previewMutation.isSuccess || previewMutation.isError) {
            return renderPreview();
        }

        return (
            <>
                {error && <Alert color="red" className="mb-4">{error}</Alert>}
                <Typography className="dark:text-slate-300 mb-4">
                    Завантажте Excel-книгу з деталями суден (один лист, ключ — IMO). Імпорт
                    повністю замінює поточну таблицю деталей.
                </Typography>
                <a
                    href="/integrations/vessel-imo/details/template"
                    className="text-sm text-blue-500 hover:underline mb-4 inline-flex items-center gap-1"
                >
                    <i className="fa-solid fa-file-arrow-down" />
                    Завантажити поточний стан як шаблон
                </a>
                <Input
                    type="file"
                    label="Файл для імпорту (.xlsx)"
                    onChange={handleFileChange}
                    className="dark:text-slate-200"
                    labelProps={{ className: "dark:!text-slate-400 dark:peer-focus:!text-blue-300" }}
                    error={!!error}
                />
            </>
        );
    };

    const showAnalyzeButton = !previewMutation.isSuccess && !previewMutation.isPending && !isImportSettled;
    const showConfirmButton = previewMutation.isSuccess && !isImportSettled;

    return (
        <Dialog open={open} handler={handleClose} size="md" className="dark:bg-slate-800">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Імпорт деталей суден
                </Typography>
            </DialogHeader>
            <DialogBody>{renderBody()}</DialogBody>
            <DialogFooter>
                <Button variant="text" color="blue-gray" onClick={handleClose} className="mr-1 dark:text-slate-300 dark:hover:bg-slate-700">
                    Закрити
                </Button>
                {showAnalyzeButton && (
                    <LoadingButton
                        variant="gradient"
                        color="blue"
                        onClick={handleAnalyze}
                        isLoading={previewMutation.isPending}
                        disabled={!file || previewMutation.isPending}
                    >
                        Аналізувати
                    </LoadingButton>
                )}
                {showConfirmButton && (
                    <LoadingButton
                        variant="gradient"
                        color="green"
                        onClick={handleConfirmImport}
                        isLoading={importMutation.isPending}
                        disabled={importMutation.isPending}
                    >
                        Підтвердити імпорт
                    </LoadingButton>
                )}
            </DialogFooter>
        </Dialog>
    );
};

export default VesselImoDetailsImportDialog;
