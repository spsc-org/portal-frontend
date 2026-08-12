import React from 'react';
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Button,
    Typography,
    Spinner,
    Tabs,
    TabsHeader,
    TabsBody,
    Tab,
    TabPanel,

} from "@material-tailwind/react";
import {useQuery} from "@tanstack/react-query";
import axios from "axios";
import {convertDate} from "../../../utils.js";
import { StatusChip } from "./ImportLogShared.jsx";

const fetchLogDetails = async (logId) => {
    if (!logId) return null;
    const {data} = await axios.get(`/api/consolidated-data/import/logs/${logId}`);
    return data.data;
};

const DetailItem = ({label, value, children}) => (
    <div className="mb-2">
        <Typography color="blue-gray" className="font-semibold text-sm dark:text-slate-400">{label}:</Typography>
        {children ? (
            <div className="text-sm text-blue-gray-800 dark:text-slate-200">{children}</div>
        ) : (
            <Typography variant="small" className="text-blue-gray-800 dark:text-slate-200">{value ?? 'N/A'}</Typography>
        )}
    </div>
);


const ImportLogDetailsDialog = ({open, onClose, logId}) => {
    const {data: log, isLoading, isError, error} = useQuery({
        queryKey: ['importLogDetails', logId],
        queryFn: () => fetchLogDetails(logId),
        enabled: !!logId,
    });

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-48"><Spinner className="h-12 w-12"/></div>;
        }
        if (isError) {
            return <div className="p-4 text-red-500">Помилка завантаження даних: {error.message}</div>;
        }
        if (!log) {
            return <div className="p-4 text-blue-gray-500 dark:text-slate-400">Немає даних для відображення.</div>;
        }

        const tabsData = [
            {
                label: "Інформація",
                value: "info",
                content: (
                    <div className="mt-4 space-y-8">
                        {/* --- Загальна інформація --- */}
                        <div>
                            <Typography variant="h6" color="blue-gray" className="mb-3 border-b pb-1 dark:text-slate-200 dark:border-slate-700">Загальна інформація</Typography>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                <DetailItem label="Датасет" value={log.dataset_name}/>
                                <DetailItem label="Статус">
                                    <StatusChip status={log.status} status_label={log.status_label}/>
                                </DetailItem>
                                <DetailItem label="Користувач" value={`${log.user?.name} (${log.user?.email})`}/>
                                <DetailItem label="Тип імпорту" value={log.import_type?.toUpperCase()}/>
                                <DetailItem label="Початок" value={convertDate(log.started_at)}/>
                                <DetailItem label="Завершення" value={convertDate(log.completed_at)}/>
                                <DetailItem label="Тривалість" value={log.duration_formatted}/>
                                <DetailItem label="Файл" value={log.file_info?.name}/>
                                <DetailItem label="Розмір файлу" value={log.file_info?.size_formatted}/>
                            </div>
                        </div>

                        {/* --- Статистика записів --- */}
                        <div>
                            <Typography variant="h6" color="blue-gray" className="mb-3 border-b pb-1 dark:text-slate-200 dark:border-slate-700">Статистика записів</Typography>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                <DetailItem label="Оброблено успішно" value={log.records_processed}/>
                                <DetailItem label="Записів з помилками" value={log.records_failed ?? 0}/>
                                <DetailItem label="Записів до імпорту" value={log.records_before}/>
                                <DetailItem label="Записів після імпорту" value={log.records_after}/>
                                <DetailItem label="Різниця" value={log.records_difference}/>
                            </div>
                        </div>

                        {/* --- Звіти та Повідомлення --- */}
                        <div>
                            <Typography variant="h6" color="blue-gray" className="mb-3 border-b pb-1 dark:text-slate-200 dark:border-slate-700">Звіти та Повідомлення</Typography>
                            <div className="space-y-6">
                                {log.error_message && (
                                    <DetailItem label="Повідомлення про помилку">
                                        <pre className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-2 rounded-md text-sm whitespace-pre-wrap">{log.error_message}</pre>
                                    </DetailItem>
                                )}
                                {log.warnings?.length > 0 && (
                                    <DetailItem label="Попередження">
                                        <ul className="list-disc list-inside bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-2 rounded-md text-sm">
                                            {log.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                                        </ul>
                                    </DetailItem>
                                )}
                                {log.integrity_report?.length > 0 && (
                                    <DetailItem label="Звіт про цілісність даних">
                                        <table className="w-full text-sm text-left text-gray-500 dark:text-slate-400">
                                            <thead className="text-xs text-gray-700 dark:text-slate-300 uppercase bg-gray-100 dark:bg-slate-700">
                                            <tr>
                                                <th scope="col" className="px-4 py-2">Тип</th>
                                                <th scope="col" className="px-4 py-2 text-right">До</th>
                                                <th scope="col" className="px-4 py-2 text-right">Після</th>
                                                <th scope="col" className="px-4 py-2 text-right">Різниця</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {log.integrity_report.map(item => (
                                                <tr key={item.type} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-200">{item.type}</td>
                                                    <td className="px-4 py-2 text-right">{item.before}</td>
                                                    <td className="px-4 py-2 text-right">{item.after}</td>
                                                    <td className={`px-4 py-2 text-right font-semibold ${item.difference > 0 ? 'text-green-600 dark:text-green-400' : item.difference < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                                        {item.difference > 0 ? '+' : ''}{item.difference}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </DetailItem>
                                )}
                                {log.field_usage_report?.length > 0 && (
                                    <DetailItem label="Звіт про використання полів">
                                        <table className="w-full text-sm text-left text-gray-500 dark:text-slate-400">
                                            <thead className="text-xs text-gray-700 dark:text-slate-300 uppercase bg-gray-100 dark:bg-slate-700">
                                            <tr>
                                                <th scope="col" className="px-4 py-2">Поле</th>
                                                <th scope="col" className="px-4 py-2 text-right">Кількість</th>
                                                <th scope="col" className="px-4 py-2 text-right">Відсоток</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {log.field_usage_report.map(item => (
                                                <tr key={item.field} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-200">{item.field}</td>
                                                    <td className="px-4 py-2 text-right">{item.count}</td>
                                                    <td className="px-4 py-2 text-right">{item.percentage}%</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </DetailItem>
                                )}
                                {!log.error_message && log.warnings?.length === 0 && log.integrity_report?.length === 0 && log.field_usage_report?.length === 0 && (
                                    <Typography className="dark:text-slate-400">Помилок та звітів немає.</Typography>
                                )}
                            </div>
                        </div>
                    </div>
                )
            },
            {
                label: "JSON",
                value: "json",
                content: (
                    <div className="mt-4">
                        {log.full_import_report && Object.keys(log.full_import_report).length > 0 ? (
                            <pre className="bg-gray-900 text-white p-4 rounded-md text-xs overflow-auto max-h-[60vh]">
                                {JSON.stringify(log.full_import_report, null, 2)}
                            </pre>
                        ) : (
                            <Typography className="dark:text-slate-400">Детальний звіт відсутній для цього запису.</Typography>
                        )}
                    </div>
                )
            }
        ];

        return (
            <Tabs value="info">
                <TabsHeader
                    className="rounded-none border-b border-blue-gray-50 dark:border-slate-700 bg-transparent p-0"
                    indicatorProps={{
                        className: "bg-transparent border-b-2 border-gray-900 dark:border-slate-200 shadow-none rounded-none",
                    }}
                >
                    {tabsData.map(({label, value}) => (
                        <Tab key={value} value={value} className="dark:text-slate-300">
                            {label}
                        </Tab>
                    ))}
                </TabsHeader>
                <TabsBody>
                    {tabsData.map(({value, content}) => (
                        <TabPanel key={value} value={value}>
                            {content}
                        </TabPanel>
                    ))}
                </TabsBody>
            </Tabs>
        );
    };

    return (
        <Dialog open={open} handler={onClose} size="lg" className="dark:bg-slate-800">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Деталі логу імпорту #{logId}
                </Typography>
            </DialogHeader>
            <DialogBody className="!px-5 overflow-y-auto max-h-[70vh]">
                {renderContent()}
            </DialogBody>
            <DialogFooter className="dark:border-slate-700">
                <Button
                    variant="text"
                    color="blue-gray"
                    onClick={onClose}
                    className="mr-1 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    <span>Закрити</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ImportLogDetailsDialog;
