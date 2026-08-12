
import React, {useMemo, useState} from "react";
import {Button, Chip, Spinner, Tooltip} from "@material-tailwind/react";
import SearchInput from "@/Components/fields/SearchInput.jsx";
import ConfirmModal from "@/Components/Modal/ConfirmModal.jsx";
import GroupModal from "./GroupModal.jsx";
import {useDeleteUserGroupMutation, useUserGroupsQuery} from "@/entities/userGroup/queries.js";
import AdminLayout from "@/ReactPages/Admin/shared/ui/AdminLayout.jsx";

// Дизайн-система і UX — той самий еталон, що й для Довідників: список у
// стилі TaskList.jsx (рядок-однією-лінією, дії при ховері) + фільтр-бар у
// стилі TaskFilters.jsx (sticky, пошук + кнопка справа), а не таблиця.
const Index = () => {
    const {data: groups = [], isLoading} = useUserGroupsQuery();
    const deleteMutation = useDeleteUserGroupMutation();

    const [search, setSearch] = useState("");
    const [modalGroup, setModalGroup] = useState(undefined); // undefined — закрито, null — створення, obj — редагування
    const [deleteTarget, setDeleteTarget] = useState(null);

    const filteredGroups = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return groups;
        return groups.filter((group) => group.name.toLowerCase().includes(q));
    }, [groups, search]);

    const handleConfirmDelete = () => {
        deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AdminLayout data-i-doc="page:user-groups" active="groups">
        <div className="mx-2 mt-5">
            <div className="sticky top-0 z-20 -mx-1 mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-1 py-2 dark:border-slate-700 dark:bg-neutral-900">
                <div className="w-56">
                    <SearchInput
                        size="xs"
                        name="q"
                        value={search}
                        onChange={(e) => setSearch(e.target.value || "")}
                        placeholder="Пошук груп…"
                        icon="fa-regular fa-magnifying-glass"
                    />
                </div>
                <div className="ml-auto">
                    <Button onClick={() => setModalGroup(null)}>Створити групу</Button>
                </div>
            </div>

            {isLoading && !groups.length && (
                <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-gray-900">
                    <Spinner className="h-8 w-8"/>
                </div>
            )}

            {!isLoading && filteredGroups.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-400 dark:border-slate-800 dark:bg-gray-900">
                    <i className="fa-regular fa-people-group text-2xl"></i>
                    <span className="text-sm">{groups.length ? "Нічого не знайдено" : "Груп ще немає"}</span>
                </div>
            )}

            {filteredGroups.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-gray-900">
                    {filteredGroups.map((group) => (
                        <div key={group.id}
                             className="group flex items-center gap-2.5 border-b border-slate-100 px-3 py-2 transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                            <i className="fa-regular fa-people-group w-4 shrink-0 text-center text-xs text-slate-400 dark:text-slate-500"></i>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
                                {group.name}
                            </span>
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
                                    <span className="hidden shrink-0 text-[10px] text-slate-400 dark:text-slate-500 xl:inline">
                                        {group.creator.name}
                                    </span>
                                </Tooltip>
                            }
                            {!group.is_virtual &&
                                <span className="flex shrink-0 justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                                    <Tooltip content="Редагувати">
                                        <Button size="sm" variant="text" color="blue-gray" className="px-2 py-1"
                                                onClick={() => setModalGroup(group)}>
                                            <i className="fa-regular fa-pen-to-square"></i>
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Видалити">
                                        <Button size="sm" variant="text" color="red" className="px-2 py-1"
                                                onClick={() => setDeleteTarget(group)}>
                                            <i className="fa-regular fa-trash-can"></i>
                                        </Button>
                                    </Tooltip>
                                </span>
                            }
                        </div>
                    ))}
                </div>
            )}

            {modalGroup !== undefined && (
                <GroupModal
                    open
                    group={modalGroup}
                    onClose={() => setModalGroup(undefined)}
                />
            )}

            {deleteTarget && (
                <ConfirmModal
                    open
                    title="Видалити групу?"
                    message={`Групу "${deleteTarget.name}" буде видалено безповоротно.`}
                    isLoading={deleteMutation.isPending}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
        </AdminLayout>
    );
};

export default Index;
