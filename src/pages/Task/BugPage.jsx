import {usePage} from "@inertiajs/react";
import React, {useEffect, useMemo, useState, useCallback} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {useDialog} from "../../hooks/useDialog.js";
import toast from "react-hot-toast";
import {Button, Chip, Switch, Tooltip} from "@material-tailwind/react";
import {getPriorityStyle, getStatusStyle, getTypeStyle} from "./utils.jsx";
import {format} from "date-fns";
import TaskLayout from "../../Components/TaskLayout.jsx";
import SearchInput from "../../Components/fields/SearchInput.jsx";
import SingleSelect from "../../Components/fields/SingleSelect.jsx";
import Table from "../../Components/Table/Table.jsx";
import CreateTaskModal from "./Components/Modals/CreateTaskModal.jsx";
import TaskDetailsModal from "./Components/Modals/TaskDetailsModal.jsx";
import ConfirmModal from "../../Components/Modal/ConfirmModal.jsx";
import {createColumnHelper} from "@tanstack/react-table";
import {canDeleteForceRow, canDeleteRow, canRestore} from "./utils.js";
import {useDeleteTask, useGetBugs, useRestoreTask} from "./queries.jsx";


const initialState = {
    limit: 50,
    page: 0,
    title: undefined,
    statusId: undefined,
    createdUserId: undefined,
    assignedUserId: undefined,
    projectId: undefined,
    priorityId: undefined,
}

const columnHelper = createColumnHelper();

const BugPage = () => {
    const {auth, token, types = [], projects = [], statuses = [], users = [], priorities = []} = usePage().props;

    const queryClient = useQueryClient();
    const [filters, setFilters] = useState(initialState);
    const [sorting, setSorting] = useState([]);

    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, force: false });

    const {
        open: openCreate,
        handleOpen: handleOpenCreate,
        handleClose: handleCloseCreate,
        dialogProps: createDialogProps
    } = useDialog();

    const {
        open: openDetails,
        handleOpen: handleOpenDetails,
        handleClose: handleCloseDetails,
        dialogProps: detailsDialogProps,
    } = useDialog();

    const deleteTask = useDeleteTask();
    const restoreTask = useRestoreTask();


    const handleClearFilters = useCallback(() => {
        setFilters({...initialState, limit: filters.limit})
    }, [filters.limit]);

    const handleLimit = useCallback((value) => {
        setFilters(prevState => ({...prevState, page: 0, limit: value}));
    }, []);

    const handleSortModel = useCallback((model) => {
        setSorting(model);
        const sortModel = model();
        if (sortModel.length > 0) {
            setFilters(prevState => ({
                ...prevState,
                sort: sortModel[0].id,
                direction: Boolean(sortModel[0].desc) ? "desc" : "asc"
            }));
        }
    }, []);

    const handlePageChange = useCallback((pageNumber) => {
        setFilters(prevState => ({...prevState, page: pageNumber - 1}));
    }, []);

    const {data: bugs, isLoading} = useGetBugs(filters, auth);
    const id = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('view');
    }, [window.location.search, openDetails]);

    useEffect(() => {
        if (!openDetails && Boolean(id)) {
            handleOpenDetails({selectedId: id});
        }
    }, [openDetails, id])

    const handleOpenDetailsModal = useCallback((id) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', id);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
        handleOpenDetails({selectedId: id});
    }, [handleOpenDetails]);


    const handleDelete = useCallback(({id, force = false}) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setConfirmDelete({ open: true, id, force });
    }, []);

    const onConfirmDelete = useCallback(() => {
        if (!confirmDelete.id || deleteTask.isPending) return;

        deleteTask.mutate({
            id: confirmDelete.id,
            force: confirmDelete.force,
            auth,
            token
        }, {
            onSettled: () => setConfirmDelete({ open: false, id: null, force: false })
        });
    }, [confirmDelete, deleteTask, auth, token]);

    const handleRestore = useCallback((id) => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center gap-x-1 flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900">
                        Відновити з архіву?
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

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Insert' || event.code === 'Insert') {
                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' ||
                               activeElement.tagName === 'TEXTAREA' ||
                               activeElement.isContentEditable;

                if (!isInput && !openCreate && !openDetails && Boolean(auth?.user?.permissions?.pages?.task?.create)) {
                    event.preventDefault();
                    handleOpenCreate({view: "bug"});
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [auth, handleOpenCreate, openCreate, openDetails]);

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
        localStorage.setItem(`${location.pathname}-sorting`, JSON.stringify(sorting));
    }, [filters, sorting]);

    const columns = useMemo(() => [
        columnHelper.accessor("id", {
            id: 'id',
            size: 10,
            header: () => "ID",
            cell: info => {
                return <div className="flex flex-row gap-x-2 items-center">
                    <span>{info.getValue()}</span>
                    {Boolean(info.row.original?.deleted_at) &&
                        <Chip size="sm" color="blue" variant="ghost" className="w-fit p-0.5" value="Архів"/>
                    }
                </div>
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("title_type", {
            id: 'title',
            size: 400,
            header: () => "Назва",
            cell: ({row}) => {
                return <div className="flex gap-x-2 items-center">
                    <span>{getTypeStyle(row?.original?.type)}</span>
                    <span>{row?.original?.title}</span>
                </div>
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("tags", {
            id: 'tags',
            size: 150,
            header: () => "Теги",
            cell: ({row}) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.tags?.map(tag => (
                        <Chip key={tag.id} size="sm" value={tag.name} variant="ghost" color="blue-gray" className="rounded-full text-[10px] py-0.5 px-2" />
                    ))}
                </div>
            ),
            footer: info => info.column.id,
        }),
        columnHelper.accessor("status", {
            id: 'statusId',
            size: 50,
            enableResizing: false,
            header: () => "Статус",
            cell: ({row}) => getStatusStyle(row?.original?.status),
            footer: info => info.column.id,
        }),
        columnHelper.accessor("dueDate", {
            id: 'dueDate',
            size: 100,
            header: () => "Термін",
            cell: info => info.getValue() ? format(new Date(info.getValue()), "yyyy-MM-dd") : "",
            footer: info => info.column.id,
        }),
        columnHelper.accessor("priority", {
            id: 'priorityId',
            size: 50,
            enableResizing: false,
            header: () => "Пріорітет",
            cell: ({row}) => getPriorityStyle(row?.original?.priority),
            footer: info => info.column.id,
        }),

        columnHelper.accessor("project", {
            id: 'projectId',
            size: 150,
            enableResizing: false,
            header: () => "Проєкт",
            footer: info => info.column.id,
        }),
        columnHelper.accessor("assignedUser", {
            id: 'assignedUser',
            enableResizing: false,
            size: 100,
            header: () => "Виконавець",
            enableSorting: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor("createdUser", {
            id: 'createdUserId',
            size: 100,
            enableResizing: false,

            header: () => "Створив",
            footer: info => info.column.id,
        }),
        columnHelper.accessor("created_at", {
            id: 'created_at',
            size: 100,
            header: () => "Створено",
            enableResizing: false,
            cell: info => info.getValue() ? format(info.getValue(), "yyyy-MM-dd") : "",
            footer: info => info.column.id,
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 20,
            size: 20,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({row}) => (
                <div className="flex flex-row gap-x-2 p-2 justify-end">
                    <Tooltip content="Детальна інформація">
                        <Button size="sm"
                                onClick={() => handleOpenDetailsModal(row.original.id)}
                                variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    </Tooltip>
                    {
                        canDeleteRow(row, auth) &&
                        <Tooltip content="Архівувати">
                            <Button size="sm"
                                    disabled={deleteTask.isPending}
                                    onClick={() => handleDelete({id: row.original.id, force: false})}
                                    color="blue">
                                <i className="fa-regular fa-floppy-disk"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        canRestore(row, auth) &&
                        <Tooltip content="Відновити з архіву">
                            <Button size="sm"
                                    disabled={deleteTask.isPending}
                                    onClick={() => handleRestore(row.original.id)}
                                    color="blue">
                                <i className="fa-solid fa-trash-arrow-up"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        canDeleteForceRow(row, auth) &&
                        <Tooltip content="Видалити назавжди">
                            <Button size="sm"
                                    disabled={deleteTask.isPending}
                                    onClick={() => handleDelete({id: row.original.id, force: true})}
                                    variant="filled" color="red">
                                <i className="fa-solid fa-trash-can-xmark"></i>
                            </Button>
                        </Tooltip>
                    }
                </div>),
        }),
    ], [auth, deleteTask.isPending, handleDelete, handleOpenDetailsModal, handleRestore]);

    const handleChangeFilters = useCallback(({target: {name, value}}) => {
        setFilters(prev => ({...prev, [name]: value}));
    }, []);

    const handleChangeOptions = useCallback((key = '') => (option) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: option}));
    }, []);

    const toggleFilterSwitch = useCallback(({target}) => {
        setFilters(prevState => ({...prevState, [target.name]: target.checked}));
    }, []);


    return (
        <TaskLayout data-i-doc="page:task-bug" title="Баг" actions={<Button size="sm" onClick={() => handleOpenCreate({view: "bug"})}>Додати</Button>}>
            <div className="flex flex-row justify-between items-center">
                <div className="grid grid-cols-8 gap-x-5 gap-y-2 mb-4 justify-center">
                    <SearchInput size="sm" name="title" value={filters.title}
                                 label="Назва"
                                 onChange={handleChangeFilters}
                    />
                    <SingleSelect closeMenuOnSelect isClearable options={statuses} label="Статус" id="statusId"
                                  value={filters.statusId}
                                  onChange={handleChangeOptions('statusId')}/>
                    <SingleSelect closeMenuOnSelect isClearable options={priorities} label="Пірорітет" id="priorityId"
                                  value={filters.priorityId}
                                  onChange={handleChangeOptions('priorityId')}/>

                    <SingleSelect closeMenuOnSelect isClearable options={projects} label="Проєкт" id="projectId"
                                  value={filters.projectId}
                                  onChange={handleChangeOptions('projectId')}/>
                    <SingleSelect closeMenuOnSelect isClearable options={users} label="Виконавець" id="assignedUserId"
                                  value={filters.assignedUserId}
                                  onChange={handleChangeOptions('assignedUserId')}/>
                    <SingleSelect closeMenuOnSelect isClearable options={users} label="Створив" id="createdUserId"
                                  value={filters.createdUserId}
                                  onChange={handleChangeOptions('createdUserId')}/>
                    <div className="self-center flex gap-x-2 mt-4">
                        <Tooltip content="Приховати архівні">
                            <Switch ripple={false}
                                    color="green"
                                    name="hideDeleted" checked={filters.hideDeleted}
                                    onChange={toggleFilterSwitch}/>
                        </Tooltip>
                        <Tooltip content="Скинути фільтри">
                            <Button
                                className="h-10"
                                onClick={handleClearFilters}>
                                <i className="fa-regular fa-filter-slash"></i>
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <Table
                loading={isLoading}
                canChangeVisibility
                canChangeResize
                textSize="xs"
                pagination={{
                    onLimitChange: handleLimit,
                    onPageChange: handlePageChange,
                    currentPage: filters?.page,
                    pageSize: bugs?.limit,
                    totalCount: bugs?.total,
                }}
                data={bugs?.data}
                columns={columns}
                onSort={handleSortModel}
            />
            {
                openCreate && <CreateTaskModal open={openCreate} onClose={handleCloseCreate} onCreated={handleOpenDetailsModal} {...createDialogProps}/>
            }
            {
                openDetails &&
                <TaskDetailsModal open={openDetails} onClose={handleCloseDetails} {...detailsDialogProps}/>
            }

            <ConfirmModal
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null, force: false })}
                onConfirm={onConfirmDelete}
                title={confirmDelete.force ? "Видалити назавжди?" : "Архівувати баг?"}
                message={confirmDelete.force ? "Цю дію неможливо буде скасувати." : "Баг буде переміщено в архів."}
                loading={deleteTask.isPending}
            />
        </TaskLayout>
    );
};

export default BugPage;
