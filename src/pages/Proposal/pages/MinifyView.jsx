import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { ProposalViewViewModel } from "../viewmodel/ProposalViewModels.js";
import Page from "../../../components/Page.jsx";
import {useMemo} from "react";
import {useParams} from "react-router";
import {createColumnHelper, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Tooltip, Typography} from "@material-tailwind/react";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "../../../components/Table/tableStyles.js";

const columnHelper = createColumnHelper();

const MinifyViewContent = observer(({ vm }) => {
    const { id, projectState = [], subjectTypes = [], proposalState = [] } = vm.props;
    const data = vm.proposalQuery.data ?? {data: null};
    const projects = vm.projects;
    // Мінімізований вигляд показує всі проєкти (не лише готові).
    const allItems = projects?.data
        ? Object.values(projects.data).flatMap(group => Object.values(group).flat())
        : [];

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
            <Page>
                {/* "Назад" і назва подання — у breadcrumbs глобального Header */}
                <PageHeader
                    title="Спрощений вид"
                    documentTitle="Подання (мінімізовано)"
                    breadcrumbs={[{ label: "Подання", href: "/proposal" }, { label: proposal?.caption || `#${id}`, href: `/proposal/${id}` }]}
                />
                <div data-i-doc="page:proposal-minify-view" className="mb-2 flex items-center gap-x-1 font-medium dark:text-gray-200">
                    {
                        isFixed &&
                        <Tooltip content="Зафіксований">
                            <i className="text-md fa-solid fa-lock text-blue-600 mr-1"></i>
                        </Tooltip>
                    }
                    {proposalElement}
                </div>
                <div className={twMerge(TABLE_WRAP, "")}>
                    <table id="minifyTable" className={twMerge(TABLE, "table-auto boreder w-full text-left")}>
                        <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className={twMerge(TH, "dark:bg-b text-left")}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr className={TR} key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className={twMerge(TD, "align-top text-left")}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Page>
    );
});

/** Маршрут /proposal/:id/minify (pageAccess). */
const MinifyView = () => {
    const { id } = useParams();
    const vm = useViewModel((deps) => new ProposalViewViewModel({ ...deps, id, minify: true }));
    return <MinifyViewContent vm={vm}/>;
};

const MinifyViewRoute = () => {
    const { id } = useParams();
    return <MinifyView key={id}/>;
};

export default MinifyViewRoute;
