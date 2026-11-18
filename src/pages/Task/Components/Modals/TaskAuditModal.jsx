import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { TaskAuditViewModel } from "../../viewmodel/TaskViewModels.js";
import { Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import AuditPager from "../../../../components/Audit/AuditPager.jsx";
import {useState} from "react";
import { AUDIT_BODY, AUDIT_CARD, AUDIT_EMPTY, AUDIT_HEAD, AUDIT_META, AUDIT_USER, DIFF_FIELD, DIFF_FROM, DIFF_HEAD_ROW, DIFF_TABLE, DIFF_TH, DIFF_TO, DIFF_TR } from "../../../../components/Audit/auditStyles.js";

// Історія змін задачі (повні знімки + diff) — той самий UI-патерн, що
// вкладка «Історія» в InventoryDetailsModal, але окремою модалкою з картки.

const FIELD_LABELS = {
    title: 'Назва',
    description: 'Опис',
    dueDate: 'Термін',
    statusId: 'Статус',
    typeId: 'Тип',
    priorityId: 'Пріоритет',
    projectId: 'Проєкт',
    createdUserId: 'Автор',
    updatedUserId: 'Оновив',
    statusChangedByUserId: 'Змінив статус',
    assignedUserId: 'Виконавець',
    assignedUsers: 'Учасники',
    tags: 'Теги',
    links: 'Звʼязки',
    attachments: 'Вкладення',
};

const ACTION_CONFIG = {
    create: {label: 'Створено', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'},
    update: {label: 'Оновлено', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'},
    delete: {label: 'Видалено', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'},
    restore: {label: 'Відновлено', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'},
    merge: {label: 'Злито', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'},
    file_attach: {label: 'Додано файл', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'},
    file_detach: {label: 'Видалено файл', color: 'bg-gray-100 text-gray-800 dark:bg-neutral-600 dark:text-gray-300'},
    comment_add: {label: 'Коментар додано', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'},
};

const ActionBadge = ({action}) => {
    const cfg = ACTION_CONFIG[action] || {label: action, color: 'bg-gray-100 text-gray-800 dark:bg-neutral-600 dark:text-gray-300'};
    return (
        <span data-i-doc="modal:task-audit" className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

const fieldLabel = (field) => {
    const root = field.split('.')[0];
    return FIELD_LABELS[root] || FIELD_LABELS[field] || field;
};

const AuditEntry = ({entry, users}) => {
    const [open, setOpen] = useState(true);
    const userName = users?.find((u) => Number(u.id) === Number(entry.userId))?.name
        || (entry.userId ? `#${entry.userId}` : '—');

    const diffEntries = [];
    if (entry.diff?.changed) {
        Object.entries(entry.diff.changed).forEach(([key, val]) => {
            diffEntries.push([key, {from: val.fromLabel ?? val.from, to: val.toLabel ?? val.to}]);
        });
    }
    if (entry.diff?.added) {
        Object.entries(entry.diff.added).forEach(([key, val]) => {
            const v = (val && typeof val === 'object' && 'label' in val) ? val.label : val;
            diffEntries.push([key, {from: null, to: v}]);
        });
    }
    if (entry.diff?.removed) {
        Object.entries(entry.diff.removed).forEach(([key, val]) => {
            const v = (val && typeof val === 'object' && 'label' in val) ? val.label : val;
            diffEntries.push([key, {from: v, to: null}]);
        });
    }

    const formatValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return <span className="italic text-gray-600 dark:text-gray-400">—</span>;
        }
        if (typeof value === 'object') {
            return String(value.name ?? value.fileName ?? value.label ?? JSON.stringify(value));
        }
        return String(value);
    };

    const contextHint = (() => {
        if (entry.context?.fileName) {
            return <span className="text-xs text-blue-500 dark:text-blue-400">{entry.context.fileName}</span>;
        }
        if (entry.action === 'merge' && entry.context?.donorId) {
            return (
                <span className="text-xs text-teal-600 dark:text-teal-400">
                    з #{entry.context.donorId}
                    {entry.context.donorTitle ? ` «${entry.context.donorTitle}»` : ''}
                </span>
            );
        }
        if (entry.action === 'comment_add' && entry.context?.comment) {
            return (
                <span className="text-xs text-cyan-600 dark:text-cyan-400 truncate max-w-[240px]">
                    {entry.context.comment}
                </span>
            );
        }
        if (diffEntries.length > 0) {
            return <span className={AUDIT_META}>({diffEntries.length} зм.)</span>;
        }
        return null;
    })();

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
                    {contextHint}
                </div>
                <i className={`fa-regular fa-chevron-${open ? 'up' : 'down'} text-xs text-gray-600`}/>
            </button>

            {open && (
                <div className={AUDIT_BODY}>
                    {entry.context?.fileName ? (
                        <p className={AUDIT_USER}>
                            Файл:&nbsp;
                            <span className="font-medium text-blue-700 dark:text-blue-300">
                                {entry.context.fileName}
                            </span>
                        </p>
                    ) : entry.action === 'merge' && entry.context?.donorId ? (
                        <p className={AUDIT_USER}>
                            Донор:&nbsp;
                            <span className="font-medium text-teal-700 dark:text-teal-300">
                                #{entry.context.donorId}
                                {entry.context.donorTitle ? ` «${entry.context.donorTitle}»` : ''}
                            </span>
                        </p>
                    ) : entry.action === 'comment_add' ? (
                        <p className="break-words text-xs dark:text-gray-300">
                            {entry.context?.comment}
                        </p>
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

const TaskAuditModal = ({taskId, users = [], onClose}) => {
    const vm = useViewModel((deps) => new TaskAuditViewModel({ ...deps, taskId }));
    const { page, history, total, pages, isFetching, isError } = vm;
    const setPage = vm.setPage;

    return (
        <Modal open onClose={onClose} size="md">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">Історія змін{taskId ? ` · #${taskId}` : ''}</h3>
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

export default observer(TaskAuditModal);
