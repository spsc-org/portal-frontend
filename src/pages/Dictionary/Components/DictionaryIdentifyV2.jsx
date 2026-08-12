import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import Table, {loadColumnSizes} from "@/Components/Table/Table.jsx";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {usePage} from "@inertiajs/react";
import {createColumnHelper} from "@tanstack/react-table";
import {useDictionaryContext} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import AdvancedSelect from "@/Components/fields/AdvancedSelect.jsx";
import {Button, Switch, Tooltip} from "@material-tailwind/react";
import {
    deleteIdentifyV2Mutation,
    fetchIdentifiersV2,
    GROUPS,
    restoreIdentifyV2Mutation,
    transformIdentifyV2Response,
} from "@/ReactPages/Dictionary/utils.js";
import {convertDate} from "@/utils.js";
import IdentifyV2DetailsModal from "@/ReactPages/Dictionary/Components/IdentifyV2DetailsModal.jsx";
import toast from "react-hot-toast";
import IdentifyV2Modal from "@/ReactPages/Dictionary/Components/IdentifyV2Modal.jsx";
import SearchInput from "@/Components/fields/SearchInput.jsx";
import DateRangePicker from "@/Components/fields/DateRangePicker.jsx";
import {format} from "date-fns";

const columnHelper = createColumnHelper();
const LS_KEY_FILTERS = `dictionary-v2-filters`;
const LS_KEY_SORTING = `dictionary-v2-sorting`;

const DictionaryIdentifyV2 = () => {
    const {state} = useDictionaryContext();
    const {auth, countries = [], subjectTypes = []} = usePage().props;
    const addRef = useRef(null);
    const [selectedId, setSelectedId] = useState(null);
    const queryClient = useQueryClient();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [filters, setFilters] = useState({
        group: [],
        subjectTypeId: [],
        code: '',
        name: '',
        comment: '',
        hideDeleted: false,
        belongCountryId: [],
        from: undefined,
        to: undefined,
        limit: 10,
        page: 0,
    });
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [sorting, setSorting] = useState([]);

    const {data: identifies, isLoading, isFetching} = useQuery({
        queryKey: ['dictionary-identify-v2', filters],
        queryFn: () => fetchIdentifiersV2({...filters, userId: auth?.user?.id}),
        placeholderData: keepPreviousData,
    })

    const deleteMutation = useMutation({
        mutationFn: deleteIdentifyV2Mutation,
        onSuccess: async () => toast.success('Успішно видалено'),
        onError: async () => toast.error('Помилка видалення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['dictionary-identify-v2', filters]}),
    })

    const restoreMutation = useMutation({
        mutationFn: restoreIdentifyV2Mutation,
        onSuccess: async () => toast.success('Успішно відновлено'),
        onError: async ({response}) => toast.error(response?.data?.message || 'Помилка відновлення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['dictionary-identify-v2', filters]}),
    })

    const handleChangeFilters = ({target: {name, value}}) => {
        setFilters({...filters, [name]: value});
    }
    const handleChangeOptions = (key = '') => (newSelectedIds) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: newSelectedIds}));
    };
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
                direction: Boolean(sortModel[0].desc) ? "desc" : "asc",
            }));
        }
    };

    const handleRestore = (id) => () => {
        toast((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-3xl w-full pointer-events-auto flex items-center flex-row`}>
                <p className="text-sm font-medium text-gray-900">Відновити елемент?</p>
                <div className="flex flex-row gap-x-1">
                    <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>Скасувати</Button>
                    <Button size="sm" color="green" onClick={() => {
                        toast.dismiss(t.id);
                        restoreMutation.mutate({id, userId: auth?.user?.id});
                    }}>Відновити</Button>
                </div>
            </div>
        ), {duration: 10000, position: 'top-center'})
    }

    const handleDetails = (id) => () => {
        setSelectedId(id);
        setIsDetailsOpen(true);
    }

    const handleDelete = (id) => () => {
        toast((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-3xl w-full pointer-events-auto flex items-center gap-x-1 flex-row`}>
                <p className="text-sm font-medium text-gray-900">Видалити елемент?</p>
                <div className="flex flex-row gap-x-1">
                    <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>Скасувати</Button>
                    <Button size="sm" color="red" onClick={() => {
                        toast.dismiss(t.id);
                        deleteMutation.mutate({id, userId: auth?.user?.id});
                    }}>Видалити</Button>
                </div>
            </div>
        ), {duration: 10000, position: 'top-center'})
    }

    const handleEdit = (id) => () => {
        setSelectedId(id);
        setIsAddOpen(true);
    }

    const onDetailsClose = () => {
        setIsDetailsOpen(!isDetailsOpen);
        if (selectedId) setSelectedId(null);
    }

    const columns = useMemo(() => [
        columnHelper.accessor("code", {
            id: 'code',
            size: loadColumnSizes()?.find(item => item.column === 'code')?.size || 100,
            header: () => 'Код',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("group", {
            id: 'group',
            size: loadColumnSizes()?.find(item => item.column === 'group')?.size || 100,
            header: () => 'Група',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("pattern", {
            id: 'pattern',
            size: loadColumnSizes()?.find(item => item.column === 'pattern')?.size || 100,
            header: () => 'Паттерн',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_uk", {
            id: 'name_uk',
            size: loadColumnSizes()?.find(item => item.column === 'name_uk')?.size || 250,
            header: () => 'Назва',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_en", {
            id: 'name_en',
            size: loadColumnSizes()?.find(item => item.column === 'name_en')?.size || 250,
            header: () => 'Назва англійською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_doc", {
            id: 'name_doc',
            size: loadColumnSizes()?.find(item => item.column === 'name_doc')?.size || 250,
            header: () => 'Виводити як',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("description_uk", {
            id: 'description_uk',
            size: loadColumnSizes()?.find(item => item.column === 'description_uk')?.size || 250,
            header: () => 'Опис українською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("description_en", {
            id: 'description_en',
            size: loadColumnSizes()?.find(item => item.column === 'description_en')?.size || 250,
            header: () => 'Опис англійською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("subjectTypeId", {
            id: 'subjectTypeId',
            size: loadColumnSizes()?.find(item => item.column === 'subjectTypeId')?.size || 100,
            header: () => "Тип суб'єкта",
            footer: info => info.column.id,
            cell: ({row}) => <span>{row?.original?.subjectTypeId?.caption}</span>,
        }),
        columnHelper.accessor("belongCountryId", {
            id: 'belongCountryId',
            size: loadColumnSizes()?.find(item => item.column === 'belongCountryId')?.size || 100,
            header: () => 'Країна',
            footer: info => info.column.id,
            cell: ({row}) => <span>{row?.original?.belongCountryId?.caption}</span>,
        }),
        columnHelper.accessor("comment", {
            id: 'comment',
            size: loadColumnSizes()?.find(item => item.column === 'comment')?.size || 250,
            header: () => 'Коментар',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('updatedAt', {
            header: () => 'Дата актуал.',
            cell: props => props.getValue()
                ? <Tooltip content={props.getValue()}>{convertDate(props.getValue())}</Tooltip>
                : ' ---- ',
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Дії',
            cell: ({row}) => (
                <div className="flex flex-row gap-x-1 p-1 justify-end">
                    {auth?.user?.permissions?.pages?.dictionary?.read && !row?.original?.deletedAt &&
                        <Tooltip content="Деталі">
                            <Button onClick={handleDetails(row?.id)} size="sm" variant="outlined" color="blue">
                                <i className="fa-regular fa-circle-info"/>
                            </Button>
                        </Tooltip>
                    }
                    {auth?.user?.permissions?.pages?.dictionary?.update && !row?.original?.deletedAt &&
                        <Tooltip content="Редагувати">
                            <Button onClick={handleEdit(row?.id)} size="sm" color="yellow">
                                <i className="fa-regular fa-pen-to-square"/>
                            </Button>
                        </Tooltip>
                    }
                    {auth?.user?.permissions?.pages?.dictionary?.delete && !row?.original?.deletedAt &&
                        <Tooltip content="Видалити">
                            <Button onClick={handleDelete(row?.id)} size="sm" color="red">
                                <i className="fa-regular fa-trash"/>
                            </Button>
                        </Tooltip>
                    }
                    {auth?.user?.permissions?.pages?.dictionary?.restore && row?.original?.deletedAt &&
                        <Tooltip content="Відновити">
                            <Button onClick={handleRestore(row?.id)} size="sm" color="green">
                                <i className="fa-regular fa-trash-can-arrow-up"/>
                            </Button>
                        </Tooltip>
                    }
                </div>
            ),
        }),
    ], [auth, identifies?.data, state?.dictionary])

    useEffect(() => {
        const storedFilters = localStorage.getItem(LS_KEY_FILTERS);
        const storedSorting = localStorage.getItem(LS_KEY_SORTING);
        if (storedFilters) setFilters(JSON.parse(storedFilters));
        if (storedSorting) setSorting(JSON.parse(storedSorting));
    }, []);

    useEffect(() => {
        localStorage.setItem(LS_KEY_FILTERS, JSON.stringify(filters));
        localStorage.setItem(LS_KEY_SORTING, JSON.stringify(sorting));
    }, [filters, sorting]);

    const data = useMemo(() => {
        if (identifies && state?.dictionary) {
            const result = transformIdentifyV2Response(identifies?.data, {countries, subjectTypes});
            return {...identifies, data: result};
        } else {
            return [];
        }
    }, [identifies, state?.dictionary]);

    const hasNonEmptyFilter = () => {
        const {name, hideDeleted, comment, group, from, to, subjectTypeId, code, belongCountryId} = filters;
        return (
            belongCountryId?.length > 0 || subjectTypeId?.length > 0 ||
            code?.trim() !== "" || name?.trim() !== "" || comment?.trim() !== "" ||
            Boolean(hideDeleted) || from || to || group?.length > 0
        );
    };

    const handleClearFilters = () => {
        setFilters({
            group: [], subjectTypeId: [], code: '', comment: '', name: '',
            from: undefined, to: undefined, limit: filters.limit,
            belongCountryId: [], hideDeleted: false, page: 0,
        });
    }

    const toggleAdd = () => {
        setIsAddOpen(!isAddOpen);
        if (selectedId) setSelectedId(null);
    }

    const handleAddListener = (event) => {
        if (event.key === "Insert" && addRef.current) {
            setSelectedId(null);
            setIsDetailsOpen(false);
            addRef.current.click();
        }
    }

    useLayoutEffect(() => {
        if (!isAddOpen && !isDetailsOpen) {
            window.addEventListener('keyup', handleAddListener);
        }
        return () => window.removeEventListener("keyup", handleAddListener);
    }, [isAddOpen, isDetailsOpen]);

    const handleChangeDeleted = ({target}) => {
        setFilters(prevState => ({...prevState, [target.name]: target.checked}));
    }

    const handleChangeDate = (range) => {
        if (range?.from || range?.to) {
            setFilters(prevState => ({
                ...prevState,
                from: format(range.from, "yyyy-MM-dd"),
                to: format(range.to, "yyyy-MM-dd"),
            }));
        } else {
            setFilters(prevState => ({...prevState, from: undefined, to: undefined}));
        }
    }

    return (
        <span data-i-doc="tab:dictionary-identify-v2" style={{display: "contents"}}>
            <div className="flex flex-row justify-between items-center">
                <div className="grid grid-cols-8 gap-x-2 mb-5">
                    <SearchInput size="xs" name="code" value={filters.code} label="Код"
                                 onChange={handleChangeFilters}/>
                    <SearchInput size="xs" name="name" value={filters.name} label="Назва"
                                 onChange={handleChangeFilters}/>
                    <SearchInput size="xs" name="comment" value={filters.comment} label="Коментар"
                                 onChange={handleChangeFilters}/>
                    <AdvancedSelect size="xs" isMulti options={GROUPS} label="Група" id="group"
                                    selectedOptions={filters.group}
                                    onChange={handleChangeOptions('group')}/>
                    <AdvancedSelect size="xs" isMulti options={subjectTypes} label="Тип особи"
                                    id="subjectTypeId" selectedOptions={filters.subjectTypeId}
                                    onChange={handleChangeOptions('subjectTypeId')}/>
                    <AdvancedSelect size="xs" isMulti options={countries} label="Країна"
                                    id="belongCountryId" selectedOptions={filters.belongCountryId}
                                    onChange={handleChangeOptions('belongCountryId')}/>
                    <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                     label="Дата актуалізації"/>
                    <div className="flex gap-x-2">
                        {Boolean(auth?.user?.permissions?.pages?.dictionary?.restore) &&
                            <div className="mt-5 self-center max-w-[40px]">
                                <Tooltip content="Приховати видалені">
                                    <Switch size="xs" ripple={false} color="green"
                                            name="hideDeleted" checked={filters.hideDeleted}
                                            onChange={handleChangeDeleted}/>
                                </Tooltip>
                            </div>
                        }
                        <div className="flex items-center mt-4">
                            <Tooltip content="Скинути фільтри">
                                <Button size="sm" className="h-10" disabled={!hasNonEmptyFilter()}
                                        onClick={handleClearFilters}>
                                    <i className="fa-regular fa-filter-slash"/>
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
                {auth?.user?.permissions?.pages?.dictionary?.create &&
                    <Button ref={addRef} size="sm" title="Додати" disabled={isLoading} onClick={toggleAdd}>
                        Додати
                    </Button>
                }
            </div>
            <div className="mt-6 mx-2">
                <Table
                    onRowClick={(row) => {
                        if (auth?.user?.permissions?.pages?.dictionary?.read && !row?.original?.deletedAt) {
                            setSelectedId(row.id);
                            setIsDetailsOpen(true);
                        }
                    }}
                    onDoubleClick={(row) => {
                        if (auth?.user?.permissions?.pages?.dictionary?.update && !row?.original?.deletedAt) {
                            setSelectedId(row.id);
                            setIsAddOpen(true);
                        }
                    }}
                    loading={isFetching}
                    canChangeVisibility
                    canChangeResize
                    textSize="xs"
                    pagination={{
                        onLimitChange: handleLimit,
                        onPageChange: handlePageChange,
                        currentPage: filters?.page,
                        pageSize: data?.limit,
                        totalCount: data?.total,
                    }}
                    data={data?.data}
                    columns={columns}
                    onSort={handleSortModel}
                />
            </div>
            {isDetailsOpen &&
                <IdentifyV2DetailsModal open={isDetailsOpen} dictionary={state?.dictionary}
                                        onClose={onDetailsClose} id={selectedId}/>
            }
            {isAddOpen &&
                <IdentifyV2Modal id={selectedId} open={isAddOpen} onClose={toggleAdd}/>
            }
        </span>
    );
};

export default DictionaryIdentifyV2;
