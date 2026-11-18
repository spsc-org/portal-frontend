import { useRef } from "react";
import { observer } from "mobx-react-lite";
import { Checkbox, Switch, Tooltip } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { ImportViewModel } from "../viewmodel/ImportViewModel.js";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "../../../components/Table/tableStyles.js";

// Двокроковий імпорт з Excel-заготовки (вибір файлу → перегляд розпарсених
// рядків із чекбоксами → підтвердження обраних) — використовується лише
// Днями народження (canMarkDefault/isDefault — їхня модель спільного/
// особистого списку); Телефони мають окрему ImportPhoneModal.jsx (2026-08-03,
// без цих пропів — Телефони більше не мають такого поняття). Бекенд нічого
// не зберігає між кроками — розпарсені рядки тримає React state, той самий
// стан-less підхід, що й у наявному імпорті проєктів (UploadProjectsV2).
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
const ImportModal = ({ onClose, title, templateUrl, columns, previewSpec, commitSpec, onImported, canMarkDefault = false, iDoc = "modal:handbook-import" }) => {
    const vm = useViewModel((deps) => new ImportViewModel({ ...deps, previewSpec, commitSpec, canMarkDefault, onImported, onDone: onClose }));
    const fileInputRef = useRef(null);
    const { step, rows, selected, selectedRows, fileName, isDefault } = vm;

    const handleBack = () => {
        vm.back();
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Modal data-i-doc={iDoc} open handler={onClose} size={step === "preview" ? "lg" : "sm"} className="flex max-h-[90vh] flex-col">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">{title}</h3>
            </ModalHeader>
            <ModalBody className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
                {step === "pick" ? (
                    <>
                        <a href={templateUrl}
                           className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400">
                            <i className="fa-regular fa-file-arrow-down"></i>
                            Завантажити заготовку Excel
                        </a>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Файл (.xlsx, .xls)</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => vm.pickFile(e.target.files?.[0])}
                                className="w-full rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-600 focus:border-blue-300 focus:outline-none dark:border-neutral-700 dark:bg-neutral-700 dark:text-gray-300 dark:file:bg-neutral-600 dark:file:text-gray-300"
                            />
                        </div>
                        {vm.preview.isPending &&
                            <p className="text-xs text-gray-600 dark:text-gray-500">Розпізнаю файл…</p>
                        }
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>
                                <i className="fa-regular fa-file-excel mr-1.5"></i>{fileName} — знайдено {rows.length},
                                коректних {vm.validCount}
                            </span>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={vm.selectAllValid}
                                        className="font-medium text-blue-600 transition hover:underline dark:text-blue-400">
                                    Обрати всі коректні
                                </button>
                                <button type="button" onClick={vm.clearAll}
                                        className="font-medium text-gray-600 transition hover:underline">
                                    Зняти всі
                                </button>
                            </div>
                        </div>
                        {rows.length === 0 &&
                            <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-xs text-gray-600 dark:border-neutral-700 dark:text-gray-500">
                                Файл не містить жодного рядка з даними.
                            </p>
                        }
                        {rows.length > 0 &&
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                            <div className={twMerge(TABLE_WRAP, "")}>
                                <table className={twMerge(TABLE, "w-full text-left")}>
                                    <thead>
                                        <tr>
                                            <th className={twMerge(TH, "w-8")}></th>
                                            <th className={TH}>Рядок</th>
                                            {columns.map((col) => (
                                                <th key={col.key} className={twMerge(TH, "whitespace-nowrap")}>{col.label}</th>
                                            ))}
                                            <th className={twMerge(TH, "w-8")}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, index) => (
                                            <tr key={index}
                                                className={twMerge(TR, `border-t border-gray-100 dark:border-neutral-700 ${!row.valid ? "bg-red-50/50 dark:bg-red-900/10" : ""}`)}>
                                                <td className={TD}>
                                                    <Checkbox checked={Boolean(selected[index])} onChange={() => vm.toggleRow(index)} className="dark:border-gray-600"/>
                                                </td>
                                                <td className={TD}>{row.row}</td>
                                                {columns.map((col) => (
                                                    <td key={col.key} className={TD}>
                                                        {col.render
                                                            ? col.render(row)
                                                            : (row[col.key] || <span className="text-gray-300 dark:text-gray-600">—</span>)}
                                                    </td>
                                                ))}
                                                <td className={TD}>
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
                        {canMarkDefault &&
                            <div className="flex w-fit items-center gap-2">
                                <span className={`text-sm ${!isDefault ? "font-semibold text-gray-800 dark:text-gray-100" : "text-gray-600 dark:text-gray-500"}`}>
                                    Мій список
                                </span>
                                <Switch checked={isDefault} onChange={(e) => vm.setIsDefault(e.target.checked)} color="blue"/>
                                <span className={`text-sm ${isDefault ? "font-semibold text-gray-800 dark:text-gray-100" : "text-gray-600 dark:text-gray-500"}`}>
                                    Загальний список
                                </span>
                            </div>
                        }
                    </>
                )}
            </ModalBody>
            <ModalFooter className="gap-x-2">
                {step === "preview" &&
                    <button type="button" onClick={handleBack}
                            className="mr-auto rounded px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:hover:bg-neutral-700">
                        <i className="fa-solid fa-arrow-left mr-1"></i>Інший файл
                    </button>
                }
                <button type="button" onClick={onClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                {step === "preview" &&
                    <LoadingButton isLoading={vm.commit.isPending} disabled={!selectedRows.length || vm.commit.isPending}
                                   color="green" onClick={vm.submit}>
                        Імпортувати ({selectedRows.length})
                    </LoadingButton>
                }
            </ModalFooter>
        </Modal>
    );
};

export default observer(ImportModal);
