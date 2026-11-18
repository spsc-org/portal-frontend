import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { DossierAuditViewModel } from "../../viewmodel/DossierViewModels.js";
import { Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import AuditPager from "../../../../components/Audit/AuditPager.jsx";
import {useState} from "react";
import { AUDIT_BODY, AUDIT_CARD, AUDIT_EMPTY, AUDIT_HEAD, AUDIT_META, AUDIT_USER, DIFF_FIELD, DIFF_FROM, DIFF_HEAD_ROW, DIFF_TABLE, DIFF_TH, DIFF_TO, DIFF_TR } from "../../../../components/Audit/auditStyles.js";

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
            return <span className="italic text-gray-600 dark:text-gray-400">—</span>;
        }
        if (typeof value === "object") {
            return String(value.name ?? value.label ?? JSON.stringify(value));
        }
        return String(value);
    };

    return (
        <div className={AUDIT_CARD}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={AUDIT_HEAD}
            >
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <ActionBadge action={entry.action}/>
                    <span className={AUDIT_META}>{entry.createdAt}</span>
                    <span className={AUDIT_USER}>{userName}</span>
                    {diffEntries.length > 0 && (
                        <span className={AUDIT_META}>({diffEntries.length} зм.)</span>
                    )}
                </div>
                <i className={`fa-regular fa-chevron-${open ? "up" : "down"} text-xs text-gray-600`}/>
            </button>

            {open && (
                <div className={AUDIT_BODY}>
                    {diffEntries.length === 0 ? (
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
                                    <td className={DIFF_FIELD}>
                                        {fieldLabel(field)}
                                    </td>
                                    <td className={DIFF_FROM}>
                                        {formatValue(from)}
                                    </td>
                                    <td className={DIFF_TO}>
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
        <Modal open onClose={onClose} size="md">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">Історія змін{profileId ? ` · досьє #${profileId}` : ""}</h3>
                {total > 0 && <span className="ml-auto shrink-0 text-xs font-normal text-gray-600 dark:text-gray-400">{total} запис.</span>}
            </ModalHeader>
            <ModalBody>
                {isFetching && history.length === 0 ? (
                    <div className="flex justify-center py-10">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : isError ? (
                    <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">
                        Не вдалося завантажити історію
                    </p>
                ) : history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Записів аудиту ще немає
                    </p>
                ) : (
                    <>
                        {history.map((entry) => (
                            <AuditEntry key={entry.id} entry={entry} users={users}/>
                        ))}
                        <AuditPager page={page} pages={pages} onChange={setPage} disabled={isFetching} prevLabel="‹ Назад" nextLabel="Далі ›"/>
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>Закрити</Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(DossierAuditModal);
