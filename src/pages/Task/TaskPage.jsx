import TaskLayout from "../../Components/TaskLayout.jsx";
import {Button, Spinner} from "@material-tailwind/react";
import {usePage} from "@inertiajs/react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import React, {useEffect, useMemo, useState, useCallback} from "react";
import {useDialog} from "../../hooks/useDialog.js";
import CreateTaskModal from "./Components/Modals/CreateTaskModal.jsx";
import TaskViewPanel from "./Components/TaskViewPanel.jsx";
import TaskList from "./Components/TaskList.jsx";
import TaskFilters from "./Components/TaskFilters.jsx";

const sortOptions = [
    {id: 'created_at', caption: 'Створено'},
    {id: 'dueDate', caption: 'Термін'},
    {id: 'priorityId', caption: 'Пріоритет'},
    {id: 'title', caption: 'Назва'},
];
import ConfirmModal from "../../Components/Modal/ConfirmModal.jsx";
import toast from "react-hot-toast";
import {getErrorMessage, useDeleteTask, useExportTasks, useInfiniteTasks, useMergeTask, useRestoreTask, useTaskOptions, useToggleFavoriteTask} from "./queries.jsx";

const initialState = {
    limit: 100,
    page: 0,
    title: undefined,
    statusId: undefined,
    typeId: undefined,
    createdUserId: undefined,
    assignedUserId: undefined,
    projectId: undefined,
    priorityId: undefined,
    onlyFavorite: undefined,
    hideDeleted: undefined,
    onlyMine: undefined,
}

const TaskPage = () => {
    const {auth, token} = usePage().props;
    // Словники — з /api/task/options, а не з Inertia-props
    const {data: taskOptions} = useTaskOptions(auth);
    const {types = [], projects = [], statuses = [], users = [], priorities = []} = taskOptions || {};

    const queryClient = useQueryClient();

    // Фільтри/сортування відновлюються з localStorage одразу при ініціалізації —
    // без окремого effect, щоб перший запит уже йшов з відновленими значеннями
    const [filters, setFilters] = useState(() => {
        try {
            const stored = localStorage.getItem(`${location.pathname}-filters`);
            // Мерж з initialState: у збережених фільтрах зі старих версій
            // можуть бути відсутні нові ключі
            const restored = stored ? {...initialState, ...JSON.parse(stored)} : initialState;
            return restored;
        } catch {
            return initialState;
        }
    });
    // Тільки soft delete: force-видалення прибрано з цієї сторінки свідомо
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    // Злиття перетягуванням (TaskList): донор перетягується на базову задачу
    const [mergeConfirm, setMergeConfirm] = useState({ open: false, donorId: null, baseId: null });
    const mergeTask = useMergeTask();
    const toggleFavorite = useToggleFavoriteTask();
    const exportTasks = useExportTasks();

    const {
        open: openCreate,
        handleOpen: handleOpenCreate,
        handleClose: handleCloseCreate,
        dialogProps: createDialogProps
    } = useDialog();

    // Панель швидкого перегляду праворуч від таблиці; початкове значення — з ?view=X (deep-link)
    const [viewId, setViewId] = useState(() => {
        const param = new URLSearchParams(window.location.search).get('view');
        return param ? Number(param) : null;
    });

    // Групування списку (TaskList): status | project | priority | none
    const [groupBy, setGroupBy] = useState(() =>
        localStorage.getItem(`${location.pathname}-groupBy`) || "status"
    );
    useEffect(() => {
        localStorage.setItem(`${location.pathname}-groupBy`, groupBy);
    }, [groupBy]);

    const deleteTask = useDeleteTask();
    const restoreTask = useRestoreTask();

    // Швидка зміна стану прямо зі списку (ховер-дія рядка)
    const changeStatusMutation = useMutation({
        mutationFn: async ({id, statusId}) => {
            const response = await axios.patch(`/api/task/${id}/status`, {statusId}, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onSuccess: (_, {id}) => {
            toast.success("Стан змінено", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            queryClient.invalidateQueries({queryKey: ['tasks']});
            queryClient.invalidateQueries({queryKey: ['task-show', id]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося змінити стан")),
    });

    const handleClearFilters = useCallback(() => {
        setFilters({...initialState, limit: filters.limit})
    }, [filters.limit]);

    const handleToggleFavorite = useCallback((id) => {
        toggleFavorite.mutate({id, auth, token});
    }, [toggleFavorite, auth, token]);

    const handleToggleFavoritesOnly = useCallback((value) => {
        setFilters(prev => ({...prev, page: 0, onlyFavorite: value || undefined}));
    }, []);

    const handleToggleHideDeleted = useCallback((value) => {
        setFilters(prev => ({...prev, page: 0, hideDeleted: value || undefined}));
    }, []);

    const handleToggleOnlyMine = useCallback((value) => {
        setFilters(prev => ({...prev, page: 0, onlyMine: value || undefined}));
    }, []);

    const handleExport = useCallback(() => {
        exportTasks.mutate({filters, auth});
    }, [exportTasks, filters, auth]);

    // Кнопка "Тільки мої" має сенс лише коли юзер бачить УСІ задачі
    // (task.read = true) — при read='individual' бекенд і так завжди
    // повертає лише свої/учасницькі, перемикач був би зайвим дублем
    const showOnlyMineToggle = auth?.user?.permissions?.pages?.task?.read === true;

    // Нескінченний потік із "Показати ще" (групування — клієнтський шар поверх завантаженого)
    const {
        data: infiniteTasks,
        isLoading: isListLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteTasks(filters, auth);

    const listTasks = useMemo(
        () => infiniteTasks?.pages?.flatMap(page => page?.data || []) || [],
        [infiniteTasks]
    );
    const listTotal = infiniteTasks?.pages?.[0]?.meta?.total || 0;

    // Заголовки задач для читабельного тексту в модалці підтвердження злиття
    const mergeDonorTask = useMemo(() => listTasks.find(t => t.id === mergeConfirm.donorId), [listTasks, mergeConfirm.donorId]);
    const mergeBaseTask = useMemo(() => listTasks.find(t => t.id === mergeConfirm.baseId), [listTasks, mergeConfirm.baseId]);

    // Перегляд (одинарний клік): підвантажуємо задачу в панель праворуч
    // і фіксуємо її в URL (?view=X) для deep-link.
    const handleOpenViewPanel = useCallback((id) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', id);
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        setViewId(Number(id));
    }, []);

    const handleCloseViewPanel = useCallback(() => {
        const params = new URLSearchParams(window.location.search);
        params.delete('view');
        const newUrl = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
        window.history.pushState({}, '', newUrl);
        setViewId(null);
    }, []);

    const handleRestore = useCallback((id) => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center gap-x-1 flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900">
                        Відновити задачу?
                    </p>
                    <div className="flex flex-row gap-x-1 ">
                        <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>
                            Скасувати
                        </Button>
                        <Button size="sm" color="green" onClick={() => {
                            toast.dismiss(t.id)
                            restoreTask.mutate({id, auth, token})
                        }}>
                            Відновити
                        </Button>
                    </div>
                </div>
            ),
            {
                duration: 10000,
                position: 'top-center',
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            })
    }, [auth, token, restoreTask]);


    const handleDelete = useCallback(({id}) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setConfirmDelete({ open: true, id });
    }, []);

    const onConfirmDelete = useCallback(() => {
        if (!confirmDelete.id || deleteTask.isPending) return;
        const { id } = confirmDelete;
        // Закриваємо модалку одразу — не чекаємо на відповідь сервера.
        // Це дає відчуття миттєвої реакції. Помилка обробляється через toast.
        setConfirmDelete({ open: false, id: null });
        deleteTask.mutate({ id, force: false, auth, token });
    }, [confirmDelete, deleteTask, auth, token]);

    const closeConfirmModal = useCallback(() => {
        setConfirmDelete({ open: false, id: null });
    }, []);

    const handleMergeRequest = useCallback((donorId, baseId) => {
        setMergeConfirm({ open: true, donorId, baseId });
    }, []);

    const closeMergeConfirm = useCallback(() => {
        setMergeConfirm({ open: false, donorId: null, baseId: null });
    }, []);

    const onConfirmMerge = useCallback(() => {
        if (!mergeConfirm.donorId || !mergeConfirm.baseId || mergeTask.isPending) return;
        const { donorId, baseId } = mergeConfirm;
        setMergeConfirm({ open: false, donorId: null, baseId: null });
        mergeTask.mutate({ baseId, donorId, auth, token });
    }, [mergeConfirm, mergeTask, auth, token]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Insert' || event.code === 'Insert') {
                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' ||
                               activeElement.tagName === 'TEXTAREA' ||
                               activeElement.isContentEditable;

                if (!isInput && !openCreate && Boolean(auth?.user?.permissions?.pages?.task?.create)) {
                    event.preventDefault();
                    handleOpenCreate();
                }
            }
            // Esc закриває панель перегляду (модалки обробляють Esc самостійно)
            if (event.key === 'Escape' && Boolean(viewId) && !openCreate) {
                handleCloseViewPanel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [auth, handleOpenCreate, openCreate, viewId, handleCloseViewPanel]);

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
    }, [filters]);


    const handleChangeOptions = useCallback((key = '') => (option) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: option}));
    }, []);


    return (
        <TaskLayout data-i-doc="page:task">
            <TaskFilters
                filters={filters}
                onChangeOption={handleChangeOptions}
                onChangeTitle={(value) => setFilters(prev => ({...prev, page: 0, title: value}))}
                onClear={handleClearFilters}
                statuses={statuses}
                priorities={priorities}
                types={types}
                projects={projects}
                users={users}
                groupBy={groupBy}
                onGroupBy={setGroupBy}
                sortOptions={sortOptions}
                sortValue={sortOptions.find(option => option.id === (filters.sort || 'created_at'))}
                direction={filters.direction || 'desc'}
                onSort={(option) => setFilters(prev => ({...prev, page: 0, sort: option?.id || 'created_at'}))}
                onToggleDirection={() => setFilters(prev => ({...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc'}))}
                onCreate={Boolean(auth?.user?.permissions?.pages?.task?.create) ? () => handleOpenCreate() : undefined}
                onToggleFavoritesOnly={handleToggleFavoritesOnly}
                onToggleHideDeleted={handleToggleHideDeleted}
                showOnlyMineToggle={showOnlyMineToggle}
                onToggleOnlyMine={handleToggleOnlyMine}
                onExport={handleExport}
                isExporting={exportTasks.isPending}
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
                        <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
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
                message={`Задачу #${mergeConfirm.donorId}${mergeDonorTask ? ` «${mergeDonorTask.title}»` : ''} буде злито в задачу #${mergeConfirm.baseId}${mergeBaseTask ? ` «${mergeBaseTask.title}»` : ''}: теги, учасники, проєкти, обговорення, вкладення й опис перенесуться в базову задачу, а задача-донор буде видалена.`}
            />
        </TaskLayout>
    );
};

export default TaskPage;
