import React, {useState} from "react";
import {Chip, IconButton, Tooltip} from "@material-tailwind/react";
import SearchInput from "../../../../Components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../../Components/fields/MultiSelectChip.jsx";
import ChipToggle from "../../../../Components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../../Components/fields/ChipResetButton.jsx";
import {canManageResponsibleFunctions} from "../../shared/lib/responsiblePermissions.js";
import {useDeleteResponsibleFunctionMutation} from "../../entities/responsible/queries.js";
import ResponsibleFunctionModal from "../../features/manage-responsible-function/ResponsibleFunctionModal.jsx";
import ConfirmModal from "../../../../Components/Modal/ConfirmModal.jsx";

// ТАБ "Функції" — довідник + менеджмент (створення/редагування/видалення).
// Панель фільтрів у тому самому стилі, що TaskFilters.jsx (SearchInput +
// ChipToggle + ChipResetButton), табличне подання — як на /task.
const ResponsibleFunctionsTable = ({auth, functions = [], users = [], isLoading, selectedFunctionId, onSelectFunction}) => {
    const [q, setQ] = useState("");
    const [onlyUnassigned, setOnlyUnassigned] = useState(false);
    const [selectedUsersFilter, setSelectedUsersFilter] = useState([]);
    const [editingFunction, setEditingFunction] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deletingFunction, setDeletingFunction] = useState(null);

    const deleteMutation = useDeleteResponsibleFunctionMutation();
    const canManage = canManageResponsibleFunctions(auth);

    const userOptions = users.filter((u) => !u.deleted_at).map((u) => ({id: u.id, caption: u.name}));
    const selectedUserFilterIds = selectedUsersFilter.map((u) => u.id);

    const hasActive = Boolean(q || onlyUnassigned || selectedUsersFilter.length);
    const filtered = functions.filter((func) => {
        const assignedUserIds = (func.active_assignments || []).flatMap((a) => (a.users || []).map((u) => u.id));
        if (onlyUnassigned && assignedUserIds.length > 0) return false;
        if (selectedUserFilterIds.length && !assignedUserIds.some((id) => selectedUserFilterIds.includes(id))) return false;
        if (q && !func.name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
    });

    return (
        <div data-i-doc="widget:staff-responsible-functions">
            <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-1 py-2 dark:border-slate-700 dark:bg-neutral-900">
                <div className="w-56">
                    <SearchInput size="xs" name="q" value={q} onChange={(e) => setQ(e.target.value || "")}
                                 placeholder="Пошук функцій…" icon="fa-regular fa-magnifying-glass"/>
                </div>
                <MultiSelectChip label="Користувач" icon="fa-regular fa-user"
                                  options={userOptions} value={selectedUsersFilter} onChange={setSelectedUsersFilter}/>
                <ChipToggle active={onlyUnassigned} onClick={() => setOnlyUnassigned((prev) => !prev)}
                            icon="fa-regular fa-user-slash" label="Без відповідальних"/>
                <ChipResetButton onClick={() => {
                    setQ("");
                    setOnlyUnassigned(false);
                    setSelectedUsersFilter([]);
                }} hasActive={hasActive} label="Скинути"/>

                {canManage &&
                    <button type="button" onClick={() => setIsCreateOpen(true)}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                        <i className="fa-solid fa-plus"></i>
                        Нова функція
                    </button>
                }
            </div>

            <div className="max-w-full overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-800">
                <table className="w-full table-auto text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead>
                        <tr className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                            <th className="px-3 py-2 font-normal">Назва</th>
                            <th className="px-3 py-2 font-normal">Опис</th>
                            <th className="px-3 py-2 font-normal">Відповідальні</th>
                            {canManage && <th className="px-3 py-2 font-normal">Дії</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                        {!isLoading && filtered.length === 0 &&
                            <tr>
                                <td colSpan={canManage ? 4 : 3} className="px-3 py-6 text-center text-gray-400 dark:text-slate-500">
                                    Нічого не знайдено
                                </td>
                            </tr>
                        }
                        {filtered.map((func) => {
                            const isSelected = onSelectFunction && Number(selectedFunctionId) === Number(func.id);
                            return (
                                <tr key={func.id}
                                    onClick={onSelectFunction ? () => onSelectFunction(isSelected ? null : func.id) : undefined}
                                    className={`${isSelected ? "bg-blue-100/80 dark:bg-blue-900/40" : "bg-neutral-100 dark:bg-gray-900"} ${onSelectFunction ? "cursor-pointer" : ""} hover:bg-neutral-200 dark:hover:bg-neutral-700`}>
                                    <td className="px-3 py-2 font-semibold text-gray-800 dark:text-slate-200">{func.name}</td>
                                    <td className="px-3 py-2">{func.description || "—"}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-wrap gap-1">
                                            {(func.active_assignments || []).flatMap((a) => (a.users || []).map((u) => (
                                                <Chip key={`${a.id}-${u.id}`} size="sm" value={u.name} variant="ghost" color="blue-gray"
                                                      className="rounded-full text-[10px] py-0.5 px-2"/>
                                            )))}
                                            {(func.active_assignments || []).every((a) => (a.users || []).length === 0) &&
                                                <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                                            }
                                        </div>
                                    </td>
                                    {canManage &&
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1">
                                                <Tooltip content="Редагувати функцію">
                                                    <IconButton size="sm" variant="text"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingFunction(func);
                                                                }}>
                                                        <i className="fa-regular fa-pen text-slate-500"></i>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip content="Видалити функцію">
                                                    <IconButton size="sm" variant="text"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeletingFunction(func);
                                                                }}>
                                                        <i className="fa-regular fa-trash text-red-500"></i>
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    }
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ResponsibleFunctionModal
                open={isCreateOpen || Boolean(editingFunction)}
                func={editingFunction}
                onClose={() => {
                    setIsCreateOpen(false);
                    setEditingFunction(null);
                }}
            />

            <ConfirmModal
                open={Boolean(deletingFunction)}
                onClose={() => setDeletingFunction(null)}
                onConfirm={() => deleteMutation.mutate(deletingFunction.id, {onSuccess: () => setDeletingFunction(null)})}
                isLoading={deleteMutation.isPending}
                title="Видалити функцію?"
                message={deletingFunction ? `Функція «${deletingFunction.name}» і всі її призначення будуть приховані з реєстру.` : ""}
            />
        </div>
    );
};

export default ResponsibleFunctionsTable;
