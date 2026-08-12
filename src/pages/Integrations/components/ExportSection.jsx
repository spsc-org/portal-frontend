import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, Card, Typography, IconButton, Tooltip } from "@material-tailwind/react";
import LoadingButton from "@/Components/Buttons/LoadingButton.jsx";
import ImportResultDialog from "./ImportResultDialog.jsx";

const ExportSection = () => {
    const [exportResult, setExportResult] = useState(null);
    const queryClient = useQueryClient();

    const { data: exportFiles = [] } = useQuery({
        queryKey: ['exportFiles'],
        queryFn: async () => {
            const response = await axios.get('/api/export-legacy-data/list');
            return response.data;
        },
    });

    const exportMutation = useMutation({
        mutationFn: () => axios.get('/api/export-legacy-data').then(r => r.data),
        onSuccess: (data) => {
            setExportResult({
                success: data.status === 'success',
                message: data.message,
                details: data.details,
            });
            queryClient.invalidateQueries({ queryKey: ['exportFiles'] });
        },
        onError: (error) => {
            setExportResult({
                success: false,
                message: 'Помилка експорту',
                details: error.response?.data ?? error.message,
            });
        },
    });

    const deleteExportMutation = useMutation({
        mutationFn: (filename) => axios.delete(`/api/export-legacy-data`, { params: { filename } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exportFiles'] });
        },
        onError: (error) => {
            alert(`Помилка видалення файлу: ${error.response?.data?.message || error.message}`);
        }
    });

    const handleExportResultClose = () => {
        setExportResult(null);
        exportMutation.reset();
    };

    const handleDownload = async (downloadUrl, fileName) => {
        if (!downloadUrl) return;

        try {
            const response = await axios.get(downloadUrl, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Не вдалося завантажити файл. Спробуйте пізніше.");
        }
    };

    const handleDelete = (filename) => {
        if (window.confirm(`Ви впевнені, що хочете видалити файл ${filename}?`)) {
            deleteExportMutation.mutate(filename);
        }
    };

    return (
        <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2 dark:text-slate-200">Експорт даних</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-4">
                        Інструменти для експорту даних для зовнішніх систем.
                    </p>
                </div>
                <LoadingButton
                    color="green"
                    onClick={() => exportMutation.mutate()}
                    isLoading={exportMutation.isPending}
                >
                    <i className="fa-solid fa-robot mr-2" />
                    Експорт для бота
                </LoadingButton>
            </div>

            {exportFiles.length > 0 && (
                <div className="mt-4">
                    <Typography variant="small" className="font-semibold text-blue-gray-600 dark:text-slate-400 mb-2">
                        Історія експортів:
                    </Typography>
                    <Card className="w-full overflow-auto shadow-none border border-blue-gray-100 dark:border-slate-700 dark:bg-slate-800">
                        <table className="w-full min-w-max table-auto text-left">
                            <thead>
                                <tr>
                                    <th className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 p-2">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-slate-400">
                                            Файл
                                        </Typography>
                                    </th>
                                    <th className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 p-2">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-slate-400">
                                            Дата створення
                                        </Typography>
                                    </th>
                                    <th className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 p-2">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-slate-400">
                                            Розмір
                                        </Typography>
                                    </th>
                                    <th className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 p-2 w-24 text-center">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-slate-400">
                                            Дії
                                        </Typography>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {exportFiles.map((file, index) => {
                                    const isLast = index === exportFiles.length - 1;
                                    const classes = isLast ? "p-2" : "p-2 border-b border-blue-gray-50 dark:border-slate-700";
                                    return (
                                        <tr key={file.name} className="even:bg-blue-gray-50/50 dark:even:bg-slate-700/30 hover:bg-blue-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className={classes}>
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-file-code text-blue-500 dark:text-blue-400"></i>
                                                    <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
                                                        {file.name}
                                                    </Typography>
                                                </div>
                                            </td>
                                            <td className={classes}>
                                                <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
                                                    {file.created_at}
                                                </Typography>
                                            </td>
                                            <td className={classes}>
                                                <Typography variant="small" color="blue-gray" className="font-normal dark:text-slate-300">
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
                                                            className="dark:text-blue-400 dark:hover:bg-slate-700"
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
                                                            className="dark:text-red-400 dark:hover:bg-slate-700"
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
            />
        </div>
    );
};

export default ExportSection;
