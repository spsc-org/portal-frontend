import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createColumnHelper } from "@tanstack/react-table";
import { Tooltip } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import Page from "../../../components/Page.jsx";
import Table from "../../../components/Table/Table.jsx";
import { loadColumnSizes } from "../../../components/Table/columnSizes.js";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import SingleSelect from "../../../components/fields/SingleSelect.jsx";
import SubjectDetailsModal from "./SubjectDetailsModal.jsx";

const columnHelper = createColumnHelper();
const savedSize = (key, fallback = 150) => loadColumnSizes()?.find((item) => item.column === key)?.size || fallback;

const SummaryData = ({ data }) => {
    if (!data || !(data instanceof Object)) return null;
    return Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-x-1">
            <span className="font-semibold dark:text-gray-300 dark:bg-blue-800 bg-blue-300">{key}:</span>
            <span>{Array.isArray(value) ? value.join("; ") : value}</span>
        </div>
    ));
};

function useSubjectColumns(vm) {
    return useMemo(() => [
        columnHelper.accessor("typeId", {
            id: "typeId",
            size: savedSize("typeId"),
            header: () => "Тип суб'єкта",
            cell: (info) => (info.getValue() ? <span>{vm.subjectTypeCaption(info.getValue())} </span> : ""),
        }),
        columnHelper.accessor("caption", { id: "caption", size: savedSize("caption"), header: () => "Caption" }),
        columnHelper.accessor("summaryData", {
            id: "summaryData",
            size: savedSize("summaryData"),
            header: () => "Ідентифікаційні дані",
            enableSorting: false,
            cell: (info) => <SummaryData data={info.getValue()}/>,
        }),
        columnHelper.accessor("relProjectsCount", {
            id: "relProjectsCount",
            size: savedSize("relProjectsCount"),
            header: () => "К-сть проєктів",
            cell: (info) => info.getValue() || 0,
        }),
        columnHelper.display({
            id: "actions",
            maxSize: 100,
            header: () => "Дії",
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => (
                <div className="flex flex-row gap-x-2 p-2 justify-end">
                    <Tooltip content="Детальна інформація">
                        <Button onClick={() => vm.openDetails(row.original.id)} size="sm" variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    </Tooltip>
                </div>
            ),
        }),
    ], [vm]);
}

const SubjectView = ({ vm }) => {
    const { table } = vm;
    const columns = useSubjectColumns(vm);

    return (
        <Page>
            <div data-i-doc="page:subject" className="mt-2 mx-2">
                <div className="mb-3 rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="grid grid-cols-3 items-end gap-x-5 gap-y-2">
                        <SearchInput size="sm" name="caption" value={table.filters.caption} label="Глобальний пошук" onChange={table.handleInput}/>
                        <SingleSelect
                            closeMenuOnSelect
                            options={vm.subjectTypes}
                            label="Стан"
                            id="subjectType"
                            value={table.filters.subjectType}
                            onChange={vm.setSubjectType}
                        />
                        <div className="flex">
                            <Tooltip content="Скинути фільтри">
                                <Button className="h-9" onClick={() => table.reset()}>
                                    <i className="fa-regular fa-filter-slash"></i>
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                <Table
                    loading={vm.isLoading}
                    canChangeVisibility
                    canChangeResize
                    textSize="xs"
                    pagination={vm.pagination}
                    data={vm.rows}
                    columns={columns}
                    initialSorting={table.sorting}
                    onSort={table.applySorting}
                />
            </div>
            <SubjectDetailsModal vm={vm}/>
        </Page>
    );
};

export default observer(SubjectView);
