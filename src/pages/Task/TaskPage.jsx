import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { confirmToast } from "../../components/confirmToast.jsx";
import { SORT_OPTIONS, TaskPageViewModel } from "./viewmodel/TaskViewModels.js";
import TaskLayout from "../../components/TaskLayout.jsx";
import { Spinner } from "@material-tailwind/react"
import Button from "../../components/Buttons/Button.jsx"
import {useEffect} from "react";
import {useSearchParams} from "react-router";
import CreateTaskModal from "./Components/Modals/CreateTaskModal.jsx";
import TaskViewPanel from "./Components/TaskViewPanel.jsx";
import TaskList from "./Components/TaskList.jsx";
import TaskFilters from "./Components/TaskFilters.jsx";

import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import PageHeader from "../../layouts/app/PageHeader.jsx";
import { HeaderButton, HeaderIconButton } from "../../layouts/app/HeaderButtons.jsx";

const TaskPage = () => {
    const vm = useViewModel((deps) => new TaskPageViewModel(deps));
    // ?view=id — джерело істини для панелі перегляду (deep-link, "Назад" у браузері).
    const [searchParams, setSearchParams] = useSearchParams();
    const viewParam = searchParams.get("view");
    useEffect(() => vm.syncView(viewParam), [vm, viewParam]);
    useEffect(() => vm.setNavigator((id) => setSearchParams((params) => {
        if (id) params.set("view", id); else params.delete("view");
        return params;
    })), [vm, setSearchParams]);

    const auth = vm.auth;
    const { filters, groupBy, viewId, types, projects, statuses, users, priorities, showOnlyMineToggle } = vm;
    const sortOptions = SORT_OPTIONS;
    const listTasks = vm.tasks;
    const listTotal = vm.total;
    const isListLoading = vm.isListLoading;
    const { hasNextPage, isFetchingNextPage, fetchNextPage } = vm;
    const openCreate = Boolean(vm.createDialog);
    const createDialogProps = vm.createDialog;
    const handleOpenCreate = vm.openCreate;
    const handleCloseCreate = vm.closeCreate;
    const handleChangeOptions = vm.changeOption;
    const handleClearFilters = vm.clearFilters;
    const handleToggleFavoritesOnly = vm.toggleFavoritesOnly;
    const handleToggleHideDeleted = vm.toggleHideDeleted;
    const handleToggleOnlyMine = vm.toggleOnlyMine;
    const handleExport = vm.exportList;
    const exportTasks = { isPending: vm.isExporting };
    const setGroupBy = vm.setGroupBy;
    const handleOpenViewPanel = vm.openView;
    const handleCloseViewPanel = vm.closeView;
    const handleDelete = ({id}) => vm.requestDelete(id);
    const handleRestore = (id) => confirmToast("Відновити задачу?", () => vm.restore(id), { confirmText: "Відновити", color: "green" });
    const handleMergeRequest = vm.requestMerge;
    const handleToggleFavorite = vm.toggleFavorite;
    const changeStatusMutation = { mutate: ({id, statusId}) => vm.changeStatus(id, statusId) };
    const confirmDelete = { open: vm.confirmDeleteId != null };
    const onConfirmDelete = vm.confirmDelete;
    const closeConfirmModal = vm.closeDelete;
    const mergeConfirm = { open: Boolean(vm.mergeConfirm) };
    const closeMergeConfirm = vm.closeMerge;
    const onConfirmMerge = vm.confirmMerge;
    const mergeTask = vm.cmd.mergeTask;

    return (
        <TaskLayout data-i-doc="page:task">
            <PageHeader
                title="Задачі"
                actions={
                    <>
                        <HeaderIconButton
                            icon={`fa-solid ${exportTasks.isPending ? "fa-spinner fa-spin" : "fa-file-excel"}`}
                            title="Експортувати поточний список у Excel"
                            onClick={handleExport}
                            disabled={exportTasks.isPending}
                        />
                        {vm.canCreate && (
                            <HeaderButton icon="fa-regular fa-plus" onClick={() => handleOpenCreate()}>
                                Додати
                            </HeaderButton>
                        )}
                    </>
                }
            />
            <TaskFilters
                filters={filters}
                onChangeOption={handleChangeOptions}
                onChangeTitle={vm.changeTitle}
                onClear={handleClearFilters}
                statuses={statuses}
                priorities={priorities}
                types={types}
                projects={projects}
                users={users}
                groupBy={groupBy}
                onGroupBy={setGroupBy}
                sortOptions={sortOptions}
                sortValue={vm.sortValue}
                direction={vm.direction}
                onSort={vm.setSort}
                onToggleDirection={vm.toggleDirection}
                onToggleFavoritesOnly={handleToggleFavoritesOnly}
                onToggleHideDeleted={handleToggleHideDeleted}
                showOnlyMineToggle={showOnlyMineToggle}
                onToggleOnlyMine={handleToggleOnlyMine}
            />
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <TaskList
                        tasks={listTasks}
                        loading={isListLoading}
                        groupBy={groupBy}
                        statuses={statuses}
                        priorities={priorities}
                        selectedId={viewId}
                        onSelect={handleOpenViewPanel}
                        onDelete={(id) => handleDelete({id})}
                        onRestore={handleRestore}
                        onChangeStatus={(id, statusId) => changeStatusMutation.mutate({id, statusId})}
                        onMergeRequest={handleMergeRequest}
                        onToggleFavorite={handleToggleFavorite}
                        onCloneRequest={(id) => handleOpenCreate({cloneFromTaskId: id})}
                        auth={auth}
                    />
                    {/* Потік із довантаженням: замість сторінок — "Показати ще" */}
                    {Boolean(listTotal) &&
                        <div className="mt-2 flex items-center justify-between px-1 text-xs text-gray-600 dark:text-gray-400">
                            <span>Показано {listTasks.length} із {listTotal}</span>
                            {hasNextPage &&
                                <Button size="sm" variant="text" color="blue"
                                        disabled={isFetchingNextPage}
                                        onClick={() => fetchNextPage()}>
                                    {isFetchingNextPage
                                        ? <span><Spinner className="mr-1 inline-block h-3 w-3"/>Завантаження…</span>
                                        : `Показати ще ${Math.min(filters.limit, listTotal - listTasks.length)}`}
                                </Button>
                            }
                        </div>
                    }
                </div>
                {
                    Boolean(viewId) &&
                    <TaskViewPanel selectedId={viewId} onClose={handleCloseViewPanel}/>
                }
            </div>
            {
                openCreate && <CreateTaskModal open={openCreate} onClose={handleCloseCreate} onCreated={handleOpenViewPanel} {...createDialogProps}/>
            }

            <ConfirmModal
                open={confirmDelete.open}
                onClose={closeConfirmModal}
                onConfirm={onConfirmDelete}
                title="Видалити задачу?"
                message="Задачу буде видалено — за потреби її можна відновити."
            />

            <ConfirmModal
                open={mergeConfirm.open}
                onClose={closeMergeConfirm}
                onConfirm={onConfirmMerge}
                isLoading={mergeTask.isPending}
                title="Злити задачі?"
                message={vm.mergeMessage}
            />
        </TaskLayout>
    );
};

export default observer(TaskPage);
