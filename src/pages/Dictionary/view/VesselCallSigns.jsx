import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { VesselCallSignsViewModel } from "../viewmodel/DictionaryViewModels.js";
import {useMemo} from 'react';
import {createColumnHelper} from "@tanstack/react-table";
import Table from "../../../components/Table/Table.jsx";
import { loadColumnSizes } from "../../../components/Table/columnSizes.js";
import { Tooltip, Typography } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import AdvancedSelect from "../../../components/fields/AdvancedSelect.jsx";


const columnHelper = createColumnHelper();

/** page — DictionaryPageViewModel (countries). */
const VesselCallSigns = ({ page }) => {
    const vm = useViewModel((deps) => new VesselCallSignsViewModel(deps));
    const countries = page.countries;
    const { filters, data, isFetching, hasActiveFilter } = vm;
    const handleChangeOptions = vm.changeOptions;
    const handleLimit = vm.table.setLimit;
    const handlePageChange = vm.table.setPageFromPaginator;
    const handleClearFilters = vm.clearFilters;

    const columns = useMemo(() => [
        columnHelper.accessor("belong_country_name", {
            id: 'belong_country_name',
            size: loadColumnSizes()?.find(item => item.column === 'belong_country_name')?.size || 200,
            header: () => 'Країна (РНБО)',
            footer: info => info.column.id,
            cell: info => info.getValue(),
            enableSorting: false,
        }),
        columnHelper.accessor("allocated_country_name", {
            id: 'allocated_country_name',
            size: loadColumnSizes()?.find(item => item.column === 'allocated_country_name')?.size || 200,
            header: () => 'Країна (ITU)',
            footer: info => info.column.id,
            cell: info => info.getValue(),
            enableSorting: false,
        }),
        columnHelper.accessor("start_prefix", {
            id: 'start_prefix',
            size: 80,
            header: () => 'Початок діапазону',
            footer: info => info.column.id,
            cell: info => info.getValue(),
            enableSorting: false,
        }),
        columnHelper.accessor("end_prefix", {
            id: 'end_prefix',
            size: 80,
            header: () => 'Кінець діапазону',
            footer: info => info.column.id,
            cell: info => info.getValue(),
            enableSorting: false,
        }),
        columnHelper.accessor("raw_series", {
            id: 'raw_series',
            size: 80,
            header: () => 'Серія',
            footer: info => info.column.id,
            cell: info => info.getValue(),
            enableSorting: false,
        }),
        columnHelper.accessor("updated_at", {
            id: 'updated_at',
            size: loadColumnSizes()?.find(item => item.column === 'updated_at')?.size || 120,
            header: () => 'Дата оновлення',
            enableResizing: false,
            footer: info => info.column.id,
            cell: info => info.getValue() ?? '—',
            enableSorting: false,
        }),
    ], []);

    return (
        <div>
            <div
                className="flex w-fit items-start gap-x-2 mb-4 px-3 py-2 rounded-md border border-indigo-200 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-900/20">
                <i className="fa-solid fa-circle-info mt-0.5 text-indigo-600 dark:text-indigo-300"/>
                <Typography variant="small" className="text-indigo-800 dark:text-indigo-200 font-normal leading-snug">
                    Довідник позивних назв суден згідно даних Міжнародного союзу електрозв'язку (ITU)
                </Typography>
            </div>

            <div className="mb-3 flex flex-row items-end gap-x-2 rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="w-72">
                    <AdvancedSelect
                        size="xs"
                        isMulti
                        options={countries}
                        label="Країна"
                        id="belongCountryId"
                        selectedOptions={filters.belongCountryId}
                        onChange={handleChangeOptions('belongCountryId')}
                    />
                </div>
                <Tooltip content="Скинути фільтри">
                    <Button size="sm" className="h-9" disabled={!hasActiveFilter} onClick={handleClearFilters}>
                        <i className="fa-regular fa-filter-slash"/>
                    </Button>
                </Tooltip>
            </div>
            <div className="mt-2 mx-2">
                <Table
                    loading={isFetching}
                    canChangeVisibility
                    canChangeResize
                    textSize="xs"
                    data={data?.data ?? []}
                    columns={columns}
                    pagination={{
                        onLimitChange: handleLimit,
                        onPageChange: handlePageChange,
                        currentPage: filters.page,
                        pageSize: data?.limit,
                        totalCount: data?.total,
                    }}
                />
            </div>
        </div>
    );
};

export default observer(VesselCallSigns);
