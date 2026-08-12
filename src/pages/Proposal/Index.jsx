import {createColumnHelper} from "@tanstack/react-table";
import {Link, usePage} from "@inertiajs/react";
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {serializeParams} from "../../utils.js";
import {Button, Popover, PopoverContent, PopoverHandler, Switch, Tooltip} from "@material-tailwind/react";
import {format} from "date-fns";
import Table, {loadColumnSizes} from "../../Components/Table/Table.jsx";
import {DictionaryProvider} from "../Dictionary/DictionaryContext.jsx";
import Page from "../../Components/Page.jsx";
import SearchInput from "../../Components/fields/SearchInput.jsx";
import CreateProposalModal from "./CreateProposalModal.jsx";
import UpdateProposalModal from "./UpdateProposalModal.jsx";
import ProposalDetailsModal from "./ProposalDetailsModal.jsx";
import toast from "react-hot-toast";
import AdvancedSelect from "../../Components/fields/AdvancedSelect.jsx";
import SingleSelect from "../../Components/fields/SingleSelect.jsx";
import DateRangePicker from "../../Components/fields/DateRangePicker.jsx";
import {useDialog} from "../../hooks/useDialog.js";
import CollapsibleSection from "../../Components/CollapsibleSection.jsx";


const columnHelper = createColumnHelper();
const PROPOSAL_STATE = [
    {
        value: undefined, label: "Всі"
    },
    {
        value: "1", label: "Зафіксовані"
    },
    {
        value: "0", label: "Незафіксовані"
    }
]
const initialState = {
    text: '',
    decreeId: [],
    stateId: [],
    issuerId: [],
    createdUserId: [],
    hideDeleted: false,
    hideNonHistorical: undefined,
    outgoingNumber: '',
    page: 0,
    limit: 50,
};

const normalizeMultiSelectOptions = (items = [], source = []) => {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) => {
            if (!item) return null;

            if (item?.value !== undefined && item?.value !== null) {
                return item;
            }

            const label = item?.label || item?.caption || item?.name;
            if (!label) return null;

            const matched = source.find((option) =>
                [option?.caption, option?.name].includes(label)
            );

            if (matched?.id !== undefined && matched?.id !== null) {
                return {label, value: matched.id};
            }

            return null;
        })
        .filter(Boolean);
};

const normalizeStoredFilters = (stored, {users = [], issuers = [], proposalState = [], decrees = []} = {}) => {
    if (!stored || typeof stored !== "object") return null;

    return {
        ...initialState,
        ...stored,
        decreeId: normalizeMultiSelectOptions(stored?.decreeId, decrees),
        stateId: normalizeMultiSelectOptions(stored?.stateId, proposalState),
        issuerId: normalizeMultiSelectOptions(stored?.issuerId, issuers),
        createdUserId: normalizeMultiSelectOptions(stored?.createdUserId, users),
    };
};

const Index = () => {
    const {auth, users = [], issuers = [], proposalState = [], decrees = []} = usePage().props;
    const addRef = useRef(null);
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState(initialState);

    const [openCreate, setOpenCreate] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [selectedId, setSelectedId] = useState(null);
    const [sorting, setSorting] = useState([]);
    const [isFiltersHydrated, setIsFiltersHydrated] = useState(false);

    const {
        open: editOpen,
        handleOpen: handleEditOpen,
        handleClose: handleEditClose,
        dialogProps: editDialogProps
    } = useDialog();

    const {data, isFetching} = useQuery({
        queryKey: ['proposal', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                stateId: filters?.stateId?.map(f => f.value),
                issuerId: filters?.issuerId?.map(f => f.value),
                createdUserId: filters?.createdUserId?.map(f => f.value),
                decreeId: filters?.decreeId?.map(f => f.value),
                hideNonHistorical: Boolean(filters?.hideNonHistorical?.value) ? parseInt(filters?.hideNonHistorical?.value) : undefined
            }
            const searchParams = serializeParams(params);
            const response = await axios.get("/api/proposal/new/list", {
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
            return await axios.delete(`/api/proposal/new/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            });
        },
        onSuccess: async () => toast.success('Успішно видалено'),
        onError: async () => toast.error('Помилка видалення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['proposal']}),
    })

    const restoreMutation = useMutation({
        mutationFn: async (id) => {
            return await axios.patch(`/api/proposal/new/${id}/restore`, null, {
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            })
        },
        onSuccess: async () => toast.success('Успішно відновлено'),
        onError: async () => toast.error('Помилка відновлення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['proposal']}),
    })

    const handleAdd = () => {
        if (isFetching) return;
        setOpenCreate(true);
    }
    const clearSelected = () => setSelectedId(null);

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

    const handleChangeOptions = (key = '') => (newSelectedIds) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: newSelectedIds || []}));
    };

    useEffect(() => {
        const storedFilters = localStorage.getItem(`${location.pathname}-filters`);
        const storedSorting = localStorage.getItem(`${location.pathname}-sorting`);

        if (storedFilters) {
            try {
                const parsed = JSON.parse(storedFilters);
                const normalized = normalizeStoredFilters(parsed, {users, issuers, proposalState, decrees});
                if (normalized) {
                    setFilters(prevState => ({
                        ...prevState, ...normalized,
                        limit: normalized?.limit || prevState.limit
                    }));
                }
            } catch (error) {
                console.error('Failed to parse stored proposal filters:', error);
            }
        }

        if (storedSorting) {
            try {
                setSorting(JSON.parse(storedSorting));
            } catch (error) {
                console.error('Failed to parse stored proposal sorting:', error);
            }
        }

        setIsFiltersHydrated(true);
    }, []);

    useEffect(() => {
        if (!isFiltersHydrated) return;
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
        localStorage.setItem(`${location.pathname}-sorting`, JSON.stringify(sorting));
    }, [filters, sorting, isFiltersHydrated]);

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

    const handleRestore = (id) => () => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900 ">
                        Відновити подання?
                    </p>
                    <div className="flex flex-row gap-x-1 ">
                        <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>
                            Скасувати
                        </Button>
                        <Button size="sm" color="green" onClick={() => {
                            toast.dismiss(t.id)
                            restoreMutation.mutate(id)
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


    useLayoutEffect(() => {
        if (!isEditOpen && !isDetailsOpen) {
            window.addEventListener('keyup', handleAddListener);
        }
        return () => {
            window.removeEventListener("keyup", handleAddListener);
        }
    }, [isEditOpen, isDetailsOpen]);

    const handleDelete = (id) => () => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center gap-x-1 flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900">
                        Ви хочете видалити пакет. #{id}
                        Видалення пакету не видаляє пропозицій, що входять до нього. Дійсно видалити пакет?
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

    const showRestoreBtn = (row) => {
        if (!row) return false;
        const restore = auth?.user?.permissions?.pages?.proposal?.restore;
        if (restore === true && Boolean(row?.original?.deletedAt)) {
            return true;
        }
        return restore === "individual" && Boolean(row?.original?.deletedAt) && auth?.user?.id === row?.original?.createdUserId;
    }

    const columns = useMemo(() => [
        columnHelper.accessor("id", {
            id: 'id',
            size: 60,
            header: () => 'ID',
            cell: info => {
                return (<div className="space-x-5">
                    <span>{info.getValue()}</span>
                    <span className="text-lg">

                    {
                        Boolean(info.row?.original?.isHistorical) &&
                        <Tooltip content="Зафіксований">
                            <i className=" text-blue-600 fa-solid fa-lock"></i>
                        </Tooltip>
                    }
                  </span>

                </div>)
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("issuerId", {
            id: 'issuerId',
            size: loadColumnSizes()?.find(item => item.column === 'issuerId')?.size || 150,
            header: () => "Суб'єкт подання",
            cell: info => {
                if (info.getValue()) {
                    const issuer = issuers.find(i => i.id === info.getValue());
                    return (<span>{issuer?.caption} </span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("stateId", {
            id: 'stateId',
            size: loadColumnSizes()?.find(item => item.column === 'stateId')?.size || 100,
            header: () => 'Стан',
            cell: info => {
                if (info.getValue()) {
                    const state = proposalState.find(i => i.id === info.getValue());
                    return (<span> <i className={state?.icon}></i> {state?.caption}</span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("caption", {
            id: 'caption',
            size: loadColumnSizes()?.find(item => item.column === 'caption')?.size || 100,
            header: () => 'Назва',
            cell: info => <HighlightedText
                text={info.getValue()}
                filter={filters?.text || ''}
            />,
            footer: info => info.column.id,
        }),
        columnHelper.accessor("description", {
            id: 'description',
            size: loadColumnSizes()?.find(item => item.column === 'description')?.size || 100,
            header: () => 'Опис',
            cell: info => {
                const rawValue = info.getValue();
                const isLongText = typeof rawValue === "string" && rawValue.length > 80;
                const displayText = isLongText ? `${rawValue.slice(0, 80)}...` : rawValue;
                return isLongText ?
                    <Popover>
                        <PopoverHandler>
                            <span
                                className="inline-flex w-full cursor-pointer max-w-[150px] hover:underline">{displayText}</span>
                        </PopoverHandler>
                        <PopoverContent
                            className="bg-white dark:bg-gray-800 shadow-md max-w-lg max-h-80 overflow-auto font-normal text-xs text-slate-600 dark:text-slate-200">
                            {rawValue}
                        </PopoverContent>
                    </Popover> : <span>{info.getValue()}</span>

            },
            enableSorting: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor("calcSummary", {
            id: 'calcSummary',
            size: loadColumnSizes()?.find(item => item.column === 'calcSummary')?.size || 250,
            header: () => 'Summary',
            cell: info => {
                return <span dangerouslySetInnerHTML={{__html: info.getValue()}}/>
            },
            enableSorting: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor("decreeIds", {
            id: 'decreeIds',
            size: loadColumnSizes()?.find(item => item.column === 'decreeIds')?.size || 250,
            header: () => 'Указ',
            cell: info => {
                return (info.getValue() || []).map((item, key) => {
                    const decree = decrees.find(i => i.id === item);
                    return <p key={key} className="m-0.5 p-0.5 text-xs rounded-md ">{decree?.name}</p>
                })
            },
            enableSorting: false,
            footer: info => info.column.id,
        }),

        columnHelper.accessor('outgoingDate', {
            id: "outgoingDate",
            header: () => 'Дата реєстрації',
            cell: props => props.getValue() ?
                <span> {format(props.getValue(), "dd.MM.yyyy")}</span>
                : ' ---- ',
            size: 100,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('outgoingNumber', {
            id: "outgoingNumber",
            header: () => 'Реєстраційний номер',
            size: 100,
            cell: info => (<HighlightedText
                text={info.getValue()}
                filter={filters?.text || ''}
            />),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('comments', {
            id: "comments",
            header: () => 'Коментар',
            size: 100,
            enableResizing: false,
            cell: info => {
                const rawValue = info.getValue();
                const isLongText = typeof rawValue === "string" && rawValue.length > 80;
                const displayText = isLongText ? `${rawValue.slice(0, 80)}...` : rawValue;
                return isLongText ?
                    <Popover>
                        <PopoverHandler>
                            <span
                                className="inline-flex w-full cursor-pointer max-w-[150px] hover:underline">{displayText}</span>
                        </PopoverHandler>
                        <PopoverContent
                            className="bg-white dark:bg-gray-800 shadow-md max-w-lg max-h-80 overflow-auto font-normal text-xs text-slate-600 dark:text-slate-200">
                            {rawValue}
                        </PopoverContent>
                    </Popover> : <span>{info.getValue()}</span>

            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor('createdUserId', {
            id: "createdUserId",
            header: () => 'Створив',
            size: 100,
            cell: info => {
                if (info.getValue()) {
                    const user = users.find(i => i.id === info.getValue());
                    return (<span>{user?.name}</span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 80,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({row}) => (
                <div className="flex flex-row gap-x-2 p-2 justify-end">
                    {
                        Boolean(row?.original?.deletedAt) &&
                        <Button onClick={handleDetails(row?.id)} size="sm"
                                variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    }
                    {
                        !Boolean(row?.original?.deletedAt) &&
                        <Tooltip content="Детальна інформація та наповнення">
                            <Link href={`/proposal/${row.id}`}>
                                <Button size="sm"
                                        variant="filled" color="blue">
                                    <i className="fa-regular fa-list"></i>
                                </Button>
                            </Link>
                        </Tooltip>
                    }
                    {
                        Boolean(auth?.user?.permissions?.pages?.proposal?.delete)
                        && !Boolean(row?.original?.isHistorical)
                        && !Boolean(row?.original?.deletedAt)
                        && <Tooltip content="Видалити">
                            <Button
                                onClick={handleDelete(row?.id)}
                                size="sm"
                                color="red">
                                <i className="fa-regular fa-trash"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        showRestoreBtn(row) ? <Tooltip content="Відновити">
                                <Button onClick={handleRestore(row?.id)} size="sm" color="green" title="Відновити">
                                    <i className="fa-regular fa-trash-can-arrow-up"></i>
                                </Button>
                            </Tooltip>
                            : null
                    }

                </div>),
        }),

    ], [auth, data])

    const toggleFilterSwitch = ({target}) => {
        setFilters(prevState => ({...prevState, [target.name]: target.checked}));
    }

    const handleChangeDate = (range) => {
        if (range?.from || range?.to) {
            const from = format(range.from, "yyyy-MM-dd") || "";
            const to = format(range.to, "yyyy-MM-dd") || "";
            setFilters(prevState => ({...prevState, from: from, to: to}))
        } else {
            setFilters(prevState => ({...prevState, from: initialState.from, to: initialState.to}))
        }
    }


    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:proposal" className="flex mt-2 mr-2 flex-row justify-end gap-x-2">
                    {auth?.user?.permissions?.pages?.proposal?.create &&
                        <Button ref={addRef} title="Додати" onClick={handleAdd}>
                            Додати
                        </Button>
                    }
                </div>

                <CollapsibleSection
                    title="Фільтри"
                    showHiddenAppliedBadge
                    className="mt-2 mb-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-md dark:border-gray-700 dark:bg-gray-900/60 sm:p-4"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="min-w-0" data-filter-active={filters?.text?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="text" value={filters.text} label="Фільтр за текстом"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0"
                             data-filter-active={filters?.outgoingNumber?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="outgoingNumber" value={filters.outgoingNumber}
                                         label="Реєстраційний номер"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.issuerId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={issuers} label="Суб'єкт подання" id="issuerId"
                                            selectedOptions={filters.issuerId}
                                            onChange={handleChangeOptions('issuerId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.decreeId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={decrees} label="Указ" id="decreeId"
                                            selectedOptions={filters.decreeId}
                                            onChange={handleChangeOptions('decreeId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.stateId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={proposalState} label="Стан" id="stateId"
                                            selectedOptions={filters.stateId}
                                            onChange={handleChangeOptions('stateId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.createdUserId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={users} label="Створив"
                                            id="createdUserId"
                                            selectedOptions={filters.createdUserId}
                                            onChange={handleChangeOptions('createdUserId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                            <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                             label="Дата"/>
                        </div>
                        <div className="min-w-0"
                             data-filter-active={filters?.hideNonHistorical?.value !== undefined ? "true" : "false"}>
                            <SingleSelect size="xs" closeMenuOnSelect options={PROPOSAL_STATE}
                                          label="Зафіксовані"
                                          id="hideNonHistorical"
                                          value={filters.hideNonHistorical}
                                          onChange={handleChangeOptions('hideNonHistorical')}/>
                        </div>

                        <div
                            className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            <Tooltip content="Приховати видалені">
                                <label
                                    htmlFor="hideDeleted"
                                    data-filter-active={filters.hideDeleted ? "true" : "false"}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200"
                                >
                                    <Switch
                                        id="hideDeleted"
                                        ripple={false}
                                        color="green"
                                        name="hideDeleted"
                                        checked={filters.hideDeleted}
                                        onChange={toggleFilterSwitch}
                                    />
                                    <span>Приховати видалені</span>
                                </label>
                            </Tooltip>

                            <Tooltip content="Скинути фільтри">
                                <Button
                                    size="sm"
                                    className="h-9 px-3"
                                    onClick={handleClearFilters}
                                >
                                    <i className="fa-regular fa-filter-slash mr-1"></i>
                                    Скинути
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </CollapsibleSection>
                <Table
                    onDoubleClick={(row) => setSelectedId(row?.id)}
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
                    }} data={data?.data} columns={columns} onSort={handleSortModel}
                />
                {
                    selectedId && isDetailsOpen &&
                    <ProposalDetailsModal open={isDetailsOpen} selectedId={selectedId} onClose={() => {
                        clearSelected();
                        setIsDetailsOpen(false);
                    }}/>
                }
                {
                    editOpen && <UpdateProposalModal open={editOpen} {...editDialogProps} onClose={handleEditClose}/>
                }
                {
                    openCreate && <CreateProposalModal open={openCreate} onClose={() => setOpenCreate(!openCreate)}/>
                }

            </Page>
        </DictionaryProvider>
    );
};

export default Index;

const HighlightedText = ({text, filter}) => {
    if (!filter || !text) {
        return text;
    }

    const parts = text.split(new RegExp(`(${filter})`, 'gi'));

    return (
        <span>
      {parts.map((part, index) =>
          part.toLowerCase() === filter.toLowerCase() ? (
              <span key={index} className="bg-yellow-200">{part}</span>
          ) : (
              <span key={index}>{part}</span>
          )
      )}
    </span>
    );
};
