import React, {useEffect, useMemo, useState} from 'react';
import {usePage} from "@inertiajs/react";
import AdvancedSelectWithDefaults from "@/Components/fields/AdvancedSelectWithDefaults.jsx";
import {createColumnHelper} from "@tanstack/react-table";
import Table, {loadColumnSizes} from "@/Components/Table/Table.jsx";
import {Button, Tooltip} from "@material-tailwind/react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {fetchSearchData} from "./utils/utils.js";
import Page from "@/Components/Page.jsx";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import AdvancedSearchInput from "@/Components/fields/AdvancedSearchInput.jsx";
import {useDialog} from "@/hooks/useDialog.js";
import DetailsDialog from "./components/DetailsDialog.jsx";
import highlightText from "./components/highlightText.jsx";
import {BasketProvider, useBasket} from "./context/BasketContext.jsx";
import BasketDialog from "./components/BasketDialog.jsx";
import CollapsibleSection from "@/Components/CollapsibleSection.jsx";

// Імпорт презентерів комірок
import Dataset1CellPresenters from "./components/cellPresenters/1.jsx";
import Dataset3CellPresenters from "./components/cellPresenters/3.jsx";
import NsdcCellPresenters from "./components/cellPresenters/nsdc.jsx";
import ForeignCellPresenters from "./components/cellPresenters/foreign.jsx";
import DefaultCellPresenters from "./components/cellPresenters/default.jsx";

// Реєстр презентерів комірок
const cellPresenters = {
    1:  Dataset1CellPresenters,
    3:  Dataset3CellPresenters,
    // Іноземні санкційні датасети
    11: ForeignCellPresenters,
    12: ForeignCellPresenters,
    13: ForeignCellPresenters,
    14: ForeignCellPresenters,
    15: ForeignCellPresenters,
    16: ForeignCellPresenters,
    26: ForeignCellPresenters,
    // NSDC (ДРС)
    20: NsdcCellPresenters,
    21: NsdcCellPresenters,
    22: NsdcCellPresenters,
    23: NsdcCellPresenters,
    24: NsdcCellPresenters,
    25: NsdcCellPresenters,
};

const initialState = {
    search: '',
    searchMethods: [],
    groups: [],
    types: [],
    item_states: [],
    page: 0,
    limit: 50,
}

const columnHelper = createColumnHelper();

// Компонент кнопки додавання до кошика
const AddToBasketButton = ({record}) => {
    const {isInBasket, toggleItem} = useBasket();
    const isAdded = isInBasket(record.datasetId, record.id);

    return (
        <Tooltip content={isAdded ? "Прибрати з вибраного" : "Додати до вибраного"}>
            <Button
                size="sm"
                variant={isAdded ? "filled" : "text"}
                color={isAdded ? "amber" : "blue-gray"}
                className="p-2 rounded-full w-8 h-8 flex items-center justify-center"
                onClick={() => toggleItem(record)}
            >
                <i className={`fa-${isAdded ? 'solid' : 'regular'} fa-star text-sm`}></i>
            </Button>
        </Tooltip>
    );
};

// Компонент кнопки кошика в шапці
const BasketHeaderButton = ({onClick}) => {
    const {items} = useBasket();

    return (
        <div className="flex flex-row gap-x-2">
            <Tooltip content={`Вибрано записів: ${items.length}`}>
                <button
                    className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-2 px-4 rounded-lg border border-amber-500 text-amber-500 hover:opacity-75 focus:ring focus:ring-amber-200 active:opacity-[0.85] flex items-center gap-2 relative overflow-visible"
                    type="button"
                    onClick={onClick}
                >
                    <i className="fa-solid fa-star text-sm"></i>
                    {items.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[18px] text-center">
                            {items.length}
                        </span>
                    )}
                </button>
            </Tooltip>
        </div>
    );
};

const IndexContent = () => {
    const {auth} = usePage().props;
    const [filters, setFilters] = useState(initialState);
    const [sorting, setSorting] = useState([]);
    const [basketDialogOpen, setBasketDialogOpen] = useState(false);

    const {
        open: detailsDialogOpen,
        handleOpen: handleOpenDetailsDialog,
        handleClose: handleCloseDetailsDialog,
        dialogProps: detailsDialogProps
    } = useDialog();

    // Завантаження доступних методів пошуку та датасетів
    const {data: searchOptions = {}} = useQuery({
        queryKey: ['searchOptions'],
        queryFn: async () => {
            try {
                const response = await axios.get("api/consolidated-data/options");
                const data = response.data.data || {};
                return {
                    searchMethods: data.search_methods || [],
                    datasets: data.datasets || [],
                    groups: data.groups || [],
                    types: data.types || [],
                    item_states: data.item_states || []
                };
            } catch (error) {
                console.error('Error fetching search options:', error);
                return {searchMethods: [], datasets: [], types: [], item_states: []};
            }
        },
        staleTime: Infinity,
    });

    // Основний запит для отримання даних
    const {data: searchResults, isFetching: isSearchFetching} = useQuery({
        queryKey: ['consolidated-search', filters],
        queryFn: () => fetchSearchData({...filters, userId: auth?.user?.id}),
        placeholderData: keepPreviousData,
        enabled: !!filters.search,
    });

    // Підготовка даних для таблиці
    const getTableData = () => {
        return searchResults?.data || [];
    };

    // Функція для рендерингу комірки з підтримкою кастомних презентерів
    // Ця функція буде передана в BasketDialog
    const renderCell = (columnId, row, value, customFilters = null) => {
        const datasetId = row.original.datasetId;

        // Шукаємо специфічний презентер для датасету
        let Presenter = cellPresenters[datasetId]?.[columnId];

        // Якщо немає, використовуємо дефолтний для цієї колонки
        if (!Presenter) {
            Presenter = DefaultCellPresenters[columnId] || DefaultCellPresenters.default;
        }

        // Рендеримо
        return <Presenter value={value} row={row} highlightText={highlightText} filters={customFilters || filters} columnId={columnId} />;
    };

    // Колонки таблиці на основі нової структури даних
    const columns = useMemo(() => [
        columnHelper.accessor("datasetId", {
            id: 'datasetId',
            size: loadColumnSizes()?.find(item => item.column === 'datasetId')?.size || 90,
            header: () => 'База',
            cell: info => {
                const datasetId = info.getValue();
                const groupId = info.row.original.groupId;
                const recordId = info.row.original.id;

                const dataset = searchOptions.datasets?.find(d => d.id === datasetId);
                const datasetName = dataset?.caption || `Dataset #${datasetId}`;

                const group = searchOptions.groups?.find(g => g.id === groupId);
                const groupCaption = group?.caption || groupId || datasetName;

                // Колір за станом
                const state = searchOptions.item_states?.find(s => s.dataset_ids?.includes(datasetId));
                const colorClass = state?.color || 'text-blue-600';

                return (
                    <Tooltip content={
                        <div className="text-center">
                            <div className="font-semibold">{groupCaption}</div>
                            <div className="text-xs text-gray-300">{datasetName}</div>
                            <div className="text-xs text-gray-400">ID запису: {recordId}</div>
                        </div>
                    }>
                        <span className={`font-bold ${colorClass} cursor-help`}>{groupCaption}</span>
                    </Tooltip>
                );
            }
        }),

        columnHelper.accessor("typeId", {
            id: 'typeId',
            size: loadColumnSizes()?.find(item => item.column === 'typeId')?.size || 40,
            header: () => 'Тип',
            cell: info => {
                const typeId = info.getValue();
                const type = searchOptions.types?.find(t => t.id === typeId);

                if (type && type.icon) {
                    return (
                        <Tooltip content={type.caption}>
                            <div className="flex items-center justify-center h-full">
                                <i className={`${type.icon} text-sm text-gray-600 dark:text-gray-400`}></i>
                            </div>
                        </Tooltip>
                    );
                }

                return typeId;
            },
        }),

        columnHelper.accessor("methods", {
            id: 'methods',
            size: loadColumnSizes()?.find(item => item.column === 'methods')?.size || 120,
            header: () => 'Методи',
            cell: info => {
                const methods = info.getValue() || [];
                if (methods.length === 0) return null;

                const methodColors = {
                    'meilisearch': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
                    'basic': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
                    'fuzzy': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
                    'ngram': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
                    'phonetic': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700',
                    'transliteration': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700',
                };

                return (
                    <div className="flex flex-col gap-1">
                        {methods.map(method => (
                            <span
                                key={method}
                                className={`w-fit text-[10px] px-1.5 py-0.5 rounded border font-medium ${methodColors[method] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}`}
                            >
                                {method === 'meilisearch' ? 'Meili' : method}
                            </span>
                        ))}
                    </div>
                );
            }
        }),

        columnHelper.accessor("captions", {
            id: 'captions',
            size: loadColumnSizes()?.find(item => item.column === 'captions')?.size || 450,
            header: () => 'Назва/Ім\'я',
            cell: info => renderCell('captions', info.row, info.getValue()),
        }),
        columnHelper.accessor("identifiers", {
            id: 'identifiers',
            size: loadColumnSizes()?.find(item => item.column === 'identifiers')?.size || 300,
            header: () => 'Ідентифікатори',
            cell: info => renderCell('identifiers', info.row, info.getValue()),
        }),
        columnHelper.accessor("decree", {
            id: 'decree',
            size: loadColumnSizes()?.find(item => item.column === 'decree')?.size || 200,
            header: () => 'Указ/Санкції',
            cell: info => renderCell('decree', info.row, info.getValue()),
        }),

        columnHelper.accessor("other", {
            id: 'other',
            size: loadColumnSizes()?.find(item => item.column === 'other')?.size || 200,
            header: () => 'Інше',
            cell: info => renderCell('other', info.row, info.getValue()),
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 100,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({row}) => {
                const datasetId = row.original.datasetId;
                const dataset = searchOptions.datasets?.find(d => d.id === datasetId);
                const datasetName = dataset?.caption || `Dataset #${datasetId}`;

                return (
                    <div className="flex flex-row gap-x-1 p-1 justify-end items-center">
                        <AddToBasketButton record={row.original} />

                        <Tooltip content="Детальна інформація">
                            <Button size="sm" variant="outlined" color="blue"
                                    className="p-2 rounded-full w-8 h-8 flex items-center justify-center"
                                    onClick={() => {
                                        const rec = {
                                            ...row.original.original_data,
                                            dataset_id: datasetId,
                                            dataset_name: datasetName,
                                            typeId: row.original.typeId,
                                            actions: row.original.actions || [],
                                        };
                                        handleOpenDetailsDialog({ record: rec });
                                    }}>
                                <i className="fa-regular fa-circle-info text-sm"></i>
                            </Button>
                        </Tooltip>
                    </div>
                );
            },
        }),
    ], [filters.search, searchOptions.types, searchOptions.datasets, searchOptions.item_states]);

    const hasNonEmptyFilter = () => {
        const {search, groups = [], searchMethods = [], types = [], item_states = []} = filters;
        return (
            search?.trim() !== "" ||
            groups.length > 0 ||
            types.length > 0 ||
            item_states.length > 0 ||
            (searchMethods.length > 0 && searchMethods[0]?.id !== 1)
        );
    };

    // Встановлення Basic методу за замовчуванням
    useEffect(() => {
        if (searchOptions.searchMethods && searchOptions.searchMethods.length > 0 && filters.searchMethods.length === 0) {
            const basicMethod = searchOptions.searchMethods.find(method => method.id === 1);
            if (basicMethod) {
                setFilters(prev => ({...prev, searchMethods: [basicMethod]}));
            }
        }
    }, [searchOptions.searchMethods]);

    // Збереження/завантаження фільтрів
    useEffect(() => {
        const storedFilters = localStorage.getItem(`${location.pathname}-filters`);
        if (storedFilters) {
            try {
                setFilters({...initialState, ...JSON.parse(storedFilters)});
            } catch (error) {
                console.error('Error parsing stored filters:', error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
    }, [filters]);

    const handlePageChange = (pageNumber) => {
        setFilters(prevState => ({...prevState, page: pageNumber - 1}));
    }

    const handleLimit = (value) => {
        setFilters(prevState => ({...prevState, page: 0, limit: value}));
    }

    const handleChangeOptions = (key = '') => (newSelectedIds) => {
        setFilters(prevState => ({...prevState, page: 0, [key]: newSelectedIds || []}));
    };

    const handleChangeInput = (event) => {
        setFilters(prevState => ({...prevState, search: event.target.value}));
    }

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

    const handleClearFilters = () => {
        const basicMethod = searchOptions.searchMethods?.find(method => method.id === 1);
        setFilters({
            search: '',
            searchMethods: basicMethod ? [basicMethod] : [],
            groups: [],
            types: [],
            item_states: [],
            page: 0,
            limit: filters.limit
        });
    }

    const handleRowClick = (row) => {
        // Перевіряємо, чи виділено якийсь текст
        if (window.getSelection().toString().length > 0) {
            return; // Якщо текст виділено, не відкриваємо діалог
        }

        const datasetId = row.original.datasetId;
        const dataset = searchOptions.datasets?.find(d => d.id === datasetId);
        const datasetName = dataset?.caption || `Dataset #${datasetId}`;

        const rec = {
            ...row.original.original_data,
            dataset_id: datasetId,
            dataset_name: datasetName,
            typeId: row.original.typeId,
            actions: row.original.actions || [],
        };
        handleOpenDetailsDialog({ record: rec });
    };

    return (
        <Page>
            <div data-i-doc="page:advanced-search" className="mt-2 mx-2">
                <CollapsibleSection
                    title="Фільтри"
                    showHiddenAppliedBadge
                    className="mb-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-md dark:border-gray-700 dark:bg-gray-900/60 sm:p-4"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="min-w-0" data-filter-active={filters?.search?.trim() ? "true" : "false"}>
                            <AdvancedSearchInput size="xs" name="search" value={filters.search} label="Пошук"
                                                 onChange={handleChangeInput}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.types?.length ? "true" : "false"}>
                            <AdvancedSelectWithDefaults
                                size="xs"
                                isMulti
                                options={searchOptions.types || []}
                                label="Типи суб'єктів"
                                id="types"
                                selectedOptions={filters.types}
                                onChange={handleChangeOptions('types')}
                            />
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.item_states?.length ? "true" : "false"}>
                            <AdvancedSelectWithDefaults
                                size="xs"
                                isMulti
                                options={searchOptions.item_states || []}
                                label="Стан"
                                id="item_states"
                                selectedOptions={filters.item_states}
                                onChange={handleChangeOptions('item_states')}
                            />
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.searchMethods?.length > 0 ? "true" : "false"}>
                            <AdvancedSelectWithDefaults
                                size="xs"
                                isMulti
                                options={searchOptions.searchMethods || []}
                                label="Методи пошуку"
                                id="searchMethods"
                                selectedOptions={filters.searchMethods}
                                onChange={handleChangeOptions('searchMethods')}
                            />
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.groups?.length ? "true" : "false"}>
                            <AdvancedSelectWithDefaults
                                size="xs"
                                isMulti
                                options={searchOptions.groups || []}
                                label="Бази даних"
                                id="groups"
                                selectedOptions={filters.groups}
                                onChange={handleChangeOptions('groups')}
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            <Tooltip content="Скинути фільтри">
                                <Button
                                    size="sm"
                                    className="h-9 px-3"
                                    disabled={!hasNonEmptyFilter()}
                                    onClick={handleClearFilters}>
                                    <i className="fa-regular fa-filter-slash mr-1"></i>
                                    Скинути
                                </Button>
                            </Tooltip>
                            <BasketHeaderButton onClick={() => setBasketDialogOpen(true)} />
                        </div>
                    </div>
                </CollapsibleSection>
            </div>

            <div className="mt-6 mx-2 mb-10">
                <Table
                    textSize="xs"
                    loading={isSearchFetching}
                    canChangeResize
                    canChangeVisibility
                    pagination={{
                        onLimitChange: handleLimit,
                        onPageChange: handlePageChange,
                        currentPage: searchResults?.page || 0,
                        pageSize: searchResults?.limit || filters.limit,
                        totalCount: searchResults?.total || 0,
                    }}
                    data={getTableData()}
                    columns={columns}
                    onSort={handleSortModel}
                    onClick={handleRowClick} // Змінено з onDoubleClick на onClick
                />
            </div>

            {detailsDialogOpen &&
                <DetailsDialog open={detailsDialogOpen}
                               record={detailsDialogProps?.record}
                               onClose={handleCloseDetailsDialog}
                />
            }

            {basketDialogOpen &&
                <BasketDialog
                    open={basketDialogOpen}
                    onClose={() => setBasketDialogOpen(false)}
                    renderCell={renderCell} // Передаємо функцію рендерингу
                />
            }
        </Page>
    );
};

// Обгортка з провайдерами
const Index = () => {
    return (
        <DictionaryProvider>
            <BasketProvider>
                <IndexContent />
            </BasketProvider>
        </DictionaryProvider>
    );
};

export default Index;
