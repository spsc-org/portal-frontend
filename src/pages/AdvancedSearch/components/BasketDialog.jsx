import React, {useMemo, useState} from 'react';
import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Typography,
    IconButton,
    Spinner
} from "@material-tailwind/react";
import {useBasket} from "../context/BasketContext.jsx";
import {useQuery} from "@tanstack/react-query";
import axios from "axios";

const BasketDialog = ({open, onClose, renderCell}) => {
    const {items, toggleItem, clearBasket} = useBasket();
    const [isExporting, setIsExporting] = useState(false);

    // Запит на бекенд для отримання повних даних
    const {data: basketData, isLoading, isError} = useQuery({
        queryKey: ['basketData', items],
        queryFn: async () => {
            if (items.length === 0) return [];

            // Готуємо дані для запиту (тільки datasetId та id)
            const requestItems = items.map(item => ({
                datasetId: item.datasetId,
                id: item.id
            }));

            const response = await axios.post("api/consolidated-data/by-ids", {
                items: requestItems
            });

            return response.data.data || [];
        },
        enabled: open && items.length > 0, // Запит тільки якщо діалог відкритий і є записи
        staleTime: 1000 * 60 * 5, // Кешуємо на 5 хвилин
    });

    // Об'єднуємо дані з бекенду з даними з кошика (для збереження порядку та addedAt)
    const displayItems = useMemo(() => {
        if (!basketData) return [];

        // Створюємо мапу для швидкого пошуку даних з бекенду
        const dataMap = new Map();
        basketData.forEach(record => {
            dataMap.set(`${record.datasetId}-${record.id}`, record);
        });

        // Проходимо по items (зберігаючи порядок додавання) і підставляємо дані
        return items.map(item => {
            const record = dataMap.get(`${item.datasetId}-${item.id}`);
            if (record) {
                return {
                    ...record,
                    addedAt: item.addedAt,
                    // Додаємо original для сумісності з renderCell
                    original: {
                        ...record,
                        datasetId: item.datasetId // Гарантуємо наявність datasetId
                    }
                };
            }
            // Якщо запис не знайдено на бекенді (наприклад, видалено), повертаємо заглушку або null
            // Краще повернути те, що є в кошику, з поміткою
            return {
                ...item,
                captions: 'Запис не знайдено або видалено',
                original: { datasetId: item.datasetId }
            };
        });
    }, [items, basketData]);

    const handleExport = async () => {
        if (items.length === 0) return;

        setIsExporting(true);
        try {
            const requestItems = items.map(item => ({
                datasetId: item.datasetId,
                id: item.id
            }));

            const response = await axios.post("api/consolidated-data/export-basket", {
                items: requestItems
            }, {
                responseType: 'blob' // Важливо для завантаження файлу
            });

            // Створюємо посилання для завантаження
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `basket_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            // Тут можна додати повідомлення про помилку
        } finally {
            setIsExporting(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} handler={onClose} size="xl" className="dark:bg-slate-800">
            <DialogHeader className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-star text-amber-500"></i>
                    <Typography variant="h5" color="blue-gray" className="dark:text-slate-200">
                        Вибрані записи
                    </Typography>
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                        {items.length}
                    </span>
                </div>
                <div className="flex gap-2">
                    {items.length > 0 && (
                        <>
                            <Button
                                size="sm"
                                color="green"
                                variant="filled"
                                className="flex items-center gap-2"
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <Spinner className="h-4 w-4" />
                                ) : (
                                    <i className="fa-solid fa-file-excel"></i>
                                )}
                                Експорт Excel
                            </Button>

                            <Button
                                size="sm"
                                color="red"
                                variant="text"
                                className="flex items-center gap-2"
                                onClick={clearBasket}
                            >
                                <i className="fa-regular fa-trash-can"></i>
                                Очистити кошик
                            </Button>
                        </>
                    )}
                    <IconButton variant="text" color="blue-gray" onClick={onClose} className="dark:text-slate-400 dark:hover:text-slate-200">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </IconButton>
                </div>
            </DialogHeader>

            <DialogBody className="h-[40rem] overflow-y-auto p-0">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-slate-400 gap-4">
                        <i className="fa-regular fa-star text-4xl text-gray-300 dark:text-slate-600"></i>
                        <Typography>Список порожній</Typography>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spinner className="h-12 w-12" />
                    </div>
                ) : (
                    <table className="w-full min-w-max table-auto text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 sticky top-0 z-10">
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-900 w-12">№</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-900 w-20">ID</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-900 w-64">Назва</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-900 w-48">Ідентифікатори</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-900 w-48">Указ</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-900">Інше</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-900 w-32">Додано</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase text-right bg-gray-50 dark:bg-slate-900 w-16">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, index) => (
                                <tr key={`${item.datasetId}-${item.id}`} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 align-top">
                                    <td className="p-4 text-xs text-gray-500 dark:text-slate-400">{index + 1}</td>
                                    <td className="p-4 text-sm font-mono text-gray-600 dark:text-slate-300">
                                        <div>{item.id}</div>
                                        <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">DS #{item.datasetId}</div>
                                    </td>

                                    {/* Використовуємо renderCell для консистентного відображення, вимикаємо хайлайтінг */}
                                    <td className="p-4 text-sm text-gray-800 dark:text-slate-200">
                                        {renderCell ? renderCell('captions', { original: item }, item.captions, { search: '' }) : item.captions}
                                    </td>
                                    <td className="p-4 text-sm text-gray-800 dark:text-slate-200">
                                        {renderCell ? renderCell('identifiers', { original: item }, item.identifiers, { search: '' }) : item.identifiers}
                                    </td>
                                    <td className="p-4 text-sm text-gray-800 dark:text-slate-200">
                                        {renderCell ? renderCell('decree', { original: item }, item.decree, { search: '' }) : item.decree}
                                    </td>
                                    <td className="p-4 text-sm text-gray-800 dark:text-slate-200">
                                        {renderCell ? renderCell('other', { original: item }, item.other, { search: '' }) : item.other}
                                    </td>

                                    <td className="p-4 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                        {item.addedAt ? new Date(item.addedAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <IconButton
                                            size="sm"
                                            color="red"
                                            variant="text"
                                            onClick={() => toggleItem({ datasetId: item.datasetId, id: item.id })}
                                            title="Видалити"
                                        >
                                            <i className="fa-solid fa-trash-can"></i>
                                        </IconButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </DialogBody>

            <DialogFooter className="border-t border-gray-200 dark:border-slate-700 pt-2">
                <Button variant="gradient" color="blue" onClick={onClose}>
                    Закрити
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default BasketDialog;
