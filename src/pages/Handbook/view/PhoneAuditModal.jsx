import {useState} from "react";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner} from "@material-tailwind/react";
import {observer} from "mobx-react-lite";
import {useViewModel} from "../../../shared/mvvm/useViewModel.js";
import {PhoneAuditViewModel} from "../viewmodel/PhoneViewModels.js";
// Історія змін телефонного запису (повні знімки + diff) — той самий UI-патерн,
// що й TaskAuditModal.jsx (ReactPages/Task/Components/Modals/), під наш
// конверт відповіді {success, data, meta, time}. Аудитуються зміни УСІХ
// записів (PhoneAuditService) — немає більше особистих/спільних списків.

const FIELD_LABELS = {
    name: "Ім'я",
    department: "Підрозділ",
    note: "Примітка",
    status: "Стан",
    created_by: "Автор",
    // Ключ саме `phone_numbers` (snake_case) — так серіалізується зв'язок
    // PhoneEntry::phoneNumbers() через toArray() на бекенді (PhoneAuditSchema).
    phone_numbers: "Номери",
};

const ACTION_CONFIG = {
    create: {label: "Створено", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"},
    update: {label: "Оновлено", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"},
    delete: {label: "Видалено", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"},
    archive: {label: "Архівовано", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"},
    restore: {label: "Розархівовано", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"},
    duplicate: {label: "Продубльовано", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"},
    comment_add: {label: "Коментар додано", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300"},
};

const ActionBadge = ({action}) => {
    const cfg = ACTION_CONFIG[action] || {label: action, color: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300"};
    return (
        <span data-i-doc="modal:handbook-phone-audit" className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

const fieldLabel = (field) => {
    const root = field.split(".")[0];
    return FIELD_LABELS[root] || FIELD_LABELS[field] || field;
};

const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return <span className="italic text-gray-400">—</span>;
    }
    if (typeof value === "object") {
        return String(value.name ?? value.phone ?? value.label ?? JSON.stringify(value));
    }
    return String(value);
};

const AuditEntry = ({entry}) => {
    const [open, setOpen] = useState(true);
    const userName = entry.userName || (entry.userId ? `#${entry.userId}` : "—");

    const diffEntries = [];
    if (entry.diff?.changed) {
        Object.entries(entry.diff.changed).forEach(([key, val]) => {
            diffEntries.push([key, {from: val.fromLabel ?? val.from, to: val.toLabel ?? val.to}]);
        });
    }
    if (entry.diff?.added) {
        Object.entries(entry.diff.added).forEach(([key, val]) => {
            const v = (val && typeof val === "object" && "label" in val) ? val.label : val;
            diffEntries.push([key, {from: null, to: v}]);
        });
    }
    if (entry.diff?.removed) {
        Object.entries(entry.diff.removed).forEach(([key, val]) => {
            const v = (val && typeof val === "object" && "label" in val) ? val.label : val;
            diffEntries.push([key, {from: v, to: null}]);
        });
    }

    const contextHint = entry.action === "comment_add" && entry.context?.comment
        ? <span className="max-w-[240px] truncate text-xs text-cyan-600 dark:text-cyan-400">{entry.context.comment}</span>
        : diffEntries.length > 0
            ? <span className="text-xs text-gray-400">({diffEntries.length} зм.)</span>
            : null;

    return (
        <div className="mb-2 overflow-hidden rounded-lg border dark:border-slate-600">
            <button type="button" onClick={() => setOpen((o) => !o)}
                    className="flex w-full items-center justify-between bg-gray-50 px-3 py-2 text-left hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <ActionBadge action={entry.action}/>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{entry.createdAt}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <i className="fa-regular fa-user text-[10px] text-slate-400"></i>{userName}
                    </span>
                    {contextHint}
                </div>
                <i className={`fa-regular fa-chevron-${open ? "up" : "down"} text-xs text-gray-400`}></i>
            </button>

            {open &&
                <div className="px-3 py-2 dark:bg-slate-900/60">
                    {entry.action === "comment_add" ? (
                        <p className="break-words text-xs dark:text-gray-300">{entry.context?.comment}</p>
                    ) : diffEntries.length === 0 ? (
                        <p className="text-xs italic text-gray-400">Немає змін у відстежуваних полях</p>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-gray-500 dark:text-gray-400">
                                    <th className="w-1/4 pb-1">Поле</th>
                                    <th className="w-[37.5%] pb-1">Було</th>
                                    <th className="w-[37.5%] pb-1">Стало</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diffEntries.map(([field, {from, to}]) => (
                                    <tr key={field} className="border-t dark:border-slate-700">
                                        <td className="py-1 font-medium dark:text-gray-300">{fieldLabel(field)}</td>
                                        <td className="py-1 text-red-500 dark:text-red-400">{formatValue(from)}</td>
                                        <td className="py-1 text-green-600 dark:text-green-400">{formatValue(to)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            }
        </div>
    );
};

const PhoneAuditModal = observer(({entryId, onClose}) => {
    const vm = useViewModel((deps) => new PhoneAuditViewModel({ ...deps, entryId }));
    const {history, total, pages, page} = vm;
    const {isFetching, isError} = vm.query;

    return (
        <Dialog open handler={onClose} size="md">
            <DialogHeader className="flex items-center justify-between text-base dark:text-slate-100">
                <span>Історія змін{entryId ? ` · #${entryId}` : ""}</span>
                {total > 0 &&
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{total} запис.</span>
                }
            </DialogHeader>
            <DialogBody className="max-h-[70vh] overflow-y-auto pt-0">
                {isFetching && history.length === 0 ? (
                    <div className="flex justify-center py-10">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : isError ? (
                    <p className="py-6 text-center text-sm text-red-500">Не вдалося завантажити історію</p>
                ) : history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">Записів аудиту ще немає</p>
                ) : (
                    <>
                        {history.map((entry) => <AuditEntry key={entry.id} entry={entry}/>)}
                        {pages > 1 &&
                            <div className="mt-3 flex items-center justify-center gap-3">
                                <Button size="sm" variant="outlined" disabled={page <= 1 || isFetching}
                                        onClick={vm.prev}>
                                    Назад
                                </Button>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{page} / {pages}</span>
                                <Button size="sm" variant="outlined" disabled={page >= pages || isFetching}
                                        onClick={vm.next}>
                                    Далі
                                </Button>
                            </div>
                        }
                    </>
                )}
            </DialogBody>
            <DialogFooter>
                <Button variant="text" onClick={onClose} className="dark:text-slate-200">Закрити</Button>
            </DialogFooter>
        </Dialog>
    );
});

export default PhoneAuditModal;
