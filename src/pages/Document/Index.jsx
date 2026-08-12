import {createColumnHelper} from "@tanstack/react-table";
import {usePage} from "@inertiajs/react";
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {convertDate, serializeParams} from "../../utils.js";
import {showDocuments} from "./util.js";
import Table, {loadColumnSizes} from "../../Components/Table/Table.jsx";
import {Badge, Button, Tooltip} from "@material-tailwind/react";
import {DictionaryProvider} from "../Dictionary/DictionaryContext.jsx";
import Page from "../../Components/Page.jsx";
import AdvancedSelect from "../../Components/fields/AdvancedSelect.jsx";
import SearchInput from "../../Components/fields/SearchInput.jsx";
import DateRangePicker from "../../Components/fields/DateRangePicker.jsx";
import DocumentModal from "./DocumentModal.jsx";
import CreateDocumentModal from "../ProjectImport/CreateDocumentModal.jsx";
import UpdateDocumentModal from "./UpdateDocumentModal.jsx";
import CollapsibleSection from "../../Components/CollapsibleSection.jsx";
import {format} from "date-fns";


const initialState = {
    limit: 50,
    page: 0,
    caption: '',
    regNum: '',
    listItem: '',
    typeId: [],
    unitId: [],
    performerId: [],
    path: '',
    start_date: '',
    end_date: '',
    from: undefined,
    to: undefined,
}
const columnHelper = createColumnHelper();

const Index = () => {
    const {auth, types, units, users} = usePage().props;
    const addRef = useRef(null);
    const [filters, setFilters] = useState(initialState);
    const [sorting, setSorting] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);

    const clearSelected = () => setSelectedId(null);

    const {data, isFetching} = useQuery({
        queryKey: ['documents', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                typeId: filters.typeId.map(i => i.value),
                unitId: filters.unitId.map(i => i.value),
                performerId: filters.performerId.map(i => i.value),
            };
            const searchParams = serializeParams(params);
            const response = await axios.get("api/document", {
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

    const documents = useMemo(() => {
        if (data) {
            return {...data, data: showDocuments(data.data, {types, units, users})}
        }
    }, [data, types, units, users]);

    const handleChangeFilters = ({target: {name, value}}) => {
        setFilters({...filters, [name]: value});
    }

    const handleLimit = (value) => {
        setFilters(prevState => ({...prevState, page: 0, limit: value}));
    }
    const handlePageChange = (pageNumber) => {
        setFilters(prevState => ({...prevState, page: pageNumber - 1}));
    }
    const hasNonEmptyFilter = () => {
        const {path, caption, typeId, unitId, from, to, regNum, listItem} = filters;
        return (
            caption?.trim() !== "" ||
            regNum?.trim() !== "" ||
            listItem?.trim() !== "" ||
            path?.trim() !== "" ||

            typeId.length ||
            unitId.length ||
            from ||
            to
        );
    };
    const handleClearFilters = () => {
        setFilters({...initialState, limit: filters.limit})
    }

    const handleChangeOptions = (key = '') => (newSelectedIds) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: newSelectedIds}));
    };

    const handleSortModel = useCallback((model) => {
        setSorting(model);
        const sortModel = typeof model === 'function' ? model(sorting) : model;
        if (sortModel.length > 0) {
            setFilters(prevState => ({
                ...prevState,
                sort: sortModel[0].id,
                direction: Boolean(sortModel[0].desc) ? "desc" : "asc"
            }));
        }
    }, [sorting]);


    const getColor = (id) => {
        switch (id) {
            case 1:
            case 2:
                return "bg-blue-500/10 border-blue-500 border 1 text-blue-500";
            case 3:
                return "bg-red-500 text-white";
            case 4:
                return "bg-yellow-500 text-white";
            case 5:
                return "bg-green-500 text-white";
            case 7:
                return "bg-green-500 text-white";
            default:
                return "bg-gray-950 dark:bg-gray-950 text-white"
        }
    }

    const handleDetails = (id) => () => {
        setIsDetailsOpen(!isDetailsOpen);
        setSelectedId(id);
    };

    const handleDelete = (id) => () => {
        // console.log(id);
    }


    const columns = useMemo(() => [
        columnHelper.accessor("typeId", {
            id: 'typeId',
            size: loadColumnSizes()?.find(item => item.column === 'typeId')?.size || 220,
            header: () => 'Тип',
            footer: info => info.column.id,
            cell: ({row}) => {
                return <div className="inline-flex gap-x-2 items-center p-2">
                    <div
                        className={`relative h-[20px] w-[20px] align-middle ${getColor(row.original.typeId?.id)} rounded-[50%]`}>
                                            <span
                                                className="absolute text-xs leading-none  left-1/2 top-1/2 -translate-x-1/2 p-0 -translate-y-1/2 transform ">
                                                 <i className={row.original.typeId?.icon}></i>
                                            </span>
                    </div>
                    <span>{row.original.typeId?.caption}</span>
                </div>
            },
        }),
        columnHelper.accessor("unitId", {
            id: 'unitId',
            size: loadColumnSizes()?.find(item => item.column === 'unitId')?.size || 100,
            header: () => 'Підрозділ',
            footer: info => info.column.id,
        }),
        columnHelper.accessor("caption", {
            id: 'caption',
            size: loadColumnSizes()?.find(item => item.column === 'caption')?.size || 250,
            header: () => 'Назва',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("regNum", {
            id: 'regNum',
            size: loadColumnSizes()?.find(item => item.column === 'regNum')?.size || 200,
            header: () => 'Реєстраційний номер',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("regDate", {
            id: 'regDate',
            size: loadColumnSizes()?.find(item => item.column === 'regDate')?.size || 100,
            header: () => 'Дата реєстрації',
            footer: info => info.column.id,
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
        }),
        columnHelper.accessor("listItem", {
            id: 'listItem',
            size: loadColumnSizes()?.find(item => item.column === 'listItem')?.size || 100,
            header: () => 'Пункт переліку',
            footer: info => info.column.id,
            cell: info => info.getValue() || ' ---- ',
        }),
        columnHelper.accessor("path", {
            id: 'path',
            size: loadColumnSizes()?.find(item => item.column === 'path')?.size || 200,
            header: () => 'Шлях',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("comments", {
            id: 'comments',
            size: loadColumnSizes()?.find(item => item.column === 'comments')?.size || 150,
            header: () => 'Коментар',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('performerId', {
            id: "performerId",
            header: () => 'Виконавець',
            cell: props => props.getValue(),
            size: loadColumnSizes()?.find(item => item.column === 'createdUserId')?.size || 200,
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
        columnHelper.accessor("createdUserId", {
            id: 'createdUserId',
            size: loadColumnSizes()?.find(item => item.column === 'createdUserId')?.size || 250,
            header: () => 'Створив',
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
        columnHelper.accessor("updatedUserId", {
            id: 'updatedUserId',
            size: loadColumnSizes()?.find(item => item.column === 'updatedUserId')?.size || 250,
            header: () => 'Змінив',
            cell: props => props.getValue(),
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
            cell: ({row}) => (<div className="flex flex-row gap-x-2 p-2 justify-end">
                <Badge content={row?.original?.documentCount || 0} color="blue">
                    <Tooltip content="Детальна інформація">
                        <Button onClick={handleDetails(row?.id)} size="sm"
                                variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    </Tooltip>
                </Badge>
                {
                    Boolean(auth.user.permissions.pages.document.update)
                    && Boolean(auth.user.permissions.pages.document.create)
                    && Boolean(row.original.typeId.id === 1)
                    && !Boolean(row?.original?.deleted_at) &&
                    <Tooltip content="Додати проєкти">
                        <a ref={addRef} href={`/project/upload/v2?documentId=${row?.id}`} target="_blank">
                            <Button size="sm">
                                <i className="fa-regular fa-plus"></i>
                            </Button>
                        </a>
                    </Tooltip>
                }
                {
                    Boolean(auth.user.permissions.pages.document.update)
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
                    Boolean(auth.user.permissions.pages.document.delete)
                    && Boolean(row?.original?.deleted_at)
                    && <Tooltip content="Видалити">
                        <Button onClick={handleDelete(row?.id)} size="sm"
                                color="yellow">
                            <i className="fa-regular fa-trash"></i>
                        </Button>
                    </Tooltip>
                }
            </div>),
        }),

    ], [auth, documents])

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


    const handleChangeDate = (range) => {
        if (range?.from || range?.to) {
            const from = format(range.from, "yyyy-MM-dd") || "";
            const to = format(range.to, "yyyy-MM-dd") || "";
            setFilters(prevState => ({...prevState, from: from, to: to}))
        } else {
            setFilters(prevState => ({...prevState, from: initialState.from, to: initialState.to}))
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

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:document" className="flex mt-2 mr-2 flex-row justify-end gap-x-2">
                    {auth?.user?.permissions?.pages?.document?.create &&
                        <Button ref={addRef} size="sm" title="Додати" onClick={handleAdd}>
                            Додати
                        </Button>
                    }
                </div>
                <div className="mt-5 mx-2">
                    <CollapsibleSection
                        title="Фільтри"
                        showHiddenAppliedBadge
                        className="mb-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-md dark:border-gray-700 dark:bg-gray-900/60 sm:p-4"
                    >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                            <div className="min-w-0" data-filter-active={filters?.typeId?.length ? "true" : "false"}>
                                <AdvancedSelect size="xs" isMulti options={types} label="Тип" id="typeId"
                                                selectedOptions={filters.typeId}
                                                onChange={handleChangeOptions('typeId')}/>
                            </div>
                            <div className="min-w-0" data-filter-active={filters?.unitId?.length ? "true" : "false"}>
                                <AdvancedSelect size="xs" isMulti options={units} label="Підрозділ" id="unitId"
                                                selectedOptions={filters.unitId}
                                                onChange={handleChangeOptions('unitId')}/>
                            </div>
                            <div className="min-w-0"
                                 data-filter-active={filters?.performerId?.length ? "true" : "false"}>
                                <AdvancedSelect size="xs" isMulti options={users} label="Виконавець" id="performerId"
                                                selectedOptions={filters.performerId}
                                                onChange={handleChangeOptions('performerId')}/>
                            </div>
                            <div className="min-w-0" data-filter-active={filters?.caption?.trim() ? "true" : "false"}>
                                <SearchInput size="xs" name="caption" value={filters.caption} label="Назва"
                                             onChange={handleChangeFilters}/>
                            </div>
                            <div className="min-w-0" data-filter-active={filters?.regNum?.trim() ? "true" : "false"}>
                                <SearchInput size="xs" name="regNum" value={filters.regNum} label="Реєстраційний номер"
                                             onChange={handleChangeFilters}/>
                            </div>
                            <div className="min-w-0" data-filter-active={filters?.listItem?.trim() ? "true" : "false"}>
                                <SearchInput size="xs" name="listItem" value={filters.listItem} label="Пункт переліку"
                                             onChange={handleChangeFilters}/>
                            </div>
                            <div className="min-w-0"
                                 data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                                <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from}
                                                 to={filters.to}
                                                 label="Дата реєстрації"/>
                            </div>
                            <div
                                className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                                <Tooltip content="Скинути фільтри">
                                    <Button
                                        className="h-9 px-3"
                                        size="sm"
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
                        onDoubleClick={(row) => setSelectedId(row?.id)}
                        loading={isFetching}
                        canChangeVisibility
                        canChangeResize
                        textSize="xs"
                        pagination={{
                            onLimitChange: handleLimit,
                            onPageChange: handlePageChange,
                            currentPage: filters?.page,
                            pageSize: documents?.limit,
                            totalCount: documents?.total,
                        }} data={documents?.data} columns={columns} onSort={handleSortModel}
                    />
                </div>
                {
                    selectedId && isDetailsOpen &&
                    <DocumentModal open={isDetailsOpen} selectedId={selectedId} onClose={() => {
                        clearSelected();
                        setIsDetailsOpen(false);
                    }}/>
                }
                {
                    openCreate &&
                    <CreateDocumentModal open={openCreate} onClose={() => setOpenCreate(!openCreate)}/>
                }
                {
                    isEditOpen && selectedId &&
                    <UpdateDocumentModal open={isEditOpen} selectedId={selectedId} onClose={() => {
                        clearSelected();
                        setIsEditOpen(false);
                    }}/>
                }

            </Page>
        </DictionaryProvider>
    );
};

export default Index;
