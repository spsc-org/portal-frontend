import React, {useEffect, useState} from "react";
import {Dialog, DialogBody, DialogFooter, DialogHeader, IconButton, Spinner, Tooltip} from "@material-tailwind/react";
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import UserAvatars from "../../../../Components/UserAvatars.jsx";
import ChipToggle from "../../../../Components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../../Components/fields/ChipResetButton.jsx";
import SingleSelect from "../../../../Components/fields/SingleSelect.jsx";
import MultiSelect from "../../../../Components/fields/MultiSelect.jsx";
import DatePicker from "../../../../Components/fields/DatePicker.jsx";
import {LabeledInput} from "../../../../Components/fields/LabeledField.jsx";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import {canAssignResponsibleUser, canCreateAnyResponsibleAssignment, canManageResponsibleAssignment} from "../../shared/lib/responsiblePermissions.js";
import {
    useAssignResponsibleMutation,
    useEndResponsibleAssignmentMutation,
    useResponsibleAssignmentsQuery,
    useUpdateResponsibleAssignmentMutation,
} from "../../entities/responsible/queries.js";

const toDateString = (date) => format(date, "yyyy-MM-dd");

// Один модал на створення І редагування — призначення це акт (функція +
// підстава + дата початку/кінця), що стосується ОДРАЗУ ГРУПИ людей (напр.
// один наказ призначає кількох відповідальних), тому вибір людей — завжди
// мультивибір, і в редагуванні так само (склад групи можна змінювати).
const AssignmentModal = ({open, onClose, assignment = null, functionOptions, userOptions, defaultFunctionId}) => {
    const isEditing = Boolean(assignment);
    const [func, setFunc] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [reason, setReason] = useState("");
    const [startedAt, setStartedAt] = useState(undefined);
    const [endedAt, setEndedAt] = useState(undefined);

    const assignMutation = useAssignResponsibleMutation();
    const updateMutation = useUpdateResponsibleAssignmentMutation();
    const isPending = assignMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (!open) return;

        if (assignment) {
            setFunc(functionOptions.find((f) => Number(f.id) === Number(assignment.function_id)) || null);
            setSelectedUsers((assignment.users || []).map((u) => ({id: u.id, caption: u.name})));
            setReason(assignment.reason || "");
            setStartedAt(assignment.started_at ? new Date(assignment.started_at) : undefined);
            setEndedAt(assignment.ended_at ? new Date(assignment.ended_at) : undefined);
        } else {
            setFunc(functionOptions.find((f) => Number(f.id) === Number(defaultFunctionId)) || null);
            setSelectedUsers([]);
            setReason("");
            setStartedAt(new Date());
            setEndedAt(undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, assignment]);

    const handleSave = () => {
        if (!func || selectedUsers.length === 0 || !startedAt) return;

        const userIds = selectedUsers.map((u) => u.id);

        if (isEditing) {
            updateMutation.mutate(
                {
                    assignmentId: assignment.id,
                    functionId: func.id,
                    userIds,
                    reason,
                    startedAt: toDateString(startedAt),
                    endedAt: endedAt ? toDateString(endedAt) : null,
                },
                {onSuccess: onClose},
            );
        } else {
            assignMutation.mutate(
                {functionId: func.id, userIds, startedAt: toDateString(startedAt), reason},
                {onSuccess: onClose},
            );
        }
    };

    return (
        <Dialog data-i-doc="modal:staff-responsible-assignment" open={open} handler={onClose} size="sm">
            <DialogHeader>{isEditing ? "Редагувати призначення" : "Нове призначення"}</DialogHeader>
            <DialogBody className="flex flex-col gap-3">
                <SingleSelect id="assignment-function" label="Функція" options={functionOptions} value={func} onChange={setFunc}/>
                <MultiSelect id="assignment-users" label="Користувачі" options={userOptions} value={selectedUsers} onChange={setSelectedUsers}/>
                <LabeledInput label="Підстава (необов'язково)" value={reason} onChange={(e) => setReason(e.target.value)}
                              placeholder="Напр. Наказ №12 від 01.08.2026"/>
                <DatePicker label="Дата початку" value={startedAt} onChange={setStartedAt}/>
                {isEditing &&
                    <DatePicker label="Дата закінчення (необов'язково)" value={endedAt} onChange={setEndedAt}/>
                }
            </DialogBody>
            <DialogFooter className="gap-2">
                <LoadingButton variant="outlined" color="blue-gray" onClick={onClose} disabled={isPending}>
                    Скасувати
                </LoadingButton>
                <LoadingButton color="blue" onClick={handleSave} isLoading={isPending}
                                disabled={!func || selectedUsers.length === 0 || !startedAt}>
                    Зберегти
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

// "Призначення" — плаский список УСІХ призначень (активні й скасовані —
// скасоване лишається видимим в історії, не зникає), один рядок = один акт
// (функція + група людей + підстава + дата). Фільтр за функцією тут НЕ
// потрібен окремим чипом — в один момент дивимось одну функцію через клік у
// ТАБ "Функції" (selectedFunctionId); лишається лише перемикач "лише діючі".
const ResponsibleAssignmentsTable = ({auth, functions = [], users = [], selectedFunctionId}) => {
    const [onlyActive, setOnlyActive] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);

    const {data: assignmentsData, isLoading} = useResponsibleAssignmentsQuery();
    const rows = assignmentsData || [];

    const endMutation = useEndResponsibleAssignmentMutation();

    const functionOptions = functions.map((f) => ({id: f.id, caption: f.name}));
    const userOptions = users.filter((u) => !u.deleted_at).map((u) => ({id: u.id, caption: u.name}));

    const hasActive = onlyActive;

    const filtered = rows.filter((row) => {
        if (selectedFunctionId != null && Number(row.function_id) !== Number(selectedFunctionId)) return false;
        if (onlyActive && row.ended_at) return false;
        return true;
    });

    const canCreate = canCreateAnyResponsibleAssignment(auth);
    const assignableUserOptions = canCreate ? userOptions.filter((u) => canAssignResponsibleUser(auth, u.id)) : [];

    return (
        <div data-i-doc="widget:staff-responsible-assignments">
            <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-1 py-2 dark:border-slate-700 dark:bg-neutral-900">
                <ChipToggle active={onlyActive} onClick={() => setOnlyActive((prev) => !prev)}
                            icon="fa-regular fa-circle-check" label="Лише діючі"/>
                <ChipResetButton onClick={() => setOnlyActive(false)} hasActive={hasActive} label="Скинути"/>

                {canCreate &&
                    <button type="button" onClick={() => setIsCreateOpen(true)}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                        <i className="fa-solid fa-plus"></i>
                        Нове призначення
                    </button>
                }
            </div>

            <div className="max-w-full overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-800">
                <table className="w-full table-auto text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead>
                        <tr className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                            <th className="px-3 py-2 font-normal">Функція</th>
                            <th className="px-3 py-2 font-normal">Користувачі</th>
                            <th className="px-3 py-2 font-normal">Підстава</th>
                            <th className="px-3 py-2 font-normal">З дати</th>
                            <th className="px-3 py-2 font-normal">До дати</th>
                            <th className="px-3 py-2 font-normal">Статус</th>
                            <th className="px-3 py-2 font-normal">Дії</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                        {!isLoading && filtered.length === 0 &&
                            <tr>
                                <td colSpan={7} className="px-3 py-6 text-center text-gray-400 dark:text-slate-500">
                                    {selectedFunctionId != null ? "У цієї функції ще немає призначень" : "Нічого не знайдено"}
                                </td>
                            </tr>
                        }
                        {filtered.map((row) => {
                            const canManage = canManageResponsibleAssignment(auth, row);
                            const isEnded = Boolean(row.ended_at);
                            return (
                                <tr key={row.id}
                                    className={`${isEnded ? "opacity-60" : ""} bg-neutral-100 hover:bg-neutral-200 dark:bg-gray-900 dark:hover:bg-neutral-700`}>
                                    <td className="px-3 py-2 font-semibold text-gray-800 dark:text-slate-200">{row.function?.name || "—"}</td>
                                    <td className="px-3 py-2">
                                        <UserAvatars users={row.users || []}/>
                                    </td>
                                    <td className="px-3 py-2">{row.reason || "—"}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        {row.started_at ? format(new Date(row.started_at), "d MMM yyyy", {locale: uk}) : "—"}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        {isEnded ? format(new Date(row.ended_at), "d MMM yyyy", {locale: uk}) : "—"}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        {isEnded
                                            ? <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                Скасовано
                                            </span>
                                            : <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                Діє
                                            </span>
                                        }
                                    </td>
                                    <td className="px-3 py-2">
                                        {canManage &&
                                            <div className="flex items-center gap-1">
                                                <Tooltip content="Редагувати">
                                                    <IconButton size="sm" variant="text" onClick={() => setEditingAssignment(row)}>
                                                        <i className="fa-regular fa-pen text-slate-500"></i>
                                                    </IconButton>
                                                </Tooltip>
                                                {!isEnded &&
                                                    <Tooltip content="Скасування">
                                                        <IconButton size="sm" variant="text" disabled={endMutation.isPending}
                                                                    onClick={() => endMutation.mutate({assignmentId: row.id})}>
                                                            {endMutation.isPending
                                                                ? <Spinner className="h-3.5 w-3.5"/>
                                                                : <i className="fa-regular fa-user-xmark text-red-500"></i>
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                            </div>
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <AssignmentModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                functionOptions={functionOptions}
                userOptions={assignableUserOptions}
                defaultFunctionId={selectedFunctionId}
            />

            <AssignmentModal
                open={Boolean(editingAssignment)}
                onClose={() => setEditingAssignment(null)}
                assignment={editingAssignment}
                functionOptions={functionOptions}
                userOptions={assignableUserOptions}
            />
        </div>
    );
};

export default ResponsibleAssignmentsTable;
