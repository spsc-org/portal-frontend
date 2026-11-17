import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { TaskAuditViewModel } from "../../viewmodel/TaskViewModels.js";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner} from "@material-tailwind/react";
import {useState} from "react";

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
    file_detach: {label: 'Видалено файл', color: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300'},
    comment_add: {label: 'Коментар додано', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'},
};

const ActionBadge = ({action}) => {
    const cfg = ACTION_CONFIG[action] || {label: action, color: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300'};
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
            return <span className="text-gray-400 italic">—</span>;
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
            return <span className="text-xs text-gray-400">({diffEntries.length} зм.)</span>;
        }
        return null;
    })();

    return (
        <div className="mb-2 overflow-hidden rounded-lg border dark:border-slate-600">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between bg-gray-50 px-3 py-2 text-left hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <ActionBadge action={entry.action}/>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{entry.createdAt}</span>
                    <span className="text-xs dark:text-gray-300">{userName}</span>
                    {contextHint}
                </div>
                <i className={`fa-regular fa-chevron-${open ? 'up' : 'down'} text-xs text-gray-400`}/>
            </button>

            {open && (
                <div className="px-3 py-2 dark:bg-slate-900/60">
                    {entry.context?.fileName ? (
                        <p className="text-xs dark:text-gray-300">
                            Файл:&nbsp;
                            <span className="font-medium text-blue-700 dark:text-blue-300">
                                {entry.context.fileName}
                            </span>
                        </p>
                    ) : entry.action === 'merge' && entry.context?.donorId ? (
                        <p className="text-xs dark:text-gray-300">
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

const TaskAuditModal = ({taskId, users = [], onClose}) => {
    const vm = useViewModel((deps) => new TaskAuditViewModel({ ...deps, taskId }));
    const { page, history, total, pages, isFetching, isError } = vm;
    const setPage = vm.setPage;

    return (
        <Dialog open handler={onClose} size="md">
            <DialogHeader className="flex items-center justify-between text-base dark:text-slate-100">
                <span>Історія змін{taskId ? ` · #${taskId}` : ''}</span>
                {total > 0 && (
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        {total} запис.
                    </span>
                )}
            </DialogHeader>
            <DialogBody className="max-h-[70vh] overflow-y-auto pt-0">
                {isFetching && history.length === 0 ? (
                    <div className="flex justify-center py-10">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : isError ? (
                    <p className="py-6 text-center text-sm text-red-500">
                        Не вдалося завантажити історію
                    </p>
                ) : history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">
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
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Назад
                                </Button>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {page} / {pages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outlined"
                                    disabled={page >= pages || isFetching}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Далі
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </DialogBody>
            <DialogFooter>
                <Button variant="text" onClick={onClose} className="dark:text-slate-200">
                    Закрити
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(TaskAuditModal);
