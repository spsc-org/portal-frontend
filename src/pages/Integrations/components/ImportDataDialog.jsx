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
import { useMutation } from "@tanstack/react-query";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import LoadingButton from "../../../Components/Buttons/LoadingButton.jsx";
import ImportResultDetails from "./ImportResultDetails.jsx";

const ImportDataDialog = ({ open, onClose, dataset, onImportSuccess }) => {
    const { props: { token } } = usePage();
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);

    // Датасет з id === 1 не потребує файлу (внутрішній тип)
    const requiresFile = dataset?.id !== 1;

    const importMutation = useMutation({
        mutationFn: (formData) =>
            axios.post('/consolidated-data/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-Token': token,
                    'Accept': 'application/json',
                },
            }),
        onSuccess: (response) => {
            if (response.data.success && onImportSuccess) {
                onImportSuccess();
            }
        },
    });

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = () => {
        if (requiresFile && !file) {
            setError('Будь ласка, виберіть файл.');
            return;
        }

        const formData = new FormData();
        formData.append('type', dataset.id);
        if (file) formData.append('userfile', file);

        importMutation.mutate(formData);
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        importMutation.reset();
        onClose();
    };

    const isSettled = importMutation.isSuccess || importMutation.isError;

    const renderBody = () => {
        if (importMutation.isPending) {
            return (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <Spinner className="h-12 w-12" />
                    <Typography className="dark:text-slate-200">Йде імпорт, будь ласка, зачекайте…</Typography>
                </div>
            );
        }

        if (isSettled) {
            const result = importMutation.isSuccess
                ? importMutation.data.data
                : importMutation.error?.response?.data;
            return <ImportResultDetails result={result} />;
        }

        return (
            <>
                {error && <Alert color="red" className="mb-4">{error}</Alert>}
                <Typography variant="h6" className="dark:text-slate-200 mb-2">
                    Імпорт для: <span className="font-bold">{dataset.caption || dataset.name}</span>
                </Typography>
                <Typography className="dark:text-slate-300 mb-4">
                    Очікуваний формат файлу:{' '}
                    <span className="font-bold text-blue-500">{dataset.format.toUpperCase()}</span>.
                </Typography>

                {requiresFile ? (
                    <Input
                        type="file"
                        label="Файл для імпорту"
                        onChange={handleFileChange}
                        className="dark:text-slate-200"
                        labelProps={{
                            className: "dark:!text-slate-400 dark:peer-focus:!text-blue-300",
                        }}
                        error={!!error}
                    />
                ) : (
                    <Alert color="blue" className="mt-4 flex items-center gap-2">
                        <i className="fa-solid fa-database"></i>
                        <span>Цей датасет імпортується з внутрішньої бази даних. Файл не потрібен.</span>
                    </Alert>
                )}
            </>
        );
    };

    return (
        <Dialog open={open} handler={handleClose} size="md" className="dark:bg-slate-800">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Імпорт консолідованих даних
                </Typography>
            </DialogHeader>

            <DialogBody>{renderBody()}</DialogBody>

            <DialogFooter>
                <Button variant="text" color="blue-gray" onClick={handleClose} className="mr-1 dark:text-slate-300 dark:hover:bg-slate-700">
                    Закрити
                </Button>
                {!isSettled && (
                    <LoadingButton
                        variant="gradient"
                        color="green"
                        onClick={handleSubmit}
                        isLoading={importMutation.isPending}
                        disabled={(requiresFile && !file) || importMutation.isPending}
                    >
                        {requiresFile ? 'Імпортувати файл' : 'Запустити синхронізацію'}
                    </LoadingButton>
                )}
            </DialogFooter>
        </Dialog>
    );
};

export default ImportDataDialog;
