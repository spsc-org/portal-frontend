import { observer } from "mobx-react-lite";
import { Button, Chip, Spinner, Tooltip } from "@material-tailwind/react";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";
import AdminLayout from "../../Admin/shared/ui/AdminLayout.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";
import { useVM } from "../../../shared/mvvm/viewModelHooks.js";
import GroupModal from "./GroupModal.jsx";

const GroupRow = ({ group, onEdit, onDelete }) => (
    <div className="group flex items-center gap-2.5 border-b border-slate-100 px-3 py-2 transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
        <i className="fa-regular fa-people-group w-4 shrink-0 text-center text-xs text-slate-400 dark:text-slate-500"></i>
        <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">{group.name}</span>
        {group.is_virtual &&
            <Chip size="sm" color="blue" variant="ghost" className="shrink-0 py-0.5 text-[9px]" value="Системна"/>
        }
        <Tooltip content={group.is_virtual ? "Усі користувачі" : "Учасників у групі"}>
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <i className="fa-regular fa-user"></i>
                {group.is_virtual ? "усі" : (group.members_count ?? 0)}
            </span>
        </Tooltip>
        {group.creator?.name &&
            <Tooltip content={`Створив: ${group.creator.name}`}>
                <span className="hidden shrink-0 text-[10px] text-slate-400 dark:text-slate-500 xl:inline">{group.creator.name}</span>
            </Tooltip>
        }
        {!group.is_virtual &&
            <span className="flex shrink-0 justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                <Tooltip content="Редагувати">
                    <Button size="sm" variant="text" color="blue-gray" className="px-2 py-1" onClick={() => onEdit(group)}>
                        <i className="fa-regular fa-pen-to-square"></i>
                    </Button>
                </Tooltip>
                <Tooltip content="Видалити">
                    <Button size="sm" variant="text" color="red" className="px-2 py-1" onClick={() => onDelete(group)}>
                        <i className="fa-regular fa-trash-can"></i>
                    </Button>
                </Tooltip>
            </span>
        }
    </div>
);

// Список у стилі TaskList (рядок-однією-лінією, дії при ховері) + sticky фільтр-бар.
const UserGroupsView = () => {
    const vm = useVM();

    return (
        <AdminLayout data-i-doc="page:user-groups" active="groups">
            <PageHeader
                title="Групи користувачів"
                actions={<HeaderButton icon="fa-solid fa-plus" onClick={vm.openCreate}>Створити групу</HeaderButton>}
            />
            <div className="mx-2 mt-5">
                <div className="sticky top-[50px] z-20 -mx-1 mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-1 py-2 dark:border-slate-700 dark:bg-neutral-900">
                    <div className="w-56">
                        <SearchInput
                            size="xs"
                            name="q"
                            value={vm.search}
                            onChange={(e) => vm.setSearch(e.target.value)}
                            placeholder="Пошук груп…"
                            icon="fa-regular fa-magnifying-glass"
                        />
                    </div>
                </div>

                {vm.isLoading && !vm.groups.length && (
                    <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-gray-900">
                        <Spinner className="h-8 w-8"/>
                    </div>
                )}

                {!vm.isLoading && vm.filteredGroups.length === 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-400 dark:border-slate-800 dark:bg-gray-900">
                        <i className="fa-regular fa-people-group text-2xl"></i>
                        <span className="text-sm">{vm.emptyText}</span>
                    </div>
                )}

                {vm.filteredGroups.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-gray-900">
                        {vm.filteredGroups.map((group) => (
                            <GroupRow key={group.id} group={group} onEdit={vm.openEdit} onDelete={vm.askDelete}/>
                        ))}
                    </div>
                )}

                {vm.isModalOpen && <GroupModal group={vm.modalGroup} onClose={vm.closeModal}/>}

                {vm.deleteTarget && (
                    <ConfirmModal
                        open
                        title="Видалити групу?"
                        message={`Групу "${vm.deleteTarget.name}" буде видалено безповоротно.`}
                        isLoading={vm.deleteMutation.isPending}
                        onClose={vm.cancelDelete}
                        onConfirm={vm.confirmDelete}
                    />
                )}
            </div>
        </AdminLayout>
    );
};

export default observer(UserGroupsView);
