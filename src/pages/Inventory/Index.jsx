import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Link, usePage} from "@inertiajs/react";
import {convertDate} from "@/utils.js";
import AdvancedSelect from "@/Components/fields/AdvancedSelect.jsx";
import {createColumnHelper} from "@tanstack/react-table";
import Table, {loadColumnSizes} from "@/Components/Table/Table.jsx";
import InventoryModal from "@/ReactPages/Inventory/InventoryModal.jsx";
import toast from "react-hot-toast";
import InventoryDetailsModal from "@/ReactPages/Inventory/InventoryDetailsModal.jsx";
import {Badge, Button, Menu, MenuHandler, MenuItem, MenuList, Switch, Tooltip} from "@material-tailwind/react";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchData} from "@/ReactPages/Inventory/utils.js";
import Page from "@/Components/Page.jsx";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import SearchInput from "@/Components/fields/SearchInput.jsx";
import {format} from "date-fns";
import DateRangePicker from "@/Components/fields/DateRangePicker.jsx";
// import InventoryAttachmentsDropdown from "./InventoryAttachmentsDropdown.jsx";
import InventoryAttachmentsInline from "./InventoryAttachmentsInline.jsx";
import InventoryNoteCell from "./InventoryNoteCell.jsx";
import InventoryCommentModal from "./InventoryCommentModal.jsx";
import CollapsibleSection from "@/Components/CollapsibleSection.jsx";

const columnHelper = createColumnHelper();
const Index = () => {
    const {auth} = usePage().props;
    const token = document.querySelector('meta[name="csrfToken"]').getAttribute('content');
    const addRef = useRef(null);
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        fBaileeUser: [],
        fLocation: [],
        fResponsibleUser: [],
        fText: "",
        fType: [],
        fNode: [],
        from: undefined,
        to: undefined,
        hideDeleted: false,
        hideNonInventory: false,
        page: 0,
        limit: 50,
    });
    const [sorting, setSorting] = useState([]);
    const [pinnedRows, setPinnedRows] = useState([]);
    const {data: dictionary, isFetching: isDictionaryFetching} = useQuery({
        queryKey: ['dictionary', 'inventory/options'],
        queryFn: async () => {
            const response = await axios.get('api/inventory/options');
            const data = response.data.data;
            const {location, ...rest} = data;
            return {location: Object.values(location ?? {}), ...rest};
        },
        staleTime: 5 * 60 * 1000,
    });

    const inventoryLocation = dictionary?.inventoryLocation ?? [];
    const inventoryType = dictionary?.inventoryType ?? [];
    const users = dictionary?.user ?? [];
    const responsibleUsers = dictionary?.responsibleUser ?? [];
    const {
        data: inventories,
        isFetching: isInventoryFetching,
    } = useQuery({
        queryKey: ['inventories', filters],
        queryFn: () => fetchData({...filters, userId: auth?.user?.id}),
        placeholderData: keepPreviousData,
    });

    const deleteMutation = useMutation({
        mutationFn: async ({id, userId}) => {
            const response = await fetch(`api/inventory/${id}`, {
                method: 'DELETE',
                headers: {
                    'userId': userId,
                    "X-CSRF-Token": token,
                    "Accept": "application/json"
                },

            })
            return response.json();
        },
        onSuccess: async () => toast.success('Успішно видалено'),
        onError: async () => toast.error('Помилка видалення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['inventories']}),
    })

    const restoreMutation = useMutation({
        mutationFn: async ({id, userId}) => {
            const response = await fetch(`api/inventory/${id}/restore`, {
                method: 'PATCH',
                headers: {
                    'userId': userId,
                    "X-CSRF-Token": token,
                    "Accept": "application/json"
                },
            })
            return response.json();
        },
        onSuccess: async () => toast.success('Успішно відновлено'),
        onError: async () => toast.error('Помилка відновлення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['inventories']}),
    })


    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCloneOpen, setIsCloneOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [commentModal, setCommentModal] = useState(null);

    const handleDetails = (id) => () => {
        setSelectedId(id);
        setIsDetailsOpen(true);
    }

    const handleRestore = (id) => () => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900 ">
                        Відновити елемент?
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
                        Видалити елемент?
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
        if (id) {
            setSelectedId(id)
            toggleEditOpen()
        }
    }

    const handleClone = (id) => () => {
        if (id) {
            setSelectedId(id);
            setIsCloneOpen(true)
        }
    }

    const showRestoreBtn = (row) => {
        if (!row) return false;
        const restore = auth?.user?.permissions?.pages?.inventory?.restore;
        if (restore === true && Boolean(row?.original?.deletedAt)) {
            return true;
        }
        return restore === "individual" && Boolean(row?.original?.deletedAt) && auth?.user?.id === row?.original?.createdUserId;

    }

    const columns = useMemo(() => [
        columnHelper.accessor('valueTypeId', {
            id: 'valueTypeId',
            cell: (info) => {
                const valueType = info.getValue() ? inventoryType.find(t=>t.id === info.getValue())  : null;
                return valueType ?
                    <span className="inline-flex gap-x-2 items-center"><i
                        className={`${valueType?.icon} fa-lg`}></i> {valueType?.caption}  </span>
                    : null;
            },
            size: loadColumnSizes()?.find(item => item.column === 'valueTypeId')?.size || 120,
            header: () => 'Тип',
            footer: info => info.column.id,
            enableSorting: true,
        }),
        columnHelper.accessor('inventoryNum', {
            id: 'inventoryNum',
            size: loadColumnSizes()?.find(item => item.column === 'inventoryNum')?.size || 120,
            cell: info => info.getValue(),
            header: () => 'Інвентарний номер',
            footer: info => info.column.id,
        }),
        columnHelper.accessor('registryNum', {
            id: 'registryNum',
            size: loadColumnSizes()?.find(item => item.column === 'registryNum')?.size || 120,
            cell: info => info.getValue(),
            header: () => 'Реєстр. №',
            footer: info => info.column.id,
        }),
        columnHelper.accessor('locationId', {
            id: 'locationId',
            header: () => 'Розташування',
            size: loadColumnSizes()?.find(item => item.column === 'locationId')?.size || 80,
            cell: info => info.getValue() ? inventoryLocation.find(l=>l.id === info.getValue())?.caption : null,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('serial', {
            id: "serial",
            header: () => 'Серійний номер',
            size: loadColumnSizes()?.find(item => item.column === 'serial')?.size || 150,
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),
        columnHelper.accessor('caption', {
            id: "caption",
            header: () => 'Заголовок',
            size: loadColumnSizes()?.find(item => item.column === 'caption')?.size || 250,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('details', {
            id: "details",
            header: () => 'Деталі',
            size: loadColumnSizes()?.find(item => item.column === 'details')?.size || 150,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('responsibleUserId', {
            id: 'responsibleUserId',
            header: () => 'Мат. відповідальний',
            size: loadColumnSizes()?.find(item => item.column === 'responsibleUserId')?.size || 100,
            cell: info => info.getValue() ? responsibleUsers.find(u=>u.id === info.getValue())?.initials : null,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('baileeUserId', {
            id: 'baileeUserId',
            header: () => 'Відповідальний',
            cell: info => info.getValue() ? users.find(u=>u.id === info.getValue())?.caption : null,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('note', {
            id: 'note',
            header: () => 'Примітка',
            size: loadColumnSizes()?.find(item => item.column === 'note')?.size || 200,
            footer: info => info.column.id,
            cell: info => (
                <InventoryNoteCell
                    note={info.getValue()}
                    comments={info.row.original.comments ?? []}
                    users={users}
                    inventoryId={info.row.original.id}
                    currentUserId={auth?.user?.id}
                    token={token}
                    onOpenModal={setCommentModal}
                />
            ),
        }),
        columnHelper.accessor('cost', {
            id: 'cost',
            header: () => 'Вартість',
            size: loadColumnSizes()?.find(item => item.column === 'cost')?.size || 100,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('amount', {
            id: 'amount',
            header: () => 'Кількість',
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('createdAt', {
            id: 'createdAt',
            header: () => 'Створено',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 120,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('updatedAt', {
            id: 'updatedAt',
            header: () => 'Оновлено',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 120,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('deletedAt', {
            id: 'deletedAt',
            header: () => "Видалено",
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 120,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('nodes', {
            id: 'nodes',
            header: () => 'Вузли',
            size: loadColumnSizes()?.find(item => item.column === 'nodes')?.size || 160,
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => {
                const nodes = info.getValue() ?? [];
                if (!nodes.length) return null;
                return (
                    <div className="flex flex-wrap gap-1">
                        {nodes.map(node => (
                            <span
                                key={node.id}
                                className="inline-block text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                title={node.name}
                            >
                                {node.name}
                            </span>
                        ))}
                    </div>
                );
            },
        }),
        columnHelper.accessor("attachments", {
            id: 'attachments',
            size: loadColumnSizes()?.find(item => item.column === 'attachments')?.size || 120,
            header: () => 'Файли',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => <InventoryAttachmentsInline attachments={info.getValue() ?? []}/>,
        }),
        /*
        columnHelper.accessor("attachments_count", {
            id: 'attachments_count',
            size: loadColumnSizes()?.find(item => item.column === 'attachments_count')?.size || 80,
            header: () => 'Кількість файлів',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => <InventoryAttachmentsDropdown id={info.row.id} count={info.getValue()}/>
        }),
        */

        columnHelper.display({
            id: 'actions',
            maxSize: 80,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Дії',
            cell: ({row}) => (
                <div className="flex flex-row gap-x-1 p-1 justify-end">
                    {
                        (auth?.user?.permissions?.pages?.inventory?.read && !row?.original?.deletedAt || auth?.user?.permissions?.pages?.inventory?.restore) &&
                        <Tooltip content="Деталі">
                            <Button onClick={handleDetails(row?.id)} size="sm" variant="outlined" color="blue">
                                <i className="fa-regular fa-circle-info"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        auth?.user?.permissions?.pages?.inventory?.create && !row?.original?.deletedAt &&
                        <Tooltip content="Створити копію">
                            <Button onClick={handleClone(row?.id)} size="sm" variant="outlined" title="Створити копію">
                                <i className="fa-solid fa-clone"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        auth?.user?.permissions?.pages?.inventory?.update && !row?.original?.deletedAt &&
                        <Tooltip content="Редагувати">
                            <Button onClick={handleEdit(row?.id)} size="sm" color="yellow" title="Редагувати">
                                <i className="fa-regular fa-pen-to-square"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        auth?.user?.permissions?.pages?.inventory?.delete && !row?.original?.deletedAt &&
                        <Tooltip content="Видалити">
                            <Button onClick={handleDelete(row?.id)} size="sm" color="red" title="Видалити">
                                <i className="fa-regular fa-trash"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        showRestoreBtn(row) ?
                            <Tooltip content="Відновити">
                                <Button onClick={handleRestore(row?.id)} size="sm" color="green" title="Відновити">
                                    <i className="fa-regular fa-trash-can-arrow-up"></i>
                                </Button>
                            </Tooltip>
                            : null
                    }
                </div>),
        }),
    ], [auth, inventoryType, inventoryLocation, users, responsibleUsers]);

    const hasNonEmptyFilter = () => {
        const {
            fBaileeUser,
            fLocation,
            from,
            to,
            fResponsibleUser,
            fText,
            fType,
            fNode,
            hideDeleted,
            hideNonInventory
        } = filters;
        return (
            fBaileeUser.length > 0 ||
            fLocation.length > 0 ||
            fResponsibleUser.length > 0 ||
            fText.trim() !== "" ||
            fType.length > 0 ||
            fNode.length > 0 ||
            from ||
            to ||
            Boolean(hideDeleted) ||
            Boolean(hideNonInventory)
        );
    };

    useEffect(() => {
        const storedFilters = localStorage.getItem(`${location.pathname}-filters`);
        const storedSorting = localStorage.getItem(`${location.pathname}-sorting`);
        if (storedFilters) {
            setFilters(JSON.parse(storedFilters));
        }
        if (storedSorting) {
            setSorting(JSON.parse(storedSorting));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
        localStorage.setItem(`${location.pathname}-sorting`, JSON.stringify(sorting));
    }, [filters, sorting]);


    const handlePageChange = (pageNumber) => {
        setFilters(prevState => ({...prevState, page: pageNumber - 1}));
    }
    const handleLimit = (value) => {
        setFilters(prevState => ({...prevState, page: 0, limit: value}));
    }

    const handleChangeOptions = (key = '') => (newSelectedIds) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: newSelectedIds}));
    };

    const handleChangeInput = (event) => {
        setFilters(prevState => ({...prevState, fText: event.target.value}));
    }

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

    const handlePinRow = (rows = []) => {
        setPinnedRows(rows);
    }

    const handleClearFilters = () => {
        setFilters({
            fBaileeUser: [],
            fLocation: [],
            fResponsibleUser: [],
            fText: "",
            fType: [],
            fNode: [],
            page: 0,
            from: undefined,
            to: undefined,
            limit: filters.limit,
            hideDeleted: false,
            hideNonInventory: false
        })
    }

    const handleAdd = () => {
        toggleEditOpen()
    }

    const toggleEditOpen = () => {
        setIsEditOpen(!isEditOpen)
    }
    const onCloseModal = () => {
        if (isEditOpen){
            toggleEditOpen()
        }
        if (isCloneOpen){
            setIsCloneOpen(false);
        }
        if (selectedId) {
            setSelectedId(null);
        }
    }

    const onDetailsClose = () => {
        setIsDetailsOpen(!isDetailsOpen);
        if (selectedId) {
            setSelectedId(null);
        }
    }


    const getActiveColumns = () => {
        const storedCols = JSON.parse(localStorage.getItem(`${location.pathname}-columns`));
        return Object.keys(storedCols).length > 0 ? columns.filter(c => c.id !== "actions").reduce((acc, col) => {
            if (storedCols.hasOwnProperty(col.id)) {
                acc[col.id] = storedCols[col.id];
            } else if (col.id) {
                acc[col.id] = true;
            }
            return acc;
        }, {}) : Object.values(columns).filter(c => c.id !== "actions").reduce((acc, c) => {
            acc[c.id] = true;
            return acc;
        }, {})
    }

    const handleExport = (e) => {
        e.preventDefault();
        const query = {
            fBaileeUser: filters?.fBaileeUser?.map(u => u?.value),
            fLocation: filters?.fLocation?.map(u => u?.value),
            fResponsibleUser: filters?.fResponsibleUser?.map(u => u?.value),
            fText: filters?.fText,
            fType: filters?.fType?.map(u => u?.value)
        }
        const url = `/inventory/export?filters=${JSON.stringify(query)}&columns=${JSON.stringify(getActiveColumns())}&hideNonInventory=${filters.hideNonInventory}`

        window.open(url, '_blank');
    }

    const handleSelectedExport = (e) => {
        e.preventDefault();
        const query = {
            fId: pinnedRows
        }

        const url = `/inventory/export?filters=${JSON.stringify(query)}&columns=${JSON.stringify(getActiveColumns())}&hideNonInventory=${filters.hideNonInventory}`
        window.open(url, '_blank');
    }

    const toggleFilterSwitch = ({target}) => {
        setFilters(prevState => ({...prevState, [target.name]: target.checked}));
    }

    const handleAddListener = (event) => {
        if (event.key === "Insert" && addRef.current) {
            setSelectedId(null);
            setIsDetailsOpen(false);
            addRef.current.click();
        }
    }

    useLayoutEffect(() => {
        if (!isEditOpen && !isDetailsOpen) {
            window.addEventListener('keyup', handleAddListener);
        }
        return () => {
            window.removeEventListener("keyup", handleAddListener);
        }
    }, [isEditOpen, isDetailsOpen]);

    const handleChangeDate = (range) => {
        if (range?.from || range?.to) {
            const from = format(range.from, "yyyy-MM-dd") || "";
            const to = format(range.to, "yyyy-MM-dd") || "";
            setFilters(prevState => ({...prevState, from: from, to: to}))
        } else {
            setFilters(prevState => ({...prevState, from: undefined, to: undefined}))
        }
    }


    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:inventory" className="flex mt-2 mr-2 flex-row justify-end gap-x-2">
                    <Tooltip content="Версія для друку">
                        <Menu>
                            <Badge content={pinnedRows.length}
                                   invisible={!Boolean(pinnedRows.length)}>
                                <MenuHandler>
                                    <Button size="sm" variant="outlined"> <i className="fa-regular fa-print"></i></Button>
                                </MenuHandler>
                            </Badge>
                            <MenuList className="p-0">
                                <MenuItem className="hover:bg-gray-200" onClick={handleExport}
                                          disabled={!inventories?.data?.length}>
                                    Всі елементи
                                </MenuItem>
                                <MenuItem className="hover:bg-gray-200" onClick={handleSelectedExport}
                                          disabled={!Boolean(pinnedRows.length)}>
                                    Обрані елементи: {pinnedRows.length}
                                </MenuItem>
                            </MenuList>
                        </Menu>

                    </Tooltip>
                    <Tooltip content="Управління вузлами (комплектами)">
                        <Link href="/inventory/nodes">
                            <Button size="sm" variant="outlined">
                                <i className="fa-regular fa-diagram-nested mr-1.5"/>Вузли
                            </Button>
                        </Link>
                    </Tooltip>
                    {auth?.user?.permissions?.pages?.inventory?.create &&
                        <Button size="sm" ref={addRef} title="Додати" onClick={handleAdd}>
                            Додати
                        </Button>
                    }
                </div>
                <CollapsibleSection
                    title="Фільтри"
                    showHiddenAppliedBadge
                    className="mt-2 mx-2 mb-5 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-md dark:border-gray-700 dark:bg-gray-900/60 sm:p-4"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="min-w-0" data-filter-active={filters?.fText?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="caption" value={filters?.fText} label="Фільтр за текстом"
                                         onChange={handleChangeInput}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fType?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={inventoryType} label="Тип" id="fType"
                                            selectedOptions={filters.fType}
                                            onChange={handleChangeOptions('fType')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fBaileeUser?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={users} label="Відповідальний"
                                            id="fBaileeUser"
                                            selectedOptions={filters.fBaileeUser}
                                            onChange={handleChangeOptions('fBaileeUser')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fResponsibleUser?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={responsibleUsers}
                                            label="Мат. відповідальний"
                                            id="fResponsibleUser"
                                            selectedOptions={filters.fResponsibleUser}
                                            onChange={handleChangeOptions('fResponsibleUser')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fLocation?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={inventoryLocation} label="Розташування"
                                            id="fLocation"
                                            selectedOptions={filters.fLocation}
                                            onChange={handleChangeOptions('fLocation')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fNode?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={dictionary?.inventoryNode ?? []} label="Вузол"
                                            id="fNode"
                                            selectedOptions={filters.fNode}
                                            onChange={handleChangeOptions('fNode')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                            <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                             label="Дата оновлення"/>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            <div className="flex flex-wrap items-center gap-2">
                                {Boolean(auth?.user?.permissions?.pages?.inventory?.restore) &&
                                    <Tooltip content="Приховати видалені">
                                        <label
                                            htmlFor="hideDeletedInventory"
                                            data-filter-active={filters.hideDeleted ? "true" : "false"}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200"
                                        >
                                            <Switch id="hideDeletedInventory" size="xs" ripple={false}
                                                    color="green"
                                                    name="hideDeleted" checked={filters.hideDeleted}
                                                    onChange={toggleFilterSwitch}/>
                                            <span>Приховати видалені</span>
                                        </label>
                                    </Tooltip>
                                }
                                <Tooltip content="Приховати те, що не на обліку">
                                    <label
                                        htmlFor="hideNonInventory"
                                        data-filter-active={filters.hideNonInventory ? "true" : "false"}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200"
                                    >
                                        <Switch id="hideNonInventory" size="xs" ripple={false}
                                                color="green"
                                                name="hideNonInventory" checked={filters.hideNonInventory}
                                                onChange={toggleFilterSwitch}/>
                                        <span>Не на обліку</span>
                                    </label>
                                </Tooltip>
                            </div>
                            <Tooltip content="Скинути фільтри">
                                <Button
                                    size="sm"
                                    className="h-9 px-3"
                                    disabled={!hasNonEmptyFilter()}
                                    onClick={handleClearFilters}>
                                    <i className="fa-regular fa-filter-slash mr-1"></i>
                                    Скинути
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </CollapsibleSection>
                <div className="mt-6 mx-2 mb-10">
                    <Table
                        textSize="xs"
                        onRowClick={(row) => {
                            if (window.getSelection()?.toString()) return;
                            if ((auth?.user?.permissions?.pages?.inventory?.read && !row?.original?.deletedAt) || auth?.user?.permissions?.pages?.inventory?.restore) {
                                setSelectedId(row.id);
                                setIsDetailsOpen(true);
                            }
                        }}
                        onDoubleClick={(row) => {
                            if (auth?.user?.permissions?.pages?.inventory?.update && !row?.original?.deletedAt) {
                                setSelectedId(row.id);
                                setIsEditOpen(true);
                            }
                        }}
                        canPin
                        onRowPinning={handlePinRow}
                        loading={isDictionaryFetching || isInventoryFetching}
                        canChangeResize
                        canChangeVisibility pagination={{
                        onLimitChange: handleLimit,
                        onPageChange: handlePageChange,
                        currentPage: filters?.page,
                        pageSize: inventories?.limit,
                        totalCount: inventories?.total,
                    }} data={inventories?.data ?? []} columns={columns} onSort={handleSortModel}/>
                </div>
                {
                    (isEditOpen || isCloneOpen) &&
                    <InventoryModal id={selectedId} isClone={isCloneOpen} dictionary={dictionary} open={isEditOpen || isCloneOpen} onClose={onCloseModal}/>
                }
                {
                    isDetailsOpen &&
                    <InventoryDetailsModal open={isDetailsOpen} dictionary={dictionary} onClose={onDetailsClose}
                                           id={selectedId}/>
                }
                <InventoryCommentModal
                    modal={commentModal}
                    onClose={() => setCommentModal(null)}
                    token={token}
                    currentUserId={auth?.user?.id}
                />
            </Page>
        </DictionaryProvider>
    );
};

export default Index;
