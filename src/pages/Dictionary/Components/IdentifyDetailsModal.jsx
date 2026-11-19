import {http as axios} from "../../../lib/api.js";
import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Spinner,
    Tab,
    TabPanel,
    Tabs,
    TabsBody,
    TabsHeader,
    Tooltip
} from "@material-tailwind/react";
import React, {useMemo, useState} from "react";
import {useDictionaryPageProps} from "../useDictionaryPageProps.js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useDictionaryContext} from "../DictionaryContext.jsx";
import Table from "../../../components/Table/Table.jsx";
import {createColumnHelper} from "@tanstack/react-table";
import toast from "react-hot-toast";
import {rollbackVersion} from "../utils.js";

const columnHelper = createColumnHelper();

const IdentifyDetailsModal = ({open, id, onClose, dictionary}) => {
    const {auth, countries = [], subjectTypes = []} = useDictionaryPageProps();

    const [tab, setTab] = useState("info")
    const {state} = useDictionaryContext();
    const queryClient = useQueryClient();

    const {data, isFetching} = useQuery({
        queryKey: ['identify-details', id],
        queryFn: async () => {
            const response = await axios.get(`api/dictionary/identifier/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response?.data;
        },
        enabled: !!id,
    })

    const [filters, setFilters] = useState({
        limit: 10,
        page: 0,
    });


    const {data: identifyVersions, isFetching: versionsIsLoading} = useQuery({
        queryKey: ['identify-versions', id, filters],
        queryFn: async () => {
            const response = await axios.get(`api/dictionary/identifier/${id}/versions?page=${filters.page}&limit=${filters.limit}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response?.data;
        },
        enabled: !!id,
    })

    const rollbackMutation = useMutation({
        mutationFn: rollbackVersion,
        onSuccess: async () => toast.success('Успішно відновлено'),
        onError: async () => toast.error('Помилка відновлення'),
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ['dictionary-identify']});
            queryClient.invalidateQueries({queryKey: ['identify-details', id]});
            queryClient.invalidateQueries({queryKey: ['identify-versions', id, filters]});

        },
    })

    const handleEdit = (versionId) => () => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900 ">
                        Відновити версію?
                    </p>
                    <div className="flex flex-row gap-x-1 ">
                        <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>
                            Скасувати
                        </Button>
                        <Button size="sm" color="green" onClick={() => {
                            toast.dismiss(t.id)
                            rollbackMutation.mutate({versionId, identifierId: id, userId: auth?.user?.id})
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

    const details = useMemo(() => {
        if (data?.data) {
            return {
                id: data?.data?.id,
                updatedAt: data?.data?.updatedAt,
                code: data?.data?.current_version?.code,
                description_en: data?.data?.current_version?.description_en,
                description_uk: data?.data?.current_version?.description_uk,
                group: data?.data?.current_version?.group,
                name_en: data?.data?.current_version?.name_en,
                name_uk: data?.data?.current_version?.name_uk,
                name_doc: data?.data?.current_version?.name_doc,
                comment: data?.data?.current_version?.comment,
                pattern: data?.data?.current_version?.pattern,
                updatedUserId: dictionary?.user?.find(c => c.id === data?.data?.current_version?.updatedUserId),
                version: data?.data?.current_version?.version,
                belongCountry: countries?.find(c => c.id === data?.data?.current_version?.belongCountryId),
                subjectType: subjectTypes?.find(item => item.id === data?.data?.current_version?.subjectTypeId),
            }
        }
    }, [data?.data, id])

    const columns = useMemo(() => [
        columnHelper.accessor("version", {
            id: 'version',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Версія',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("code", {
            id: 'code',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Код',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("group", {
            id: 'group',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Група',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("pattern", {
            id: 'pattern',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Паттерн',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_uk", {
            id: 'name_uk',
            size: 250,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Назва',
            footer: info => info.column.id,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("name_en", {
            id: 'name_en',
            size: 250,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Назва англ',
            footer: info => info.column.id,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("name_doc", {
            id: 'name_doc',
            size: 250,
            header: () => 'Виводити як',
            enableSorting: false,
            enableResizing: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("description_uk", {
            id: 'description_uk',
            size: 250,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Опис',
            footer: info => info.column.id,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("description_en", {
            id: 'description_en',
            size: 250,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Опис англ',
            footer: info => info.column.id,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("comment", {
            id: 'comment',
            size: 250,
            header: () => 'Коментар',
            enableSorting: false,
            enableResizing: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("subjectTypeId", {
            id: 'subjectTypeId',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => "Тип суб'єкта",
            footer: info => info.column.id,
            cell: ({row}) => <span>{row?.original?.subjectTypeId}</span>,
        }),
        columnHelper.accessor("belongCountryId", {
            id: 'belongCountryId',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Країна',
            footer: info => info.column.id,
            cell: ({row}) =>
                <span>{row?.original?.belongCountryId}</span>,
        }),
        columnHelper.accessor('createdAt', {
            id: 'createdAt',
            header: () => 'Дата створення',
            cell: props => props.getValue() || ' ---- ',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('updatedUserId', {
            id: 'updatedUserId',
            header: () => 'Створено',
            cell: props => {
                return dictionary?.user?.find(c => c.id === props.getValue())?.caption || ""
            },
            size: 100,
            enableSorting: false,
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
                    (auth?.user?.permissions?.pages?.dictionary?.update && row?.original?.id !== data?.data?.currentVersion) &&
                    <Tooltip content="Відновити">
                        <Button onClick={handleEdit(row?.id)} size="sm" color="green" title="Відновити">
                            <i className="fa-regular fa-rotate-left"></i>
                        </Button>
                    </Tooltip>
                }

            </div>),
        }),
    ], [auth, id, data, state?.dictionary])

    const versions = useMemo(() => {
        if (identifyVersions?.data?.length) {
            return identifyVersions?.data?.map(item => {
                return {
                    ...item,
                    subjectTypeId: subjectTypes.find(t => t.id === item?.subjectTypeId)?.caption,
                    belongCountryId: countries?.find(c => c.id === item?.belongCountryId)?.caption
                }
            })
        } else {
            return []
        }
    }, [identifyVersions, id])


    const handleLimit = (value) => {
        setFilters({...filters, limit: value});
    }
    const handlePageChange = (pageNumber) => {
        setFilters({...filters, page: pageNumber - 1});
    }

    return (
        <Dialog data-i-doc="modal:dictionary-identify-details-modal" open={open} size="xl" className="dark:bg-gray-800" handler={onClose}>
            <DialogHeader className="dark:text-gray-200">
                <span className="mr-5">Детальна інформація {details?.code}</span>
            </DialogHeader>
            <DialogBody className="h-[42rem] overflow-y-auto">
                {isFetching ?
                    <div className="flex flex-row justify-center w-full">
                        <Spinner className="h-12 w-12"/>
                    </div>
                    :
                    <Tabs value={tab}>
                        <TabsHeader className="bg-transparent" indicatorProps={{
                            className: "bg-gray-900/10 dark:bg-blue-900/50 shadow-none !text-gray-900",
                        }}>
                            <Tab value="info" className="dark:text-gray-50">Загальна інформація</Tab>
                            <Tab value="history" className="dark:text-gray-50">
                                <div className="flex flex-row items-center gap-x-2">
                                    Версії змін
                                    <div
                                        className="relative h-[20px] w-[20px] align-middle bg-gray-950 dark:bg-gray-950 rounded-[50%]">
                                        <span
                                            className="absolute text-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-white">{versions?.length}</span>
                                    </div>
                                </div>
                            </Tab>
                        </TabsHeader>
                        <TabsBody>
                            <TabPanel data-i-doc="tab:dictionary-identify-info" value="info">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">ID:</p>
                                        <p className="dark:text-slate-400 ">{details?.id}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Код:</p>
                                        <p className="dark:text-slate-400">{details?.code}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:dark:text-gray-400 font-bold ">Група:</p>
                                        <p className="dark:text-slate-400 ">{details?.group}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Паттерн:</p>
                                        {details?.pattern &&
                                            <pre><code
                                                className="bg-slate-800 dark:bg-slate-950 px-2 py-1.5 rounded-md text-green-500 dark:text-green-700">{details?.pattern}</code></pre>
                                        }
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Назва українською:</p>
                                        <p className="dark:text-slate-400 ">{details?.name_uk}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Опис українською:</p>
                                        <p className="dark:text-slate-400 ">{details?.description_uk}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Виводити як:</p>
                                        <p className="dark:text-slate-400 ">{details?.name_doc}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Опис англійською:</p>
                                        <p className="dark:text-slate-400 ">{details?.description_en}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Назва англійською:</p>
                                        <p className="dark:text-slate-400 ">{details?.name_en}</p>
                                    </div>

                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Коментар:</p>
                                        <p className="dark:text-slate-400 ">{details?.comment}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Тип суб'єкта:</p>
                                        <p className="dark:text-slate-400 ">{details?.subjectType?.caption}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Країна:</p>
                                        <p className="dark:text-slate-400 ">{details?.belongCountry?.caption}</p>
                                    </div>

                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Створено:</p>
                                        <p className="dark:text-slate-400 ">{data?.data?.createdAt}</p>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Останнє оновлення:</p>
                                        <p className="dark:text-slate-400 ">{data?.data?.updatedAt}</p>
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel data-i-doc="tab:dictionary-identify-history" value="history">
                                <p className="mb-2 font-bold text-lg dark:text-gray-200">
                                    Версії
                                </p>
                                <Table
                                    loading={versionsIsLoading}
                                    canChangeVisibility={false}
                                    canChangeResize={false}
                                    textSize="xs"
                                    pagination={{
                                        onLimitChange: handleLimit,
                                        onPageChange: handlePageChange,
                                        currentPage: filters?.page,
                                        pageSize: filters.limit,
                                        totalCount: identifyVersions?.total,
                                    }}
                                    data={versions} columns={columns}
                                />
                            </TabPanel>
                        </TabsBody>
                    </Tabs>
                }
            </DialogBody>
            <DialogFooter>
                <Button onClick={onClose} color="gray">
                    <span>Закрити</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default IdentifyDetailsModal;
