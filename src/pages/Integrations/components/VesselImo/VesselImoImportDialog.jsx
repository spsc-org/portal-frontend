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
import { usePreviewVesselImoImportMutation, useCommitVesselImoImportMutation } from "../../entities/vesselImo/queries.js";

const SummaryTable = ({ summary, countsColumns }) => (
    <table className="w-full text-sm">
        <thead>
            <tr className="text-left text-gray-500 dark:text-slate-400">
                <th className="pb-1">Вкладка</th>
                {countsColumns ? (
                    <>
                        <th className="pb-1">Було</th>
                        <th className="pb-1">Додано</th>
                        <th className="pb-1">Видалено</th>
                        <th className="pb-1">Без змін</th>
                    </>
                ) : (
                    <>
                        <th className="pb-1">Імпортовано</th>
                        <th className="pb-1">Дублів у файлі</th>
                    </>
                )}
                <th className="pb-1">Статус</th>
            </tr>
        </thead>
        <tbody>
            {Object.entries(summary).map(([sheet, s]) => (
                <tr key={sheet} className="dark:text-slate-300">
                    <td>{sheet}</td>
                    {countsColumns ? (
                        <>
                            <td>{s.recognized ? s.previousCount : '—'}</td>
                            <td className={s.recognized && s.addedCount > 0 ? 'text-green-600' : ''}>
                                {s.recognized ? s.addedCount : '—'}
                            </td>
                            <td className={s.recognized && s.removedCount > 0 ? 'text-red-500' : ''}>
                                {s.recognized ? s.removedCount : '—'}
                            </td>
                            <td>{s.recognized ? s.unchangedCount : '—'}</td>
                        </>
                    ) : (
                        <>
                            <td>{s.imported}</td>
                            <td>{s.duplicatesInSource}</td>
                        </>
                    )}
                    <td>
                        {s.recognized
                            ? <span className="text-green-600">OK</span>
                            : <span className="text-amber-500">Вкладка не розпізнана</span>}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const VesselImoImportDialog = ({ open, onClose, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);

    const previewMutation = usePreviewVesselImoImportMutation();

    const importMutation = useCommitVesselImoImportMutation();

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
                {result?.summary && <SummaryTable summary={result.summary} countsColumns />}
            </div>
        );
    };

    const renderPreview = () => {
        const summary = previewMutation.data?.summary;
        const errorMessage = previewMutation.error?.response?.data?.message ?? previewMutation.error?.message;
        const hasChanges = summary
            ? Object.values(summary).some((s) => s.recognized && (s.addedCount > 0 || s.removedCount > 0))
            : false;

        return (
            <div>
                <Typography className="dark:text-slate-300 mb-4">
                    Аналіз файлу «{file?.name}» — стан ДО імпорту. Перевірте зміни та підтвердіть імпорт.
                </Typography>
                {previewMutation.isError && <Alert color="red" className="mb-4">{errorMessage}</Alert>}
                {summary && !hasChanges && (
                    <Alert color="blue" className="mb-4">
                        Змін немає — дані файлу ідентичні поточному стану бази.
                    </Alert>
                )}
                {summary && <SummaryTable summary={summary} countsColumns />}
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
                    Завантажте Excel-книгу (одна вкладка = один список, назва вкладки має
                    збігатися з кодом списку). Кожна розпізнана вкладка повністю замінює
                    попередні дані свого списку.
                </Typography>
                <a
                    href="/integrations/vessel-imo/template"
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
                    Імпорт списків IMO суден
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

export default VesselImoImportDialog;
