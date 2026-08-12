import React, {useRef, useState} from "react";
import {Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Tooltip, Typography} from "@material-tailwind/react";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
// Окрема (не спільна з Днями народження) модалка імпорту телефонів —
// виділена з колишньої спільної ImportModal.jsx, бо Телефони більше не
// мають поняття "спільний/особистий список" (2026-08-03) і не потребують
// canMarkDefault/isDefault узагалі — тримати їх у спільному компоненті
// заради самих Телефонів було зайвим мертвим пропом. Двокроковий імпорт
// з Excel-заготовки (вибір файлу → перегляд розпарсених рядків із
// чекбоксами → підтвердження обраних), той самий стан-less підхід, що й у
// наявному імпорті проєктів (UploadProjectsV2) — бекенд нічого не зберігає
// між кроками, розпарсені рядки тримає React state.
//
// Скролл картки: max-height + flex-col на Dialog (не лише на DialogBody) —
// інакше при контенті вище вʼюпорту заголовок+футер+тіло разом можуть
// перевищити висоту екрана, а backdrop Material Tailwind не має власного
// overflow-y-auto (той самий патерн, що й у TaskDetailsModal.jsx). Другий,
// менш очевидний нюанс: DialogBody — `flex-1` (flex-item колонки Dialog) БЕЗ
// `min-h-0` не скролиться взагалі — flex-item за замовчуванням має
// `min-height: auto`, тобто відмовляється стискатись нижче min-content
// висоти свого вмісту (таблиці), і просто розпирає Dialog понад max-h-[90vh]
// замість того, щоб зупинитись і показати internal-скролбар. `min-h-0`
// прибирає цей дефолт — лише тоді `overflow-y-auto` реально спрацьовує.
const ImportPhoneModal = ({open, onClose, title, templateUrl, columns, previewMutation, commitMutation, onImported}) => {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState("");
    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState({});

    // За rows.length саме по собі: файл, що спарсився в 0 рядків (порожня
    // заготовка — лише заголовок), інакше мовчки лишав би модалку на кроці
    // "pick" без жодного зворотного звʼязку. previewMutation.isSuccess
    // однозначно розрізняє "ще не завантажували" від "завантажили, рядків нуль".
    const step = previewMutation.isSuccess ? "preview" : "pick";

    const resetAll = () => {
        setFileName("");
        setRows([]);
        setSelected({});
        previewMutation.reset();
        commitMutation.reset();
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleClose = () => {
        resetAll();
        onClose();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        previewMutation.mutate(file, {
            onSuccess: (result) => {
                setRows(result.rows || []);
                const initialSelected = {};
                (result.rows || []).forEach((row, index) => {
                    initialSelected[index] = row.valid;
                });
                setSelected(initialSelected);
            },
        });
    };

    const toggleRow = (index) => setSelected((prev) => ({...prev, [index]: !prev[index]}));
    const selectAllValid = () => {
        const next = {};
        rows.forEach((row, index) => {
            next[index] = row.valid;
        });
        setSelected(next);
    };
    const clearAll = () => setSelected({});

    const selectedRows = rows.filter((_, index) => selected[index]);

    const handleImport = () => {
        if (!selectedRows.length) return;
        commitMutation.mutate({rows: selectedRows}, {
            onSuccess: (entries) => {
                onImported?.(entries);
                handleClose();
            },
        });
    };

    const handleBack = () => {
        setRows([]);
        setSelected({});
        previewMutation.reset();
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Dialog data-i-doc="modal:handbook-phone-import" open={open} handler={handleClose} size={step === "preview" ? "lg" : "sm"} className="flex max-h-[90vh] flex-col">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">{title}</Typography>
            </DialogHeader>
            <DialogBody className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
                {step === "pick" ? (
                    <>
                        <a href={templateUrl}
                           className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400">
                            <i className="fa-regular fa-file-arrow-down"></i>
                            Завантажити заготовку Excel
                        </a>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Файл (.xlsx, .xls)</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-600 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:file:bg-slate-700 dark:file:text-slate-300"
                            />
                        </div>
                        {previewMutation.isPending &&
                            <p className="text-xs text-slate-400 dark:text-slate-500">Розпізнаю файл…</p>
                        }
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>
                                <i className="fa-regular fa-file-excel mr-1.5"></i>{fileName} — знайдено {rows.length},
                                коректних {rows.filter((r) => r.valid).length}
                            </span>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={selectAllValid}
                                        className="font-medium text-blue-600 transition hover:underline dark:text-blue-400">
                                    Обрати всі коректні
                                </button>
                                <button type="button" onClick={clearAll}
                                        className="font-medium text-slate-400 transition hover:underline">
                                    Зняти всі
                                </button>
                            </div>
                        </div>
                        {rows.length === 0 &&
                            <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                                Файл не містить жодного рядка з даними.
                            </p>
                        }
                        {rows.length > 0 &&
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="w-8 px-2 py-1.5"></th>
                                            <th className="px-2 py-1.5 text-slate-500 dark:text-slate-400">Рядок</th>
                                            {columns.map((col) => (
                                                <th key={col.key} className="whitespace-nowrap px-2 py-1.5 text-slate-500 dark:text-slate-400">{col.label}</th>
                                            ))}
                                            <th className="w-8 px-2 py-1.5"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, index) => (
                                            <tr key={index}
                                                className={`border-t border-slate-100 dark:border-slate-800 ${!row.valid ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}>
                                                <td className="px-2 py-1.5">
                                                    <Checkbox checked={Boolean(selected[index])} onChange={() => toggleRow(index)} className="dark:border-slate-600"/>
                                                </td>
                                                <td className="px-2 py-1.5 text-slate-400">{row.row}</td>
                                                {columns.map((col) => (
                                                    <td key={col.key} className="px-2 py-1.5 text-slate-700 dark:text-slate-300">
                                                        {col.render
                                                            ? col.render(row)
                                                            : (row[col.key] || <span className="text-slate-300 dark:text-slate-600">—</span>)}
                                                    </td>
                                                ))}
                                                <td className="px-2 py-1.5">
                                                    {!row.valid &&
                                                        <Tooltip content={(row.errors || []).join("; ")}>
                                                            <span className="text-red-500"><i className="fa-solid fa-triangle-exclamation"></i></span>
                                                        </Tooltip>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        }
                    </>
                )}
            </DialogBody>
            <DialogFooter className="gap-x-2">
                {step === "preview" &&
                    <button type="button" onClick={handleBack}
                            className="mr-auto rounded px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                        <i className="fa-solid fa-arrow-left mr-1"></i>Інший файл
                    </button>
                }
                <button type="button" onClick={handleClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                {step === "preview" &&
                    <LoadingButton isLoading={commitMutation.isPending} disabled={!selectedRows.length || commitMutation.isPending}
                                   color="green" onClick={handleImport}>
                        Імпортувати ({selectedRows.length})
                    </LoadingButton>
                }
            </DialogFooter>
        </Dialog>
    );
};

export default ImportPhoneModal;
