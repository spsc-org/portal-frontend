import { useState } from 'react';
import { Alert, Card, CardBody, Typography, Collapse } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "../../../components/Table/tableStyles.js";

const ImportResultDetails = ({ result }) => {
    // Хук — до раннього return (у Inertia-версії викликався умовно).
    const [openSkipped, setOpenSkipped] = useState(false);
    if (!result) return null;

    // Розпаковуємо результат
    // Іноді result приходить як { data: { ... } }, іноді як плоский об'єкт
    const data = result.data || result;
    const { success, message, error, skipped_records_report, warnings } = data;

    const toggleSkipped = () => setOpenSkipped(!openSkipped);

    return (
        <div className="flex flex-col gap-4 w-full">
            <Alert color={success ? 'green' : 'red'} className="w-full">
                <Typography variant="h6" className="font-bold">
                    {success ? 'Імпорт успішно завершено' : 'Помилка імпорту'}
                </Typography>
                <p className="mt-1 text-sm">{message || error || (success ? 'Дані успішно оновлено.' : 'Виникла помилка.')}</p>
            </Alert>

            {/* Попередження */}
            {warnings && warnings.length > 0 && (
                <Alert color="amber" className="w-full">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                        <Typography variant="h6" className="font-bold">Попередження</Typography>
                    </div>
                    <ul className="mt-2 list-disc list-inside text-sm">
                        {warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            {/* Звіт про пропущені записи */}
            {skipped_records_report && skipped_records_report.count > 0 && (
                <Card className="w-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10">
                    <CardBody className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                <i className="fa-solid fa-filter-circle-xmark"></i>
                                <Typography variant="h6" className="font-bold">
                                    Пропущені записи: {skipped_records_report.count}
                                </Typography>
                            </div>
                            <Button size="sm" variant="text" color="amber" onClick={toggleSkipped}>
                                {openSkipped ? 'Приховати деталі' : 'Показати деталі'}
                            </Button>
                        </div>

                        {/* Зведення причин */}
                        {skipped_records_report.reasons_summary && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {Object.entries(skipped_records_report.reasons_summary).map(([reason, count]) => (
                                    <span key={reason} className="px-2 py-1 bg-white dark:bg-neutral-700 rounded text-xs font-medium border border-amber-100 dark:border-amber-900 text-amber-800 dark:text-amber-200">
                                        {reason}: {count}
                                    </span>
                                ))}
                            </div>
                        )}

                        <Collapse open={openSkipped}>
                            <div className={twMerge(TABLE_WRAP, "mt-2 max-h-60 overflow-y-auto")}>
                                <table className={twMerge(TABLE, "w-full text-left")}>
                                    <thead>
                                        <tr>
                                            <th className={TH}>ID</th>
                                            <th className={TH}>Причина</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {skipped_records_report.details.map((record, idx) => (
                                            <tr key={idx} className={TR}>
                                                <td className={twMerge(TD, "font-mono")}>{record.id}</td>
                                                <td className={TD}>{record.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {skipped_records_report.count > 100 && (
                                    <div className="p-2 text-center text-gray-600 italic">
                                        ... показано перші 100 записів ...
                                    </div>
                                )}
                            </div>
                        </Collapse>
                    </CardBody>
                </Card>
            )}

            {/* Загальний JSON (для налагодження або інших деталей) */}
            <Card className="w-full dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
                <CardBody className="p-0">
                    <div className="p-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 rounded-t">
                        <Typography variant="small" className="font-bold text-gray-700 dark:text-gray-300">
                            Технічні деталі
                        </Typography>
                    </div>
                    <div className="max-h-60 overflow-y-auto bg-white dark:bg-neutral-800 p-3 text-xs font-mono rounded-b">
                        <pre className="whitespace-pre-wrap break-all text-gray-600 dark:text-gray-400">
                            {JSON.stringify(data, (key, value) => {
                                // Фільтруємо великі масиви, щоб не забивати екран
                                if (key === 'skipped_records_report' || key === 'warnings') return undefined;
                                return value;
                            }, 2)}
                        </pre>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default ImportResultDetails;
