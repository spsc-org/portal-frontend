import TaskLayout from "../../Components/TaskLayout.jsx";
import {usePage} from "@inertiajs/react";
import {useDeleteTask, useGetAssignedTasks, useRestoreTask} from "./queries.jsx";
import {PAGINATION_PARAMS} from "../../constants.js";
import {Button, Chip, Switch, Tooltip} from "@material-tailwind/react";
import React, {useEffect, useMemo, useState, useCallback} from "react";
import {getPriorityStyle, getStatusStyle, getTypeStyle} from "./utils.jsx";
import {format} from "date-fns";
import {createColumnHelper} from "@tanstack/react-table";
import toast from "react-hot-toast";
import SearchInput from "../../Components/fields/SearchInput.jsx";
import SingleSelect from "../../Components/fields/SingleSelect.jsx";
import {useDialog} from "../../hooks/useDialog.js";
import Table from "../../Components/Table/Table.jsx";
import CreateTaskModal from "./Components/Modals/CreateTaskModal.jsx";
import TaskDetailsModal from "./Components/Modals/TaskDetailsModal.jsx";
import ConfirmModal from "../../Components/Modal/ConfirmModal.jsx";
import {canDeleteForceRow, canDeleteRow, canRestore} from "./utils.js";


const columnHelper = createColumnHelper();

const AssignedPage = () => {
    const {auth, token, types = [], projects = [], statuses = [], users = [], priorities = []} = usePage().props;

    const [filters, setFilters] = useState({
        ...PAGINATION_PARAMS,
        createdUserId: auth?.user?.id,
        assignedUserId: auth?.user?.id,
    });
    const [sorting, setSorting] = useState([]);

    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, force: false });

    const {data: tasks, isLoading} = useGetAssignedTasks(filters, auth);
    const deleteTask = useDeleteTask();
    const restoreTask = useRestoreTask();

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


    const handleOpenDetailsModal = useCallback((id) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', id);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
        handleOpenDetails({selectedId: id, readOnly: !Boolean(auth?.user?.permissions?.pages?.task?.update)});
    }, [auth, handleOpenDetails]);


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

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Insert' || event.code === 'Insert') {
                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' ||
                               activeElement.tagName === 'TEXTAREA' ||
                               activeElement.isContentEditable;

                if (!isInput && !openCreate && !openDetails && Boolean(auth?.user?.permissions?.pages?.task?.create)) {
                    event.preventDefault();
                    handleOpenCreate({view: "assigned"});
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
            size: 500,
            header: () => "Назва",
            cell: ({row}) => {
                return <div className="flex gap-x-2 items-center">
                    <span>{getTypeStyle(row?.original?.type)}</span>
                    <span>{row?.original?.title}</span>
                </div>
            },
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


    const handlePageChange = useCallback((pageNumber) => {
        setFilters(prevState => ({...prevState, page: pageNumber - 1}));
    }, []);

    const handleChangeFilters = useCallback(({target: {name, value}}) => {
        setFilters(prev => ({...prev, [name]: value}));
    }, []);

    const handleChangeOptions = useCallback((key = '') => (option) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: option}));
    }, []);

    const toggleFilterSwitch = useCallback(({target}) => {
        setFilters(prevState => ({...prevState, [target.name]: target.checked}));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            ...{
                ...PAGINATION_PARAMS,
                createdUserId: auth?.user?.id,
                assignedUserId: auth?.user?.id,
            }, limit: filters.limit
        })
    }, [auth, filters.limit]);

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

    const handleLimit = useCallback((value) => {
        setFilters(prevState => ({...prevState, page: 0, limit: value}));
    }, []);

    return (
        <TaskLayout data-i-doc="page:task-assigned" title={<span>Мої задачі
                              <i className="ml-1 fa-solid fa-info-circle"
                                 title="Задачі призначені на мене, або створенні мною"/>
                       </span>}
                    actions={<Button size="sm" onClick={() => handleOpenCreate({view: "assigned"})}>Додати</Button>}>

            <div className="flex flex-row justify-between items-center">
                <div className="grid grid-cols-8 gap-x-5 gap-y-2 mb-4">
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
                    <SingleSelect closeMenuOnSelect isClearable options={types} label="Тип" id="typeId"
                                  value={filters.typeId}
                                  onChange={handleChangeOptions('typeId')}/>
                    <SingleSelect closeMenuOnSelect isClearable options={projects} label="Проєкт" id="projectId"
                                  value={filters.projectId}
                                  onChange={handleChangeOptions('projectId')}/>
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
                    pageSize: tasks?.limit,
                    totalCount: tasks?.total,
                }}
                data={tasks?.data}
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
                title={confirmDelete.force ? "Видалити назавжди?" : "Архівувати задачу?"}
                message={confirmDelete.force ? "Цю дію неможливо буде скасувати." : "Задачу буде переміщено в архів."}
                loading={deleteTask.isPending}
            />

        </TaskLayout>
    );
};

export default AssignedPage;
