import {useRef, useState} from "react";
import {Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import LoadingButton from "../../../../components/Buttons/LoadingButton.jsx";
import {massSearchImportTemplateUrl} from "../../entities/job/importApi.js";
import {useCommitMassSearchImportMutation, usePreviewMassSearchImportMutation} from "../../entities/job/queries.js";

// Колонки превʼю — той самий фіксований шаблон, що в "Інформування (2В)".
const COLUMNS = [
    {key: "entity_type", label: "Фіз./Юр."},
    {key: "name_ukrainian", label: "Назва (укр)"},
    {key: "name_russian", label: "Назва (рос)"},
    {key: "name_latin", label: "Назва (лат)"},
    {key: "birth_date", label: "Дата народж. (фіз)"},
    {key: "person_identifier_codes", label: "Ідент. коди (фіз)"},
    {key: "person_passports", label: "Паспорти (фіз)"},
    {key: "organization_reg_codes", label: "Реєстр. коди (юр)"},
    {key: "organization_tax_codes", label: "Податк. коди (юр)"},
];

// Двокроковий імпорт (вибір файлу → перегляд розпарсених рядків →
// підтвердження обраних) — той самий каркас, що ImportPhoneModal.jsx.
// На відміну від нього: БЕЗ прапорця valid/errors — валідація рядків
// свідомо відкладена на майбутній етап (рішення 2026-11-11), тож усі
// розпарсені рядки позначені одразу.
const ImportMassSearchJobModal = ({open, onClose, onImported}) => {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState("");
    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState({});

    const previewMutation = usePreviewMassSearchImportMutation();
    const commitMutation = useCommitMassSearchImportMutation();

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
                const parsedRows = result.rows || [];
                setRows(parsedRows);
                const initialSelected = {};
                parsedRows.forEach((_, index) => {
                    initialSelected[index] = true;
                });
                setSelected(initialSelected);
            },
        });
    };

    const toggleRow = (index) => setSelected((prev) => ({...prev, [index]: !prev[index]}));
    const selectAll = () => {
        const next = {};
        rows.forEach((_, index) => {
            next[index] = true;
        });
        setSelected(next);
    };
    const clearAll = () => setSelected({});

    const selectedRows = rows.filter((_, index) => selected[index]);

    const handleImport = () => {
        if (!selectedRows.length) return;
        commitMutation.mutate({rows: selectedRows, fileName}, {
            onSuccess: (job) => {
                onImported?.(job);
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
        <Dialog data-i-doc="modal:mass-search-import" open={open} handler={handleClose} size={step === "preview" ? "xl" : "sm"} className="flex max-h-[90vh] flex-col">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">Новий масовий пошук</Typography>
            </DialogHeader>
            <DialogBody className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
                {step === "pick" ? (
                    <>
                        <a href={massSearchImportTemplateUrl}
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
                                <i className="fa-regular fa-file-excel mr-1.5"></i>{fileName} — знайдено {rows.length}
                            </span>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={selectAll}
                                        className="font-medium text-blue-600 transition hover:underline dark:text-blue-400">
                                    Обрати всі
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
                                            {COLUMNS.map((col) => (
                                                <th key={col.key} className="whitespace-nowrap px-2 py-1.5 text-slate-500 dark:text-slate-400">{col.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, index) => (
                                            <tr key={index} className="border-t border-slate-100 dark:border-slate-800">
                                                <td className="px-2 py-1.5">
                                                    <Checkbox checked={Boolean(selected[index])} onChange={() => toggleRow(index)} className="dark:border-slate-600"/>
                                                </td>
                                                <td className="px-2 py-1.5 text-slate-400">{row.row}</td>
                                                {COLUMNS.map((col) => (
                                                    <td key={col.key} className="whitespace-nowrap px-2 py-1.5 text-slate-700 dark:text-slate-300">
                                                        {row[col.key] || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                    </td>
                                                ))}
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
                        Створити завдання ({selectedRows.length})
                    </LoadingButton>
                }
            </DialogFooter>
        </Dialog>
    );
};

export default ImportMassSearchJobModal;
