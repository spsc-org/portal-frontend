import {DictionaryProvider} from "../Dictionary/DictionaryContext.jsx";
import Page from "../../Components/Page.jsx";
import {usePage} from "@inertiajs/react";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {serializeParams} from "../../utils.js";
import React, {useEffect, useMemo, useState} from "react";
import {createColumnHelper} from "@tanstack/react-table";
import Table, {loadColumnSizes} from "../../Components/Table/Table.jsx";
import {Button, Tooltip} from "@material-tailwind/react";
import SearchInput from "../../Components/fields/SearchInput.jsx";
import SingleSelect from "../../Components/fields/SingleSelect.jsx";
import {useDialog} from "../../hooks/useDialog.js";
import SubjectDetailsModal from "./SubjectDetailsModal.jsx";


const initialState = {
    limit: 50,
    page: 0,
    subjectType: undefined,
    caption: undefined
}

const columnHelper = createColumnHelper();
const Index = () => {
    const {subjectTypes = [], auth} = usePage().props;
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState(initialState);
    const [sorting, setSorting] = useState([]);

    const {
        open: isDetailsOpen,
        handleOpen: handleDetailsOpen,
        handleClose: handleDetailsClose,
        dialogProps: detailsDialogProps,
    } = useDialog();


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

    const {data: subjects, isLoading} = useQuery({
        queryKey: ['users', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                subjectType: filters?.subjectType?.id,
            }
            const searchParams = serializeParams(params);
            const response = await axios.get(`api/subject`, {
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
    });


    useEffect(() => {
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
        localStorage.setItem(`${location.pathname}-sorting`, JSON.stringify(sorting));
    }, [filters, sorting]);

    const handleDetails = (row) => () => {
        handleDetailsOpen({selectedId: row?.original?.id})
    }

    const columns = useMemo(() => [
        columnHelper.accessor("typeId", {
            id: 'typeId',
            size: loadColumnSizes()?.find(item => item.column === 'typeId')?.size || 150,
            header: () => "Тип суб'єкта",
            cell: info => {
                if (info.getValue()) {
                    const issuer = subjectTypes.find(i => i.id === info.getValue());
                    return (<span>{issuer?.caption} </span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("caption", {
            id: 'caption',
            size: loadColumnSizes()?.find(item => item.column === 'caption')?.size || 150,
            header: () => "Caption",
            footer: info => info.column.id,
        }),
        columnHelper.accessor("summaryData", {
            id: 'summaryData',
            size: loadColumnSizes()?.find(item => item.column === 'summaryData')?.size || 150,
            header: () => "Ідентифікаційні дані",
            enableSorting: false,
            cell: info => {
                const data = info.getValue();
                if (data && data instanceof Object) {
                    return Object.entries(data).map(([key, value], index) => {
                        return (
                            <div key={index} className="space-x-1">
                                <span
                                    className="font-semibold dark:text-gray-300 dark:bg-blue-800 bg-blue-300">{key}:</span>
                                <span>{Array.isArray(value) ? value.join("; ") : value}</span>
                            </div>
                        )
                    })
                }
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("relProjectsCount", {
            id: 'relProjectsCount',
            size: loadColumnSizes()?.find(item => item.column === 'relProjectsCount')?.size || 150,
            header: () => "К-сть проєктів",
            cell: info => info.getValue() || 0,
            footer: info => info.column.id,
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 100,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({row}) => (
                <div className="flex flex-row gap-x-2 p-2 justify-end">
                    <Tooltip content="Детальна інформація">
                        <Button onClick={handleDetails(row)} size="sm"
                                variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    </Tooltip>
                </div>),
        }),
    ])

    const handleChangeOptions = (key = '') => (option) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: option}));
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


    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:subject" className="flex mt-2 mr-2 flex-row justify-end gap-x-2">
                    {/*{auth?.user?.permissions?.pages?.subject?.create &&*/}
                    {/*    <Button ref={addRef} title="Додати" onClick={handleAdd}>*/}
                    {/*        Додати*/}
                    {/*    </Button>*/}
                    {/*}*/}
                </div>

                <div className="mt-2 mx-2">
                    <div className="flex flex-row justify-between items-center">
                        <div className="grid grid-cols-3 gap-x-5 gap-y-2 mb-20">
                            <SearchInput size="sm" name="caption" value={filters.caption}
                                         label="Глобальний пошук"
                                         onChange={handleChangeFilters}
                            />
                            <SingleSelect closeMenuOnSelect options={subjectTypes} label="Стан" id="subjectType"
                                          value={filters.subjectType}
                                          onChange={handleChangeOptions('subjectType')}/>
                            <div className="flex mt-4">
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
                            pageSize: subjects?.limit,
                            totalCount: subjects?.total,
                        }}
                        data={subjects?.data}
                        columns={columns}
                        onSort={handleSortModel}
                    />
                </div>
                {
                    isDetailsOpen &&
                    <SubjectDetailsModal open={isDetailsOpen} {...detailsDialogProps} onClose={handleDetailsClose}/>
                }
            </Page>
        </DictionaryProvider>
    );
};

export default Index;
