import React, {Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import Table, {loadColumnSizes} from "../../../components/Table/Table.jsx";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useDictionaryPageProps} from "../useDictionaryPageProps.js";
import {createColumnHelper} from "@tanstack/react-table";
import {useDictionaryContext} from "../DictionaryContext.jsx";
import AdvancedSelect from "../../../components/fields/AdvancedSelect.jsx";
import {Button, Switch, Tooltip} from "@material-tailwind/react";
import {
    deleteIdentifyMutation,
    fetchIdentifiers,
    GROUPS,
    restoreIdentifyMutation,
    transformIdentifyResponse
} from "../utils.js";
import {convertDate} from "../../../lib/utils.js";
import IdentifyDetailsModal from "./IdentifyDetailsModal.jsx";
import toast from "react-hot-toast";
import IdentifyModal from "./IdentifyModal.jsx";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import DateRangePicker from "../../../components/fields/DateRangePicker.jsx";
import {format} from "date-fns";
import CollapsibleSection from "../../../components/CollapsibleSection.jsx";

const columnHelper = createColumnHelper();

const DictionaryIdentify = () => {
    const {state} = useDictionaryContext();
    const {auth, countries = [], subjectTypes = []} = useDictionaryPageProps();
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

    const {data: identifies, isLoading, isFetching} = useQuery({
        queryKey: ['dictionary-identify', filters],
        queryFn: () => fetchIdentifiers({...filters, userId: auth?.user?.id}),
        placeholderData: keepPreviousData,
    })

    const deleteMutation = useMutation({
        mutationFn: deleteIdentifyMutation,
        onSuccess: async () => toast.success('Успішно видалено'),
        onError: async () => toast.error('Помилка видалення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['dictionary-identify', filters]}),
    })


    const restoreMutation = useMutation({
        mutationFn: restoreIdentifyMutation,
        onSuccess: async () => toast.success('Успішно відновлено'),
        onError: async ({response}) => {
            console.log(response);
            toast.error(response?.data?.message || 'Помилка відновлення')
        },
        onSettled: () => queryClient.invalidateQueries({queryKey: ['dictionary-identify', filters]}),
    })

    const [sorting, setSorting] = useState([]);

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

    const handleDetails = (id) => () => {
        setSelectedId(id);
        setIsDetailsOpen(true);
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
        setSelectedId(id);
        setIsAddOpen(true);
    }

    const onDetailsClose = () => {
        setIsDetailsOpen(!isDetailsOpen);
        if (selectedId) {
            setSelectedId(null);
        }
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
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('projectsCount', {
            id: 'projectsCount',
            header: () => 'К-сть. проєктів',
            cell: props => props.getValue(),
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
            cell: ({row}) => (<div className="flex flex-row gap-x-1 p-1 justify-end">
                {
                    auth?.user?.permissions?.pages?.dictionary?.read && !row?.original?.deletedAt &&
                    <Tooltip content="Деталі">
                        <Button onClick={handleDetails(row?.id)} size="sm" variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    auth?.user?.permissions?.pages?.dictionary?.update && !row?.original?.deletedAt &&
                    <Tooltip content="Редагувати">
                        <Button onClick={handleEdit(row?.id)} size="sm" color="yellow" title="Редагувати">
                            <i className="fa-regular fa-pen-to-square"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    auth?.user?.permissions?.pages?.dictionary?.delete && !row?.original?.deletedAt &&
                    <Tooltip content="Видалити">
                        <Button onClick={handleDelete(row?.id)} size="sm" color="red" title="Видалити">
                            <i className="fa-regular fa-trash"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    (auth?.user?.permissions?.pages?.dictionary?.restore && row?.original?.deletedAt) &&
                    <Tooltip content="Відновити">
                        <Button onClick={handleRestore(row?.id)} size="sm" color="green" title="Відновити">
                            <i className="fa-regular fa-trash-can-arrow-up"></i>
                        </Button>
                    </Tooltip>
                }
            </div>),
        }),
    ], [auth, identifies?.data, state?.dictionary])

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


    const data = useMemo(() => {
        if (identifies && state?.dictionary) {
            const result = transformIdentifyResponse(identifies?.data, {countries, subjectTypes});
            return {...identifies, data: result}

        } else {
            return [];
        }
    }, [identifies, state?.dictionary]);

    const hasNonEmptyFilter = () => {
        const {name, hideDeleted, comment, group, from, to, subjectTypeId, code, belongCountryId} = filters;
        return (
            belongCountryId?.length > 0 ||
            subjectTypeId?.length > 0 ||
            code?.trim() !== "" ||
            name?.trim() !== "" ||
            comment?.trim() !== "" ||
            Boolean(hideDeleted) ||
            from ||
            to ||
            group?.length > 0
        );
    };

    const handleClearFilters = () => {
        setFilters({
            group: [],
            subjectTypeId: [],
            code: '',
            comment: '',
            name: '',
            from: undefined,
            to: undefined,
            limit: filters.limit,
            belongCountryId: [],
            hideDeleted: false,
            page: 0,
        })
    }

    const toggleAdd = () => {
        setIsAddOpen(!isAddOpen)
        if (selectedId) {
            setSelectedId(null);
        }
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
        return () => {
            window.removeEventListener("keyup", handleAddListener);
        }
    }, [isAddOpen, isDetailsOpen]);

    const handleChangeDeleted = ({target}) => {
        setFilters(prevState => ({...prevState, [target.name]: target.checked}));
    }

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
        <Fragment>
            <div className="flex mt-2 mr-2 flex-row justify-end gap-x-2">
                {auth?.user?.permissions?.pages?.dictionary?.create &&
                    <Button ref={addRef} size="sm" title="Додати" disabled={isLoading} onClick={toggleAdd}>
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
                        <div className="min-w-0" data-filter-active={filters?.code?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="code" value={filters.code} label="Код"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.name?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="name" value={filters.name} label="Назва"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.comment?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="comment" value={filters.comment} label="Коментар"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.group?.length > 0 ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={GROUPS} label="Група" id="group"
                                            selectedOptions={filters.group}
                                            onChange={handleChangeOptions('group')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.subjectTypeId?.length > 0 ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti
                                            options={subjectTypes}
                                            label="Тип особи"
                                            id="subjectTypeId"
                                            selectedOptions={filters.subjectTypeId}
                                            onChange={handleChangeOptions('subjectTypeId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.belongCountryId?.length > 0 ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={countries} label="Країна"
                                            id="belongCountryId"
                                            selectedOptions={filters.belongCountryId}
                                            onChange={handleChangeOptions('belongCountryId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                            <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                             label="Дата актуалізації"/>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            {Boolean(auth?.user?.permissions?.pages?.dictionary?.restore) &&
                                <Tooltip content="Приховати видалені">
                                    <Switch size="xs" ripple={false}
                                            color="green"
                                            name="hideDeleted" checked={filters.hideDeleted}
                                            onChange={handleChangeDeleted}/>
                                </Tooltip>
                            }
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
                <Table
                    onDoubleClick={(row) => {
                        if (auth?.user?.permissions?.pages?.dictionary?.read && !row?.original?.deletedAt) {
                            setSelectedId(row.id);
                            setIsDetailsOpen(true);
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
            {
                isDetailsOpen &&
                <IdentifyDetailsModal open={isDetailsOpen} dictionary={state?.dictionary} onClose={onDetailsClose}
                                      id={selectedId}/>
            }
            {
                isAddOpen &&
                <IdentifyModal id={selectedId} open={isAddOpen} onClose={toggleAdd}/>
            }
        </Fragment>
    );
};

export default DictionaryIdentify;
