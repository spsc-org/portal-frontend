import React, {useMemo, useState} from 'react';
import {createColumnHelper} from "@tanstack/react-table";
import Table, {loadColumnSizes} from "../../../Components/Table/Table.jsx";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {usePage} from "@inertiajs/react";
import {Button, Tooltip, Typography} from "@material-tailwind/react";
import {fetchVesselCallSigns} from "../utils.js";
import AdvancedSelect from "../../../Components/fields/AdvancedSelect.jsx";


const columnHelper = createColumnHelper();

const INITIAL_FILTERS = {
    belongCountryId: [],
    limit: 50,
    page: 0,
};

const VesselCallSigns = () => {
    const {auth, countries = []} = usePage().props;
    const [filters, setFilters] = useState(INITIAL_FILTERS);

    const {data, isFetching} = useQuery({
        queryKey: ['vessel-call-signs', filters],
        queryFn: () => fetchVesselCallSigns({...filters, userId: auth?.user?.id}),
        placeholderData: keepPreviousData,
    });

    const handleChangeOptions = (key) => (newSelectedIds) => {
        setFilters(prev => ({...prev, page: 0, [key]: newSelectedIds}));
    };

    const handleLimit = (value) => {
        setFilters(prev => ({...prev, page: 0, limit: value}));
    };

    const handlePageChange = (pageNumber) => {
        setFilters(prev => ({...prev, page: pageNumber - 1}));
    };

    const hasActiveFilter = filters.belongCountryId?.length > 0;

    const handleClearFilters = () => {
        setFilters(INITIAL_FILTERS);
    };

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

            <div className="flex flex-row items-end gap-x-2 mb-5">
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
                    <Button size="sm" className="h-10" disabled={!hasActiveFilter} onClick={handleClearFilters}>
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

export default VesselCallSigns;
