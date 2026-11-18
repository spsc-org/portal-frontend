import {useState} from "react";
import { Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import AuditPager from "../../../components/Audit/AuditPager.jsx";
import {observer} from "mobx-react-lite";
import {useViewModel} from "../../../shared/mvvm/useViewModel.js";
import {PhoneAuditViewModel} from "../viewmodel/PhoneViewModels.js";
import { AUDIT_BODY, AUDIT_CARD, AUDIT_EMPTY, AUDIT_HEAD, AUDIT_META, DIFF_FIELD, DIFF_FROM, DIFF_HEAD_ROW, DIFF_TABLE, DIFF_TH, DIFF_TO, DIFF_TR } from "../../../components/Audit/auditStyles.js";
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
    const cfg = ACTION_CONFIG[action] || {label: action, color: "bg-gray-100 text-gray-800 dark:bg-neutral-600 dark:text-gray-300"};
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
        return <span className="italic text-gray-600">—</span>;
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
            ? <span className={AUDIT_META}>({diffEntries.length} зм.)</span>
            : null;

    return (
        <div className={AUDIT_CARD}>
            <button type="button" onClick={() => setOpen((o) => !o)}
                    className={AUDIT_HEAD}>
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <ActionBadge action={entry.action}/>
                    <span className={AUDIT_META}>{entry.createdAt}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
                        <i className="fa-regular fa-user text-[10px] text-gray-500"></i>{userName}
                    </span>
                    {contextHint}
                </div>
                <i className={`fa-regular fa-chevron-${open ? "up" : "down"} text-xs text-gray-600`}></i>
            </button>

            {open &&
                <div className={AUDIT_BODY}>
                    {entry.action === "comment_add" ? (
                        <p className="break-words text-xs dark:text-gray-300">{entry.context?.comment}</p>
                    ) : diffEntries.length === 0 ? (
                        <p className={AUDIT_EMPTY}>Немає змін у відстежуваних полях</p>
                    ) : (
                        <table className={DIFF_TABLE}>
                            <thead>
                                <tr className={DIFF_HEAD_ROW}>
                                    <th className={`${DIFF_TH} w-1/4`}>Поле</th>
                                    <th className={`${DIFF_TH} w-[37.5%]`}>Було</th>
                                    <th className={`${DIFF_TH} w-[37.5%]`}>Стало</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diffEntries.map(([field, {from, to}]) => (
                                    <tr key={field} className={DIFF_TR}>
                                        <td className={DIFF_FIELD}>{fieldLabel(field)}</td>
                                        <td className={DIFF_FROM}>{formatValue(from)}</td>
                                        <td className={DIFF_TO}>{formatValue(to)}</td>
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
        <Modal open onClose={onClose} size="md">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">Історія змін{entryId ? ` · #${entryId}` : ""}</h3>
                {total > 0 && <span className="ml-auto shrink-0 text-xs font-normal text-gray-600 dark:text-gray-400">{total} запис.</span>}
            </ModalHeader>
            <ModalBody>
                {isFetching && history.length === 0 ? (
                    <div className="flex justify-center py-10">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : isError ? (
                    <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">Не вдалося завантажити історію</p>
                ) : history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">Записів аудиту ще немає</p>
                ) : (
                    <>
                        {history.map((entry) => <AuditEntry key={entry.id} entry={entry}/>)}
                        <AuditPager page={page} pages={pages} onChange={(next) => (next < page ? vm.prev() : vm.next())} disabled={isFetching} prevLabel="‹ Назад" nextLabel="Далі ›"/>
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>Закрити</Button>
            </ModalFooter>
        </Modal>
    );
});

export default PhoneAuditModal;
