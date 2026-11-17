import { observer } from "mobx-react-lite";
import {Chip, IconButton, Tooltip} from "@material-tailwind/react";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../components/fields/MultiSelectChip.jsx";
import ChipToggle from "../../../components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../components/fields/ChipResetButton.jsx";
import ResponsibleFunctionModal from "./ResponsibleFunctionModal.jsx";
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";

// ТАБ "Функції" — довідник + менеджмент (створення/редагування/видалення).
// Панель фільтрів у тому самому стилі, що TaskFilters.jsx (SearchInput +
// ChipToggle + ChipResetButton), табличне подання — як на /task.
/** vm — ResponsibleFunctionsViewModel (фільтри, CRUD); master для таблиці призначень. */
const ResponsibleFunctionsTable = ({vm, isLoading}) => {
    const { q, onlyUnassigned, selectedUsersFilter, editingFunction, isCreateOpen, deletingFunction, canManage, hasActive, filtered } = vm;
    const { setQ, setOnlyUnassigned, setSelectedUsersFilter, setEditingFunction, setIsCreateOpen, setDeletingFunction } = vm;
    const deleteMutation = vm.cmd.deleteFunction;
    const userOptions = vm.registry.userOptions;
    const selectedFunctionId = vm.registry.selectedFunctionId;
    const onSelectFunction = vm.registry.selectFunction;

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

export default observer(ResponsibleFunctionsTable);
