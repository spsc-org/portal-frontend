import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createColumnHelper } from "@tanstack/react-table";
import { Tooltip } from "@material-tailwind/react";
import Table, { loadColumnSizes } from "../../../components/Table/Table.jsx";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import AdvancedSelect from "../../../components/fields/AdvancedSelect.jsx";
import DateRangePicker from "../../../components/fields/DateRangePicker.jsx";
import CollapsibleSection from "../../../components/CollapsibleSection.jsx";
import { convertDate } from "../../../lib/utils.js";
import AuditDetailModal from "./AuditDetailModal.jsx";

const columnHelper = createColumnHelper();
const savedSize = (key, fallback) => loadColumnSizes()?.find((c) => c.column === key)?.size || fallback;

/** Колонки — суто View (react-table), дані/лейбли — з VM. */
function useAuditColumns(vm) {
    const { entity } = vm;
    return useMemo(() => [
        columnHelper.accessor('id', { header: 'ID', size: savedSize(`${entity}-id`, 70) }),
        columnHelper.accessor('entityId', { header: 'Entity ID', size: savedSize(`${entity}-entityId`, 90) }),
        columnHelper.accessor('action', { header: 'Дія', size: savedSize(`${entity}-action`, 150) }),
        columnHelper.accessor('userId', {
            header: 'Користувач',
            size: savedSize(`${entity}-userId`, 160),
            cell: ({ getValue }) => vm.userName(getValue()),
        }),
        columnHelper.accessor('createdAt', {
            header: 'Дата',
            size: savedSize(`${entity}-createdAt`, 150),
            cell: ({ getValue }) => getValue()
                ? <Tooltip content={getValue()}>{convertDate(getValue())}</Tooltip>
                : '—',
        }),
    ], [vm, entity]);
}

const AuditTable = ({ vm }) => {
    const { table } = vm;
    const filters = table.filters;
    const columns = useAuditColumns(vm);
    const userOptions = vm.parent.userOptions;

    return (
        <>
            <CollapsibleSection title="Фільтри" className="mb-4" headerClassName="mb-2" bodyClassName="pt-1">
                <div className="inline-flex flex-wrap gap-x-2 gap-y-2 items-end">
                    <div className="w-[120px]">
                        <SearchInput size="xs" name="entityId" value={filters.entityId} label="Entity ID" onChange={table.handleInput}/>
                    </div>
                    <AdvancedSelect
                        size="xs"
                        label="Користувач"
                        id={`audit-user-${vm.entity}`}
                        options={userOptions}
                        selectedOptions={filters.userId}
                        isMulti
                        width="220px"
                        onChange={vm.setUsers}
                    />
                    <AdvancedSelect
                        size="xs"
                        label="Дія"
                        id={`audit-action-${vm.entity}`}
                        options={vm.actionOptions}
                        selectedOptions={vm.selectedActionOption}
                        isClearable
                        width="200px"
                        onChange={vm.setAction}
                    />
                    <div className="w-[200px]">
                        <DateRangePicker size="xs" label="Дата" onChange={vm.setDateRange} from={filters.from} to={filters.to}/>
                    </div>
                    <button
                        onClick={() => table.reset()}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200 dark:hover:bg-gray-700"
                    >
                        Очистити
                    </button>
                </div>
            </CollapsibleSection>

            <Table
                loading={vm.isFetching}
                canChangeVisibility
                canChangeResize
                textSize="xs"
                data={vm.rows}
                columns={columns}
                initialSorting={table.sorting}
                onSort={table.applySorting}
                onDoubleClick={(row) => vm.openDetail(row.original.id)}
                pagination={vm.pagination}
            />

            <AuditDetailModal vm={vm}/>
        </>
    );
};

export default observer(AuditTable);
