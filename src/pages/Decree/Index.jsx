import {createColumnHelper} from "@tanstack/react-table";
import {usePage} from "@inertiajs/react";
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import Page from "@/Components/Page.jsx";
import {Button, Tooltip} from "@material-tailwind/react";
import SearchInput from "@/Components/fields/SearchInput.jsx";
import {format} from "date-fns";
import Table, {loadColumnSizes} from "@/Components/Table/Table.jsx";
import {BOOLEANS, convertDate, SANC_DECREE_TYPES, serializeParams} from "@/utils.js";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import UpdateDecreeModal from "@/ReactPages/Decree/UpdateDecreeModal.jsx";
import DecreeModal from "@/ReactPages/Decree/DecreeModal.jsx";
import CreateDecree from "@/ReactPages/Decree/CreateDecree.jsx";
import toast from "react-hot-toast";
import AttachmentsDropdown from "@/ReactPages/Decree/AttachmentsDropdown.jsx";
import DateRangePicker from "../../Components/fields/DateRangePicker.jsx";
import CollapsibleSection from "@/Components/CollapsibleSection.jsx";


const initialState = {
    limit: 50,
    page: 0,
    code: '',
    from: undefined,
    to: undefined,
    isActive: undefined
}


const columnHelper = createColumnHelper();
const Index = () => {
    const {auth} = usePage().props;
    const addRef = useRef(null);
    const queryClient = useQueryClient();


    const [filters, setFilters] = useState(initialState);
    const [sorting, setSorting] = useState([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const clearSelected = () => setSelectedId(null);

    const {data, isFetching} = useQuery({
        queryKey: ['decree', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                typeId: Boolean(filters.typeId?.value) ? filters.typeId?.value : undefined,
                isActive: Boolean(filters?.isActive?.value) ? parseInt(filters?.isActive?.value) : undefined,
            }
            const searchParams = serializeParams(params);
            const response = await axios.get("api/decree", {
                params: searchParams,
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            })
            return response.data;
        },
        placeholderData: keepPreviousData,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return await axios.delete(`api/decree/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            });
        },
        onSuccess: async () => toast.success('Успішно видалено'),
        onError: async () => toast.error('Помилка видалення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['decree']}),
    })

    const handleClearFilters = () => {
        setFilters({...initialState, limit: filters.limit})
    }

    const handleChangeFilters = ({target: {name, value}}) => {
        setFilters({...filters, [name]: value});
    }

    const handleLimit = (value) => {
        setFilters(prevState => ({...prevState, page: 0, limit: value}));
    }
    const handlePageChange = (pageNumber) => {
        setFilters(prevState => ({...prevState, page: pageNumber - 1}));
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

    const handleChangeOptions = (key = '') => (option) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: option}));
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

    const handleChangeDate = (range) => {
        if (range?.from || range?.to) {
            const from = format(range.from, "yyyy-MM-dd") || "";
            const to = format(range.to, "yyyy-MM-dd") || "";
            setFilters(prevState => ({...prevState, from: from, to: to}))
        } else {
            setFilters(prevState => ({...prevState, from: initialState.from, to: initialState.to}))
        }
    }

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
        localStorage.setItem(`${location.pathname}-sorting`, JSON.stringify(sorting));
    }, [filters, sorting]);

    const columns = useMemo(() => [
        columnHelper.accessor("id", {
            id: 'id',
            size: 80,
            enableResizing: false,
            header: () => 'ID',
            footer: info => info.column.id,
        }),
        columnHelper.accessor("typeId", {
            id: 'typeId',
            size: loadColumnSizes()?.find(item => item.column === 'typeId')?.size || 150,
            header: () => 'Тип',
            footer: info => info.column.id,
        }),
        columnHelper.accessor("code", {
            id: 'code',
            size: loadColumnSizes()?.find(item => item.column === 'code')?.size || 100,
            header: () => 'Код',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("date", {
            id: 'date',
            size: loadColumnSizes()?.find(item => item.column === 'date')?.size || 100,
            header: () => 'Дата',
            footer: info => info.column.id,
            cell: props => props.getValue() ?
                format(props.getValue(), 'dd.MM.yyyy')
                : ' ---- ',
        }),
        columnHelper.accessor("projects_count", {
            id: 'projects_count',
            size: 80,
            header: () => 'К-сть проєктів',
            enableSorting: false,
            enableResizing: false,
            cell: ({row}) => {
                const {project_init_count = 0, project_update_count = 0, project_cancel_count = 0} = row.original;
                return <div>
                    <p><i className="fa-solid fa-right-to-bracket text-green-500"
                             title="Застосування"></i> {project_init_count}</p>
                    <p><i className="fa-solid fa-right-left text-blue-500 " title="Зміна"></i> {project_update_count}</p>
                    <p><i className="fa-solid fa-right-from-bracket text-red-800 "
                             title="Скасування"></i> {project_cancel_count}</p>
                </div>
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("comment", {
            id: 'comment',
            size: loadColumnSizes()?.find(item => item.column === 'comment')?.size || 250,
            header: () => 'Коментар',
            enableSorting: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('createdAt', {
            id: "createdAt",
            header: () => 'Дата створення',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 100,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('updatedAt', {
            id: "updatedAt",
            header: () => 'Дата зміни',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 100,
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
        columnHelper.accessor("attachments_count", {
            id: 'attachments_count',
            size: loadColumnSizes()?.find(item => item.column === 'attachments_count')?.size || 80,
            header: () => 'Кількість файлів',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => <AttachmentsDropdown id={info.row.id} count={info.getValue()}/>
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 100,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({row}) => (<div className="flex flex-row gap-x-2 p-2 justify-end">
                <Tooltip content="Детальна інформація">
                    <Button onClick={handleDetails(row?.id)} size="sm"
                            variant="outlined" color="blue">
                        <i className="fa-regular fa-circle-info"></i>
                    </Button>
                </Tooltip>

                {
                    Boolean(auth?.user?.permissions?.pages?.decree?.update)
                    && !Boolean(row?.original?.deleted_at)
                    && <Tooltip content="Редагувати">
                        <Button size="sm"
                                color="yellow" onClick={() => {
                            setIsEditOpen(true);
                            setSelectedId(row?.original?.id)
                        }}>
                            <i className="fa-regular fa-pen-to-square"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    Boolean(auth?.user?.permissions?.pages?.decree?.delete)
                    && !Boolean(row?.original?.deleted_at)
                    && <Tooltip content="Видалити">
                        <Button
                            onClick={handleDelete(row?.id)}
                            size="sm"
                            color="red">
                            <i className="fa-regular fa-trash"></i>
                        </Button>
                    </Tooltip>
                }
            </div>),
        }),

    ], [auth, data])

    const decrees = useMemo(() => {
        if (data) {
            return {
                ...data, data: data?.data?.map(row => {
                    return {
                        ...row,
                        typeId: SANC_DECREE_TYPES.find(i => i.value === row.typeId).label,
                        isActive: BOOLEANS.find(i => i.value === row.isActive)?.label
                    }
                })
            }
        }
    }, [data]);

    const handleDetails = (id) => () => {
        setIsDetailsOpen(!isDetailsOpen);
        setSelectedId(id);
    };

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

    const handleAdd = () => {
        setOpenCreate(true);
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
                            deleteMutation.mutate(id)
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

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:decree" className="flex mt-2 mr-2 flex-row justify-end gap-x-2">
                    {auth?.user?.permissions?.pages?.decree?.create &&
                        <Button ref={addRef} title="Додати" onClick={handleAdd}>
                            Додати
                        </Button>
                    }
                </div>

                <div className="mt-2 mx-2">
                    <CollapsibleSection
                        title="Фільтри"
                        showHiddenAppliedBadge
                        className="mb-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-md dark:border-gray-700 dark:bg-gray-900/60 sm:p-4"
                    >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                            <div className="min-w-0" data-filter-active={filters?.typeId?.value !== undefined ? "true" : "false"}>
                                <SingleSelect size="xs" closeMenuOnSelect options={SANC_DECREE_TYPES}
                                              label="Тип"
                                              id="typeId"
                                              value={filters.typeId}
                                              onChange={handleChangeOptions('typeId')}/>
                            </div>
                            <div className="min-w-0" data-filter-active={filters?.code?.trim() ? "true" : "false"}>
                                <SearchInput size="xs" name="code" value={filters.code} label="Код"
                                             onChange={handleChangeFilters}/>
                            </div>
                            <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                                <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                                 label="Дата"/>
                            </div>
                            <div className="min-w-0" data-filter-active={filters?.isActive?.value !== undefined ? "true" : "false"}>
                                <SingleSelect size="xs" closeMenuOnSelect options={BOOLEANS}
                                              label="Діючий"
                                              id="isActive"
                                              value={filters.isActive}
                                              onChange={handleChangeOptions('isActive')}/>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                                <Tooltip content="Скинути фільтри">
                                    <Button
                                        size="sm"
                                        className="h-9 px-3"
                                        onClick={handleClearFilters}>
                                        <i className="fa-regular fa-filter-slash mr-1"></i>
                                        Скинути
                                    </Button>
                                </Tooltip>
                            </div>
                        </div>
                    </CollapsibleSection>
                    <Table
                        loading={isFetching}
                        canChangeVisibility
                        canChangeResize
                        textSize="xs"
                        pagination={{
                            onLimitChange: handleLimit,
                            onPageChange: handlePageChange,
                            currentPage: filters?.page,
                            pageSize: decrees?.limit,
                            totalCount: decrees?.total,
                        }} data={decrees?.data} columns={columns} onSort={handleSortModel}
                    />
                </div>

                {
                    selectedId && isDetailsOpen &&
                    <DecreeModal open={isDetailsOpen} selectedId={selectedId} onClose={() => {
                        clearSelected();
                        setIsDetailsOpen(false);
                    }}/>
                }
                {
                    selectedId && isEditOpen &&
                    <UpdateDecreeModal open={isEditOpen} selectedId={selectedId} onClose={() => {
                        clearSelected();
                        setIsEditOpen(false);
                    }}/>
                }

                {
                    openCreate &&
                    <CreateDecree open={openCreate} onClose={() => setOpenCreate(!openCreate)}/>
                }
            </Page>

        </DictionaryProvider>
    );
};

export default Index;
