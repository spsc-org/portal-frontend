
import {usePage} from "@inertiajs/react";
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {convertDate} from "@/utils.js";
import {Button, Tooltip} from "@material-tailwind/react";
import Table, {loadColumnSizes} from "@/Components/Table/Table.jsx";
import toast from "react-hot-toast";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {createColumnHelper} from "@tanstack/react-table";
import UserModal from "@/ReactPages/Admin/UserModal.jsx";
import UserUpdateModal from "@/ReactPages/Admin/UserUpdateModal.jsx";
import BulkActionsModal from "@/ReactPages/Admin/BulkActionsModal.jsx";
import SearchInput from "@/Components/fields/SearchInput.jsx";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import AccessModulesCell from "@/ReactPages/Admin/AccessModulesCell.jsx";
import BackToTop from "@/Components/BackToTop.jsx";
import AdminLayout from "@/ReactPages/Admin/shared/ui/AdminLayout.jsx";

const initialState = {
    limit: 50,
    page: 0,
    q: '',
    unit: 'all',
    isResponsible: 'all',
    trashed: 'all',
}

const isTriFilterActive = (value) => value !== 'all' && value !== null && value !== undefined && value !== '';
const columnHelper = createColumnHelper();
const Index = () => {
    const {auth, permissions: permissionsSchema = {}} = usePage().props;
    const moduleSchemaKeys = useMemo(() => Object.keys(permissionsSchema), [permissionsSchema]);
    const addRef = useRef(null);
    const [selectedId, setSelectedId] = useState(null);
    const queryClient = useQueryClient();
    const [sorting, setSorting] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [rowSelection, setRowSelection] = useState({});
    const [filters, setFilters] = useState(initialState)
    const canUpdate = Boolean(auth?.user?.permissions?.pages?.['admin-users']?.update);
    const selectedUserIds = useMemo(
        () => Object.keys(rowSelection).filter((id) => rowSelection[id]).map(Number),
        [rowSelection],
    );
    const {data: adminOptions} = useQuery({
        queryKey: ['admin-options'],
        queryFn: () => axios.get('/api/admin-users/options', {
            headers: {
                'Content-Type': 'application/json',
                'userId': auth?.user?.id,
            },
        }).then((r) => r.data.data),
        staleTime: Infinity,
        enabled: Boolean(auth?.user?.id),
    });
    const unitOptions = adminOptions?.units ?? [];
    const isResponsibleOptions = adminOptions?.isResponsible ?? [];
    const trashedOptions = adminOptions?.trashed ?? [];
    const {data: users, isLoading} = useQuery({
        queryKey: ['users', filters],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            for (const key in filters) {
                const value = filters[key];
                if (value === '' || value === null || value === undefined || value === 'all') {
                    continue;
                }
                searchParams.append(key, value);
            }
            const response = await axios.get(`api/admin-users`, {
                params: searchParams,
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            });
            return response.data;
        },
        retry: false,
        placeholderData: keepPreviousData,
    })

    const deleteMutation = useMutation({
        mutationFn: async ({id, userId}) => {
            const response = await axios.delete(`api/admin-users/${id}`, {
                headers: {'userId': userId},
            })
            return response?.data;
        },
        onSuccess: async () => toast.success('Успішно видалено'),
        onError: async () => toast.error('Помилка видалення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['users', filters]}),
    })

    const restoreMutation = useMutation({
        mutationFn: async ({id, userId}) => {
            const response = await axios.post(`api/admin-users/${id}/restore`, undefined, {
                method: 'POST',
                headers: {'userId': userId},
            })
            return response?.data;
        },
        onSuccess: async () => toast.success('Успішно відновлено'),
        onError: async () => toast.error('Помилка відновлення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['users', filters]}),
    })

    const handleChangeFilters = ({target: {name, value}}) => {
        setFilters((prev) => ({...prev, page: 0, [name]: value}));
    }

    const handleSelectFilter = (key) => (option) => {
        setFilters((prev) => ({
            ...prev,
            page: 0,
            [key]: option?.id ?? 'all',
        }));
    };

    const handleLimit = (value) => {
        setFilters(prevState => ({...prevState, page: 0, limit: value}));
    }
    const handlePageChange = (pageNumber) => {
        setFilters(prevState => ({...prevState, page: pageNumber - 1}));
    }
    const hasNonEmptyFilter = () => {
        const {q, unit, isResponsible, trashed} = filters;
        return (
            q?.trim() !== "" ||
            isTriFilterActive(unit) ||
            isTriFilterActive(isResponsible) ||
            isTriFilterActive(trashed)
        );
    };

    const handleSortModel = (model) => {
        setSorting(model);
        const sortModel = model();
        if (sortModel.length > 0) {
            setFilters(prevState => ({
                ...prevState,
                sort: sortModel[0].id,
                direction: Boolean(sortModel[0].desc) ? "desc" : "asc"
            }));
        }

    };

    const handleRestore = (id) => () => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900 ">
                        Відновити користувача?
                    </p>
                    <div className="flex flex-row gap-x-1 ">
                        <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>
                            Скасувати
                        </Button>
                        <Button size="sm" color="green" onClick={() => {
                            toast.dismiss(t.id)
                            restoreMutation.mutate({id, userId: auth?.user?.id})
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
    }
    const handleDelete = (id) => () => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center gap-x-1 flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900">
                        Видалити користувача?
                    </p>
                    <div className="flex flex-row gap-x-1 ">
                        <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>
                            Скасувати
                        </Button>
                        <Button size="sm" color="red" onClick={() => {
                            toast.dismiss(t.id)
                            deleteMutation.mutate({id, userId: auth?.user?.id})
                        }}>
                            Видалити
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
    }

    const handleEdit = (id) => () => {
        setSelectedId(id);
        setIsEditModalOpen(true);
    }

    const handleClearFilters = () => {
        setFilters({...initialState, limit: filters.limit})
    }

    const columns = useMemo(() => [
        columnHelper.accessor("name", {
            id: 'name',
            size: loadColumnSizes()?.find(item => item.column === 'name')?.size || 100,
            header: () => 'ПІБ',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("initials", {
            id: 'initials',
            size: loadColumnSizes()?.find(item => item.column === 'initials')?.size || 100,
            header: () => 'Ініціали',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("email", {
            id: 'email',
            size: loadColumnSizes()?.find(item => item.column === 'email')?.size || 100,
            header: () => 'Email',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("unit", {
            id: 'unit',
            size: loadColumnSizes()?.find(item => item.column === 'unit')?.size || 100,
            header: () => 'Підрозділ',
            footer: info => info.column.id,
            cell: info => info.getValue() || ' --- ',
        }),
        columnHelper.accessor("isResponsible", {
            id: 'isResponsible',
            size: loadColumnSizes()?.find(item => item.column === 'isResponsible')?.size || 100,
            header: () => 'Відповідальна особа',
            footer: info => info.column.id,
            cell: info => Boolean(info.getValue()) ? "Так" : "Ні",
        }),
        columnHelper.accessor((row) => row?.permissions?.pages, {
            id: 'accessModules',
            size: loadColumnSizes()?.find(item => item.column === 'accessModules')?.size || 220,
            header: () => 'Доступи',
            enableSorting: false,
            footer: info => info.column.id,
            cell: ({getValue}) => (
                <AccessModulesCell schemaPages={moduleSchemaKeys} userPages={getValue() ?? {}}/>
            ),
        }),
        columnHelper.accessor('created_at', {
            id: "created_at",
            header: () => 'Дата створення',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('updated_at', {
            id: "updated_at",
            header: () => 'Дата зміни',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),

        columnHelper.accessor('deleted_at', {
            id: "deleted_at",
            header: () => 'Дата видалення',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 100,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({row}) => (<div className="flex flex-row gap-x-1 p-1 justify-end">
                {
                    auth?.user?.permissions?.pages?.['admin-users']?.update && !row?.original?.deleted_at &&
                    <Tooltip content="Редагувати">
                        <Button onClick={handleEdit(row?.id)} size="sm" color="yellow" title="Редагувати">
                            <i className="fa-regular fa-pen-to-square"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    auth?.user?.permissions?.pages?.['admin-users']?.delete && !row?.original?.deleted_at && row?.original?.id !== auth.user.id &&
                    <Tooltip content="Видалити">
                        <Button onClick={handleDelete(row?.id)} size="sm" color="red" title="Видалити">
                            <i className="fa-regular fa-trash"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    (auth?.user?.permissions?.pages?.['admin-users']?.restore && row?.original?.deleted_at) && row?.original?.id !== auth.user.id &&
                    <Tooltip content="Відновити">
                        <Button onClick={handleRestore(row?.id)} size="sm" color="green" title="Відновити">
                            <i className="fa-regular fa-trash-can-arrow-up"></i>
                        </Button>
                    </Tooltip>
                }
            </div>),
        }),
    ], [auth, users, moduleSchemaKeys])

    useEffect(() => {
        const storedFilters = localStorage.getItem(`${location.pathname}-filters`);
        const storedSorting = localStorage.getItem(`${location.pathname}-sorting`);
        if (storedFilters) {
            try {
                const parsed = JSON.parse(storedFilters);
                // Міграція зі старих окремих name/email → єдине q
                const {name, email, ...rest} = parsed || {};
                setFilters({
                    ...initialState,
                    ...rest,
                    q: rest.q ?? name ?? email ?? '',
                    unit: rest.unit ?? 'all',
                    isResponsible: rest.isResponsible ?? 'all',
                    trashed: rest.trashed ?? 'all',
                });
            } catch {
                setFilters(initialState);
            }
        }
        if (storedSorting) {
            setSorting(JSON.parse(storedSorting));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
        localStorage.setItem(`${location.pathname}-sorting`, JSON.stringify(sorting));
    }, [filters, sorting]);

    const toggleAdd = () => {
        setIsModalOpen(!isModalOpen)
        if (selectedId) {
            setSelectedId(null);
        }
    }

    const toggleUpdate = () => {
        setIsEditModalOpen(!isEditModalOpen)
        if (selectedId) {
            setSelectedId(null);
        }
    }

    const handleAddListener = (event) => {
        if (event.key === "Insert" && addRef.current) {
            setSelectedId(null);
            setIsEditModalOpen(false);
            addRef.current.click();
        }
    }

    useLayoutEffect(() => {
        if (!isEditModalOpen) {
            window.addEventListener('keyup', handleAddListener);
        }
        return () => {
            window.removeEventListener("keyup", handleAddListener);
        }
    }, [isEditModalOpen]);

    return (
        <AdminLayout data-i-doc="page:admin" active="users">
                <div className="mx-2 mt-5">

                    <div className="flex flex-row justify-between items-center">
                        <div className="mb-5 flex flex-wrap items-end gap-x-5 gap-y-2">
                            <div className="w-56">
                                <SearchInput
                                    size="xs"
                                    name="q"
                                    value={filters.q || ""}
                                    placeholder="Пошук"
                                    icon="fa-regular fa-magnifying-glass"
                                    onChange={handleChangeFilters}
                                />
                            </div>
                            <div className="w-48">
                                <SingleSelect
                                    size="xs"
                                    id="unit"
                                    label="Підрозділ"
                                    options={unitOptions}
                                    value={unitOptions.find((o) => String(o.id) === String(filters.unit)) || null}
                                    onChange={handleSelectFilter('unit')}
                                    isSearchable
                                    closeMenuOnSelect
                                />
                            </div>
                            <div className="w-52">
                                <SingleSelect
                                    size="xs"
                                    id="isResponsible"
                                    label="Матеріально відповідальний"
                                    options={isResponsibleOptions}
                                    value={isResponsibleOptions.find((o) => String(o.id) === String(filters.isResponsible)) || null}
                                    onChange={handleSelectFilter('isResponsible')}
                                    isSearchable={false}
                                    closeMenuOnSelect
                                />
                            </div>
                            <div className="w-40">
                                <SingleSelect
                                    size="xs"
                                    id="trashed"
                                    label="Видалений"
                                    options={trashedOptions}
                                    value={trashedOptions.find((o) => String(o.id) === String(filters.trashed)) || null}
                                    onChange={handleSelectFilter('trashed')}
                                    isSearchable={false}
                                    closeMenuOnSelect
                                />
                            </div>
                            <Tooltip content="Скинути фільтри">
                                <Button
                                    size="sm"
                                    className="h-10"
                                    disabled={!hasNonEmptyFilter()}
                                    onClick={handleClearFilters}>
                                    <i className="fa-regular fa-filter-slash"></i>
                                </Button>
                            </Tooltip>
                        </div>
                        <div className="mb-5 flex items-center gap-2">
                            {canUpdate && selectedUserIds.length > 0 && (
                                <Button
                                    color="blue"
                                    onClick={() => setIsBulkOpen(true)}
                                    className="flex items-center gap-2 normal-case"
                                >
                                    <i className="fa-solid fa-layer-group"/>
                                    Масові дії ({selectedUserIds.length})
                                </Button>
                            )}
                            {
                                auth?.user?.permissions?.pages?.['admin-users']?.create &&
                                <Button ref={addRef} title="Додати" disabled={isLoading} onClick={toggleAdd}>Додати</Button>
                            }
                        </div>
                    </div>
                    <Table
                        onDoubleClick={(row) => {
                            if (auth?.user?.permissions?.pages?.['admin-users']?.update && !row?.original?.deleted_at) {
                                setSelectedId(row.id);
                                setIsEditModalOpen(true);
                            }
                        }}
                        loading={isLoading}
                        canSelect={canUpdate}
                        rowSelectable={(row) => !row?.original?.deleted_at}
                        rowSelection={rowSelection}
                        onSelectRow={setRowSelection}
                        canChangeVisibility
                        canChangeResize
                        textSize="xs"
                        pagination={{
                            onLimitChange: handleLimit,
                            onPageChange: handlePageChange,
                            currentPage: filters?.page,
                            pageSize: users?.limit,
                            totalCount: users?.total,
                        }} data={users?.data} columns={columns} onSort={handleSortModel}
                    />
                </div>
                {
                    isModalOpen &&
                    <UserModal open={isModalOpen} onClose={toggleAdd}/>
                }
                {
                    isEditModalOpen &&
                    <UserUpdateModal open={isEditModalOpen} onClose={toggleUpdate} id={selectedId}/>
                }
                {isBulkOpen && (
                    <BulkActionsModal
                        open={isBulkOpen}
                        userIds={selectedUserIds}
                        onClose={({clearSelection} = {}) => {
                            setIsBulkOpen(false);
                            if (clearSelection) {
                                setRowSelection({});
                            }
                        }}
                    />
                )}
            <BackToTop/>
        </AdminLayout>
    );
};

export default Index;
