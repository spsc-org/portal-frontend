import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import React, {useMemo, useState} from "react";
import Table from "@/Components/Table/Table.jsx";
import {useQuery} from "@tanstack/react-query";
import {usePage} from "@inertiajs/react";
import {createColumnHelper} from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const DuplicateProjectsModal = ({open, onClose, ...props}) => {
    const {
        auth,
        users = [],
        itemType = [],
        projectActionType = [],
        projectState = []
    } = usePage().props;

    const TABS = useMemo(() => {
        return [
            {value: "nameUk", label: "Назва українською"},
            {value: "nameRu", label: "Назва російською",},
            {value: "nameEn", label: "Назва іноземною"},
            {value: "drsId", label: "Код в ДРС"},
            {value: "tax", label: "Tax"},
            {value: "reg", label: "Reg"},
            {value: "doc", label: "Doc"},
            {value: "imo", label: "IMO"},
            {value: "mmsi", label: "MMSI"}
        ].filter(item => Boolean(props?.[item.value]))
    }, [props])

    const [tab, setTab] = useState(TABS[0].value);

    const [params, setParams] = useState({
        limit: 10,
        page: 0,
    });

    const {data: projects, isLoading} = useQuery({
        queryKey: ["projects-calcSearch", params, tab],
        queryFn: async () => {
            if (!Boolean(props?.[tab])) {
                return;
            }
            const response = await axios.get(`/api/project/data`, {
                params: {
                    ...params,
                    filters: JSON.stringify({"fId": Boolean(props?.[tab]) ? props[tab]?.join(",") : undefined})
                },
                headers: {'Content-Type': 'application/json', "userId": auth?.user?.id}
            });
            return response?.data;
        },
        enabled: Boolean(props?.[tab].length)
    });

    const handleLimit = (value) => {
        setParams(prevState => ({...prevState, page: 0, limit: value}));
    }

    const handlePage = (pageNumber) => {
        setParams(prevState => ({...prevState, page: pageNumber - 1}));
    }

    const highlightText = (text, highlights = []) => {
        if (!text) return null;

        return text.split(' ').map((word, index) => {
            const lowerCaseWord = word.toLowerCase();
            const isHighlighted = highlights.some(h => lowerCaseWord.includes(h));
            return isHighlighted ? (
                <span
                    key={index}
                    className="bg-yellow-300 font-bold rounded px-1"
                >
                    {word}
                </span>
            ) : (
                <span key={index} className="mx-1">
                    {word}
                </span>
            );
        });
    };


    const columns = useMemo(() => [
        columnHelper.accessor("actionType", {
            id: 'actionType',
            size: 80,
            enableResizing: false,
            enableSorting: false,
            header: () => 'Дія',
            footer: info => info.column.id,
            cell: info => {
                const find = projectActionType.find(action => action.id === info.getValue());
                return (
                    <span> <span>{find?.caption}</span></span>)
            }
        }),
        columnHelper.accessor("subjectTypeId", {
            size: 80,
            id: 'subjectTypeId',

            enableResizing: false,
            enableSorting: false,
            header: () => 'Тип',
            footer: info => info.column.id,
            cell: info => {
                const find = itemType.find(type => type.id === info.getValue());
                return (<span>{find?.caption}</span>)
            }
        }),
        columnHelper.accessor("stateId", {
            size: 80,
            id: 'stateId',
            enableResizing: false,
            enableSorting: false,
            header: () => 'Стан',
            footer: info => info.column.id,
            cell: info => {
                const find = projectState.find(type => type.id === info.getValue());
                return (<span className="flex flex-row items-center gap-x-2"><i
                    className={`text-xl ${find?.icon} ${find?.style}`}></i> <span>{find?.caption}</span></span>)
            }
        }),
        columnHelper.accessor("drsId", {
            size: 80,
            id: 'drsId',
            enableResizing: false,
            enableSorting: false,
            header: () => 'ДРС ID',
            footer: info => info.column.id,
        }),
        columnHelper.accessor("name", {
            size: 80,
            id: 'name',
            enableResizing: false,
            enableSorting: false,
            header: () => 'Назви',
            footer: info => info.column.id,
            cell: ({row}) => {
                console.log(row?.original?.subjectTypeId);
                if (Number(row?.original?.subjectTypeId) === 5) {
                    return (
                        <div>
                            <p className="mb-2">
                                 {highlightText(row?.original?.nameEn, projects?.highlitedWords)}
                            </p>
                        </div>
                    );
                }

                return (<div>
                    <p className="mb-2">
                        <span
                            className="font-medium">Uk:</span> {highlightText(row?.original?.nameUk, projects?.highlitedWords)}
                    </p>
                    <p className="mb-2">
                        <span
                            className="font-medium">Ru:</span> {highlightText(row?.original?.nameRu, projects?.highlitedWords)}
                    </p>
                    <p className="mb-2">
                        <span
                            className="font-medium">En:</span> {highlightText(row?.original?.nameEn, projects?.highlitedWords)}
                    </p>
                </div>)
            },
        }),
        columnHelper.accessor("identifiers", {
            id: 'identifiers',
            enableResizing: false,
            enableSorting: false,
            header: () => 'Ідентифікаційні дані',
            footer: info => info.column.id,
            cell: ({row}) => {
                try {
                    const parsed = JSON.parse(row.original?.precomputedData);
                    const taxes = parsed?.identifiers.filter(item => item?.group === "tax");
                    const regs = parsed?.identifiers.filter(item => item?.group === "reg");
                    const docs = parsed?.identifiers.filter(item => item?.group === "doc");
                    if (Number(row?.original?.subjectTypeId) === 5) {
                        return (
                            <div className="text-xs">
                                {regs.map((reg, index) => (
                                    <p key={index} className="mb-1">
                                        <span className="font-semibold">{reg?.caption || "REG"}:</span>{" "}
                                        <span className="underline">{reg?.value}</span>
                                        {reg?.country != null && reg?.country !== "" && (
                                            <span>[{reg.country}]</span>
                                        )}
                                    </p>
                                ))}
                            </div>
                        );
                    }

                    return (
                        <div className="text-xs">
                            <p className="mb-1">
                                <span className="font-medium">{"TAX:"}</span>
                                {taxes.map((item, index) => (<span key={index}>{item?.value}</span>))}
                            </p>
                            <p className="mb-1">
                                <span className="font-medium">{"REG:"}</span>
                                {regs.map((item, index) => (<span key={index}>{item?.value}</span>))}
                            </p>
                            <p className="mb-1">
                                <span className="font-medium">{"DOC:"}</span>
                                {docs.map((item, index) => (<span key={index}>{item?.value}</span>))}
                            </p>

                        </div>)
                } catch (e) {
                    console.error(e);
                    return "";
                }
            }
        }),
        columnHelper.accessor("attributes", {
            id: 'attributes',
            enableResizing: false,
            enableSorting: false,
            header: () => 'Атрибути',
            footer: info => info.column.id,
            cell: ({row}) => {
                try {
                    const parsed = JSON.parse(row.original?.precomputedData);
                    return parsed?.attributes.map((item, index) => {
                        return (
                            <div className="text-xs">
                                <p key={index} className="mb-1">
                                    <span className="font-semibold">{item?.caption}:</span>{" "}
                                    <span className="underline">{item?.value}</span>
                                </p>
                            </div>
                        )
                    });
                } catch (e) {
                    console.error(e);
                    return "";
                }

            }
        }),
        columnHelper.accessor("documents", {
            id: 'documents',
            enableResizing: false,
            size: 80,
            enableSorting: false,
            header: () => 'Документи',
            footer: info => info.column.id,
            cell: ({row}) => {
                try {
                    const parsed = JSON.parse(row.original?.precomputedData);
                    return parsed?.documents.map((item, index) => {
                        return (
                            <div key={index} className="flex flex-row text-xs gap-x-2 items-center">
                                <span>{item?.regNum} {item?.regDate}</span>
                            </div>
                        )
                    });
                } catch (e) {
                    console.error(e);
                    return "";
                }

            }
        }),


        columnHelper.accessor("proposals", {
            size: 80,
            id: 'proposals',
            enableResizing: false,
            enableSorting: false,
            header: () => 'Подання',
            footer: info => info.column.id,
            cell: info => {
                try {
                    const parsed =  Boolean(info.getValue()) ? JSON.parse(info.getValue()) : null;
                    return (parsed?.proposals || []).map((item, index) => {
                        const color = item?.stateId === 5
                            ? "text-green-500"
                            : (item?.stateId >= 3 && item?.stateId <= 4)
                                ? "text-blue-500"
                                : "text-gray-700";
                        return (
                            <div key={index} className="flex flex-row text-xs gap-x-2 items-center">
                                <i className={`fa-solid fa-briefcase ${color}`}></i>
                                <span>Подання:{item?.caption}</span>
                            </div>
                        )
                    });
                } catch (e) {
                    console.error(e);
                    return "";
                }

            }
        }),

    ], [auth, projects?.highlitedWords])


    return (
        <Dialog open={open} handler={onClose} size="xl">
            <DialogHeader
                className="dark:text-gray-200">Дублікати</DialogHeader>
            <DialogBody className="h-[42rem] overflow-y-auto">
                <div
                    className="mb-3 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/60">
                    {TABS.map(({label, disabled, value}) => (
                        <button
                            key={value}
                            type="button"
                            disabled={disabled}
                            onClick={() => setTab(value)}
                            className={`group inline-flex min-w-[11rem] flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
                            ${tab === value
                                ? "border-blue-500 bg-blue-600 text-white shadow-sm dark:border-blue-400 dark:bg-blue-500 dark:text-gray-900"
                                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-400 dark:hover:bg-gray-700"}
                            ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="truncate">{label}</span>
                                <div
                                    className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-semibold
                                    ${tab === value
                                        ? "bg-white/25 text-white dark:bg-gray-900/25 dark:text-gray-900"
                                        : "bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-900"}`}>
                                    {Boolean(props?.[value]?.length) ? props?.[value]?.length : 0}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                <Table
                    loading={isLoading}
                    canChangeVisibility
                    canChangeResize
                    textSize="xs"
                    pagination={{
                        onLimitChange: handleLimit,
                        onPageChange: handlePage,
                        currentPage: params?.page,
                        pageSize: params?.limit,
                        totalCount: projects?.total,
                    }} data={projects?.data || []} columns={columns}
                />
            </DialogBody>
            <DialogFooter>
                <Button variant="gradient" color="green" onClick={onClose}>
                    <span>Ок</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default DuplicateProjectsModal;
