import React, {useEffect, useMemo, useState} from "react";
import Page from "@/Components/Page.jsx";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import AuditDetailModal from "./AuditDetailModal.jsx";
import {Tab, TabPanel, Tabs, TabsBody, TabsHeader} from "@material-tailwind/react";
import {createColumnHelper} from "@tanstack/react-table";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import axios from "axios";
import Table, {loadColumnSizes} from "@/Components/Table/Table.jsx";
import SearchInput from "@/Components/fields/SearchInput.jsx";
import AdvancedSelect from "@/Components/fields/AdvancedSelect.jsx";
import DateRangePicker from "@/Components/fields/DateRangePicker.jsx";
import CollapsibleSection from "@/Components/CollapsibleSection.jsx";
import {format} from "date-fns";
import {convertDate, serializeParams} from "@/utils.js";
import {Tooltip} from "@material-tailwind/react";

const columnHelper = createColumnHelper();

const TABS = [
    {value: 'project',    label: 'Проєкти'},
    {value: 'identifier', label: 'Ідентифікатори'},
    {value: 'user',       label: 'Користувачі'},
    {value: 'inventory',  label: 'Інвентар'},
];

const getInitialTab = () => {
    const param = new URLSearchParams(window.location.search).get('tab');
    return TABS.find(t => t.value === param) ? param : TABS[0].value;
};

const makeInitialFilters = () => ({
    entityId: '',
    userId:   [],
    action:   '',
    from:     '',
    to:       '',
    page:     0,
    limit:    50,
    sort:     'createdAt',
    dir:      'desc',
});

// ─── AuditTable ──────────────────────────────────────────────────────────────

const AuditTable = ({entity, users, actions}) => {
    const storageKey = `${location.pathname}-${entity}`;

    const [filters,    setFilters]    = useState(makeInitialFilters);
    const [sorting,    setSorting]    = useState([]);
    const [isHydrated, setIsHydrated] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // ── Відновлення з localStorage ──────────────────────────────────────────
    useEffect(() => {
        try {
            const storedFilters = localStorage.getItem(`${storageKey}-filters`);
            if (storedFilters) {
                const {page: _, ...parsed} = JSON.parse(storedFilters);
                setFilters(f => ({...f, ...parsed}));
            }
            const storedSorting = localStorage.getItem(`${storageKey}-sorting`);
            if (storedSorting) setSorting(JSON.parse(storedSorting));
        } catch {}
        setIsHydrated(true);
    }, []);

    // ── Збереження у localStorage ────────────────────────────────────────────
    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem(`${storageKey}-filters`, JSON.stringify(filters));
    }, [filters, isHydrated]);

    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem(`${storageKey}-sorting`, JSON.stringify(sorting));
    }, [sorting, isHydrated]);

    // ── Запит даних ──────────────────────────────────────────────────────────
    const {data: response, isFetching} = useQuery({
        queryKey: ['audit', entity, filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page:   filters.page + 1,
                userId: filters.userId?.map(u => u.value) ?? [],
            };
            const res = await axios.get(`/api/audit/${entity}`, {params: serializeParams(params)});
            return res.data;
        },
        placeholderData: keepPreviousData,
        enabled: isHydrated,
    });

    const rows  = response?.data         ?? [];
    const total = response?.meta?.total  ?? 0;
    const limit = response?.meta?.limit  ?? filters.limit;
    const page  = response?.meta?.page   ?? (filters.page + 1);

    // ── Опції для фільтрів ───────────────────────────────────────────────────
    const actionOptions = useMemo(
        () => actions.map(a => ({value: a, label: a})),
        [actions],
    );

    const selectedActionOption = useMemo(
        () => actionOptions.find(o => o.value === filters.action) ?? null,
        [actionOptions, filters.action],
    );

    // ── Хендлери ─────────────────────────────────────────────────────────────
    const handleTextFilter = ({target: {name, value}}) =>
        setFilters(f => ({...f, page: 0, [name]: value}));

    const handleUserFilter = (selected) =>
        setFilters(f => ({...f, page: 0, userId: selected || []}));

    const handleActionFilter = (selected) =>
        setFilters(f => ({...f, page: 0, action: selected?.value ?? ''}));

    const handleDate = (range) =>
        setFilters(f => ({
            ...f, page: 0,
            from: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
            to:   range?.to   ? format(range.to,   'yyyy-MM-dd') : '',
        }));

    const handleSort = (model) => {
        setSorting(model);
        const s = model();
        if (s.length > 0) {
            setFilters(f => ({...f, sort: s[0].id, dir: s[0].desc ? 'desc' : 'asc'}));
        }
    };

    const handlePageChange  = (p) => setFilters(f => ({...f, page: p - 1}));
    const handleLimitChange = (v) => setFilters(f => ({...f, page: 0, limit: Number(v)}));

    const handleClear = () =>
        setFilters({...makeInitialFilters(), limit: filters.limit});

    // ── Колонки ──────────────────────────────────────────────────────────────
    const columns = useMemo(() => [
        columnHelper.accessor('id', {
            header: 'ID',
            size: loadColumnSizes()?.find(c => c.column === `${entity}-id`)?.size || 70,
        }),
        columnHelper.accessor('entityId', {
            header: 'Entity ID',
            size: loadColumnSizes()?.find(c => c.column === `${entity}-entityId`)?.size || 90,
        }),
        columnHelper.accessor('action', {
            header: 'Дія',
            size: loadColumnSizes()?.find(c => c.column === `${entity}-action`)?.size || 150,
        }),
        columnHelper.accessor('userId', {
            header: 'Користувач',
            size: loadColumnSizes()?.find(c => c.column === `${entity}-userId`)?.size || 160,
            cell: ({getValue}) => {
                const id = getValue();
                const u  = users.find(u => u.value === id);
                return u ? u.label : (id ? `#${id}` : '—');
            },
        }),
        columnHelper.accessor('createdAt', {
            header: 'Дата',
            size: loadColumnSizes()?.find(c => c.column === `${entity}-createdAt`)?.size || 150,
            cell: ({getValue}) => getValue()
                ? <Tooltip content={getValue()}>{convertDate(getValue())}</Tooltip>
                : '—',
        }),
    ], [users, entity]);

    // ── Рендер ───────────────────────────────────────────────────────────────
    return (
        <>
            <CollapsibleSection
                title="Фільтри"
                className="mb-4"
                headerClassName="mb-2"
                bodyClassName="pt-1"
            >
                <div className="inline-flex flex-wrap gap-x-2 gap-y-2 items-end">
                    <div style={{width: '120px'}}>
                        <SearchInput
                            size="xs" name="entityId" value={filters.entityId}
                            label="Entity ID" onChange={handleTextFilter}
                        />
                    </div>
                    <AdvancedSelect
                        size="xs"
                        label="Користувач"
                        id={`audit-user-${entity}`}
                        options={users}
                        selectedOptions={filters.userId}
                        isMulti
                        width="220px"
                        onChange={handleUserFilter}
                    />
                    <AdvancedSelect
                        size="xs"
                        label="Дія"
                        id={`audit-action-${entity}`}
                        options={actionOptions}
                        selectedOptions={selectedActionOption}
                        isClearable
                        width="200px"
                        onChange={handleActionFilter}
                    />
                    <div style={{width: '200px'}}>
                        <DateRangePicker
                            size="xs" label="Дата" onChange={handleDate}
                            from={filters.from} to={filters.to}
                        />
                    </div>
                    <button
                        onClick={handleClear}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200 dark:hover:bg-gray-700"
                    >
                        Очистити
                    </button>
                </div>
            </CollapsibleSection>

            <Table
                loading={isFetching}
                canChangeVisibility
                canChangeResize
                textSize="xs"
                data={rows}
                columns={columns}
                onSort={handleSort}
                onDoubleClick={(row) => setSelectedId(row.original.id)}
                pagination={{
                    currentPage:  page - 1,
                    pageSize:     limit,
                    totalCount:   total,
                    onPageChange:  handlePageChange,
                    onLimitChange: handleLimitChange,
                }}
            />

            <AuditDetailModal
                open={!!selectedId}
                entity={entity}
                recordId={selectedId}
                users={users}
                onClose={() => setSelectedId(null)}
            />
        </>
    );
};

// ─── Index ────────────────────────────────────────────────────────────────────

const Index = () => {
    const [tab, setTab] = useState(getInitialTab);

    const handleTabChange = (value) => {
        setTab(value);
        const params = new URLSearchParams(window.location.search);
        params.set('tab', value);
        history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    };

    const {data: options} = useQuery({
        queryKey: ['audit-options'],
        queryFn: async () => {
            const res = await axios.get('/api/audit/options');
            return res.data?.data ?? {users: [], actions: {project: [], identifier: []}};
        },
        staleTime: 5 * 60 * 1000,
    });

    const users = useMemo(
        () => (options?.users ?? []).map(u => ({value: u.id, label: u.name})),
        [options],
    );

    return (
        <DictionaryProvider>
        <Page>
            <Tabs value={tab}>
                <div data-i-doc="page:audit" className="bg-white dark:bg-slate-800 w-8/12 mx-auto rounded-lg shadow-lg mb-5">
                    <TabsHeader
                        className="rounded-none text-xs border-blue-gray-50 bg-transparent p-0 z-0"
                        indicatorProps={{
                            className: "bg-transparent border-b-2 border-gray-900 shadow-none rounded-none",
                        }}
                    >
                        {TABS.map(({value, label}) => (
                            <Tab
                                key={value}
                                value={value}
                                onClick={() => handleTabChange(value)}
                                className={`${tab === value ? "text-gray-900 dark:text-slate-100" : ""} text-sm p-0 dark:text-slate-400`}
                            >
                                {label}
                            </Tab>
                        ))}
                    </TabsHeader>
                </div>
                <TabsBody>
                    {TABS.map(({value}) => (
                        <TabPanel key={value} value={value} className="p-1 bg-white dark:bg-slate-800">
                            <AuditTable
                                entity={value}
                                users={users}
                                actions={options?.actions?.[value] ?? []}
                            />
                        </TabPanel>
                    ))}
                </TabsBody>
            </Tabs>
        </Page>
        </DictionaryProvider>
    );
};

export default Index;
