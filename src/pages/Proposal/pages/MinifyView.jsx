import {usePage} from "@inertiajs/react";
import {useQuery} from "@tanstack/react-query";
import {DictionaryProvider} from "../../Dictionary/DictionaryContext.jsx";
import Page from "../../../Components/Page.jsx";
import React, {useMemo} from "react";
import {createColumnHelper, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Button, Tooltip, Typography} from "@material-tailwind/react";

const columnHelper = createColumnHelper();

const MinifyView = () => {
    const {
        id,
        auth,
        projectState = [],
        subjectTypes = [],
        proposalState = [],

    } = usePage().props;

    const {data = {data: null}} = useQuery({
        queryKey: ['proposal-show', id],
        queryFn: async () => {
            const response = await axios.get(`/api/proposal/new/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        }
    });

    const {data: projects, isFetching: isLinkedProjectsLoading} = useQuery({
        queryKey: ['proposal-show-lined-projects-minify', id],
        queryFn: async () => {
            const response = await axios.get(`/api/proposal/new/${id}/linked-projects`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data?.data;
        }
    });

    const allItems = useMemo(() => {
        if (!projects?.data) return [];
        return Object.values(projects.data)
            .flatMap(group =>
                Object.values(group)
                    .flatMap(arr => arr)
            )
    }, [projects?.data])

    const proposal = data?.data;
    const isFixed = data?.data?.stateId
        ? proposalState.find(ps => ps.id === data.data.stateId)?.isFixed
        : false;

    const proposalElement = data?.data?.stateId && proposalState
        ? (() => {
            const proposalCaption = proposalState.find(s => s.id === data.data.stateId);
            switch (proposalCaption.caption) {
                case "Проєкт":
                case "Готово":
                    return (<Typography variant="small"
                                        className="text-sm px-3 w-fit rounded-xl text-white font-normal bg-blue-500 dark:bg-blue-700">
                        {proposalCaption.caption}
                    </Typography>);
                case "Проголосовано":
                case "Направлено":
                case "Реалізовано":
                    return (<Typography variant="small"
                                        className="px-3 w-fit rounded-xl text-white font-normal bg-emerald-500 dark:bg-emerald-700">
                        {proposalCaption.caption}
                    </Typography>);
                case "Не актуально":
                case "Повернуто":
                    return (<Typography variant="small"
                                        className="px-3 w-fit rounded-xl text-white font-normal bg-yellow-500 dark:bg-yellow-700">
                        {proposalCaption.caption}
                    </Typography>);
                default:
                    return (<Typography variant="small"
                                        className="px-3 w-fit rounded-xl text-white font-normal bg-blue-600 dark:border-blue-700">
                        <i className={proposalCaption.icon}></i>
                        <span>{proposalCaption.caption}</span>
                    </Typography>);
            }
        })()
        : null;

    // const allReadyItems = useMemo(() => allItems.filter(item => item.stateId === 2 || item.stateId === 7), [allItems]);


    const columns = useMemo(() => [
        columnHelper.accessor("subjectTypeId", {
            id: 'subjectTypeId',
            size: 100,
            header: () => 'Тип',
            cell: info => {
                if (info.getValue()) {
                    const state = subjectTypes.find(i => i.id === info.getValue());
                    return (<span>{state?.caption}</span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("stateId", {
            id: 'stateId',
            size: 100,
            header: () => 'Стан',
            cell: info => {
                if (info.getValue()) {
                    const state = projectState.find(i => i.id === info.getValue());
                    const color = (info.getValue() === 2  || info.getValue() === 7) ? "text-green-500" : " text-red-500";
                    return (<span className={color}>{state?.caption}</span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("_names", {
            id: '_names',
            size: 150,
            header: () => "Назва укр",
            cell: ({row}) => row.original?.nameUk || row.original?.nameEn || "Відсутнє значення",
            footer: info => info.column.id,
        }),
        columnHelper.accessor("precomputedData", {
            id: 'precomputedData',
            size: 100,
            header: () => 'Документи',
            cell: info => {
                const parsedPrecomputedData = JSON.parse(info.getValue());
                if (parsedPrecomputedData?.documents) {
                    return parsedPrecomputedData?.documents?.map((document, index) => (
                        <p className="text-sm" key={index}>{document?.unitCaption} {document?.regNum} {document?.regDate}</p>
                    ))
                }
                return "";
            },
            footer: info => info.column.id,
        }),

    ],[allItems]);

    const table = useReactTable({
        data: allItems || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <DictionaryProvider>
            <Page>
                <a data-i-doc="page:proposal-minify-view" href={`/proposal/${id}`}>
                    <Button size="sm" variant="text">
                        <i className="fa-regular fa-arrow-left"></i>
                        <span className="ml-1">
                            Назад
                            </span>
                    </Button>
                </a>
                <div className="flex flex-row mb-2  gap-x-1 font-medium dark:text-slate-200">
                    {
                        isFixed &&
                        <Tooltip content="Зафіксований">
                            <i className="text-md fa-solid fa-lock text-blue-600 mr-1"></i>
                        </Tooltip>
                    }
                    <div className="-mt-px flex flex-col">
                        <Typography
                            variant="h5"
                            className="font-medium"
                        >
                            {
                                Boolean(proposal) &&
                                <span className="ml-1">{proposal?.caption}</span>
                            }
                        </Typography>
                        <div>
                            {proposalElement}
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table id="minifyTable" className="table-auto text-sm boreder w-full text-left text-gray-500 dark:text-gray-400">
                        <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="border p-2 dark:bg-b text-left px-1 py-0.5  text-gray-800 font-normal  bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="border p-2 align-top bg-white text-left dark:bg-gray-900 border-b dark:border-gray-700">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Page>
        </DictionaryProvider>
    );
};

export default MinifyView;
