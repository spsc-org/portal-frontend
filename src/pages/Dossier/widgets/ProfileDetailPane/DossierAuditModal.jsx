import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { DossierAuditViewModel } from "../../viewmodel/DossierViewModels.js";
import { Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import {useState} from "react";

// Історія змін досьє (повні знімки профілю зі звʼязками й тікетами + diff) — той самий
// UI-патерн, що й TaskAuditModal (Task/Components/Modals/TaskAuditModal.jsx), адаптований
// під App\Enums\Audit\DossierAuditAction. Аудит — усього ПРОФІЛЮ (не окремо звʼязку/тікета),
// тож усі дії тут стосуються одного й того самого entityId=profileId.

const FIELD_LABELS = {
    view_caption: "Назва",
    view_caption_edited: "Назва відредагована вручну",
    drs_id: "ДРС id",
    subject_type_id: "Тип субʼєкта",
    ua_sanctions_status: "Стан підсанкційності",
    ua_sanctions_days_remaining: "Днів до завершення санкцій",
    connections: "Звʼязки",
    tickets: "Тікети",
};

const ACTION_CONFIG = {
    link: {label: "Звʼязано", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"},
    confirm: {label: "Підтверджено", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"},
    move: {label: "Перенесено", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"},
    unlink: {label: "Відвʼязано", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"},
    link_profiles: {label: "Звʼязано профілі", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"},
    unlink_profiles: {label: "Розʼязано профілі", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"},
    update_caption: {label: "Змінено назву", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"},
    upload_avatar: {label: "Завантажено фото", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"},
    delete_avatar: {label: "Видалено фото", color: "bg-gray-100 text-gray-800 dark:bg-neutral-600 dark:text-gray-300"},
    delete: {label: "Видалено профіль", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"},
    ticket_create: {label: "Створено тікет", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300"},
    ticket_resolve: {label: "Тікет вирішено", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"},
};

const ActionBadge = ({action}) => {
    const cfg = ACTION_CONFIG[action] || {label: action, color: "bg-gray-100 text-gray-800 dark:bg-neutral-600 dark:text-gray-300"};
    return (
        <span data-i-doc="modal:dossier-audit" className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

const fieldLabel = (field) => {
    const root = field.split(".")[0];
    return FIELD_LABELS[root] || FIELD_LABELS[field] || field;
};

const AuditEntry = ({entry, users}) => {
    const [open, setOpen] = useState(true);
    const userName = users?.find((u) => Number(u.id) === Number(entry.userId))?.name
        || (entry.userId ? `#${entry.userId}` : "—");

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

    const formatValue = (value) => {
        if (value === null || value === undefined || value === "") {
            return <span className="text-gray-600 italic">—</span>;
        }
        if (typeof value === "object") {
            return String(value.name ?? value.label ?? JSON.stringify(value));
        }
        return String(value);
    };

    return (
        <div className="mb-2 overflow-hidden rounded-lg border dark:border-gray-600">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between bg-gray-50 px-3 py-2 text-left hover:bg-gray-100 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            >
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <ActionBadge action={entry.action}/>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{entry.createdAt}</span>
                    <span className="text-xs dark:text-gray-300">{userName}</span>
                    {diffEntries.length > 0 && (
                        <span className="text-xs text-gray-600">({diffEntries.length} зм.)</span>
                    )}
                </div>
                <i className={`fa-regular fa-chevron-${open ? "up" : "down"} text-xs text-gray-600`}/>
            </button>

            {open && (
                <div className="px-3 py-2 dark:bg-neutral-800/60">
                    {diffEntries.length === 0 ? (
                        <p className="text-xs italic text-gray-600">Немає змін у відстежуваних полях</p>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                            <tr className="text-left text-gray-600 dark:text-gray-400">
                                <th className="w-1/4 pb-1">Поле</th>
                                <th className="w-[37.5%] pb-1">Було</th>
                                <th className="w-[37.5%] pb-1">Стало</th>
                            </tr>
                            </thead>
                            <tbody>
                            {diffEntries.map(([field, {from, to}]) => (
                                <tr key={field} className="border-t dark:border-neutral-700">
                                    <td className="py-1 font-medium dark:text-gray-300">
                                        {fieldLabel(field)}
                                    </td>
                                    <td className="py-1 text-red-500 dark:text-red-400">
                                        {formatValue(from)}
                                    </td>
                                    <td className="py-1 text-green-600 dark:text-green-400">
                                        {formatValue(to)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

const DossierAuditModal = ({profileId, users = [], onClose}) => {
    const vm = useViewModel((deps) => new DossierAuditViewModel({ ...deps, profileId }));
    const page = vm.page;
    const setPage = vm.setPage;
    const { data, isFetching, isError } = vm.query;
    const history = data?.data ?? [];
    const total = data?.meta?.total ?? 0;
    const pages = data?.meta?.pages ?? 1;

    return (
        <Modal open handler={onClose} size="md">
            <ModalHeader className="flex items-center justify-between text-base">
                <span>Історія змін{profileId ? ` · досьє #${profileId}` : ""}</span>
                {total > 0 && (
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                        {total} запис.
                    </span>
                )}
            </ModalHeader>
            <ModalBody className="max-h-[70vh] overflow-y-auto pt-0">
                {isFetching && history.length === 0 ? (
                    <div className="flex justify-center py-10">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : isError ? (
                    <p className="py-6 text-center text-sm text-red-500">
                        Не вдалося завантажити історію
                    </p>
                ) : history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-600">
                        Записів аудиту ще немає
                    </p>
                ) : (
                    <>
                        {history.map((entry) => (
                            <AuditEntry key={entry.id} entry={entry} users={users}/>
                        ))}
                        {pages > 1 && (
                            <div className="mt-3 flex items-center justify-center gap-3">
                                <Button
                                    size="sm"
                                    variant="outlined"
                                    disabled={page <= 1 || isFetching}
                                    onClick={() => setPage((p) => p - 1)}>
                                    Назад
                                </Button>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {page} / {pages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outlined"
                                    disabled={page >= pages || isFetching}
                                    onClick={() => setPage((p) => p + 1)}>
                                    Далі
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <Button variant="text" onClick={onClose} className="dark:text-gray-200">
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(DossierAuditModal);
