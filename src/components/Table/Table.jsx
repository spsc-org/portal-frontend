import {createColumnHelper, flexRender, getCoreRowModel, useReactTable,} from "@tanstack/react-table";
import "./index.css"
import {Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import Pagination from "./Pagination.jsx";
import {IndeterminateCheckbox} from "./IndeterminateCheckbox.jsx";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Tooltip} from "@material-tailwind/react";
import PinnedRow from "./PinnedRow.jsx";

const uniqueObjectsArray = (array, object) => {
    if (!Array.isArray(array) || Object.keys(object).length === 0) return array;
    const index = array.findIndex(item => item.column === object.column);
    if (index !== -1) {
        array[index] = object;
    } else {
        array.push(object);
    }
    return Array.from(new Map(array.map(item => [item.column, item])).values());
}


export const loadColumnSizes = () => {
    const savedSizes = localStorage.getItem(`${location.pathname}-column-size`);
    return savedSizes ? JSON.parse(savedSizes) : [];
};

const saveColumnSizes = (sizes) => {
    localStorage.setItem(`${location.pathname}-column-size`, JSON.stringify(sizes));
};

const columnHelper = createColumnHelper();


const Table = ({
                   data = [],
                   columns,
                   pagination = {},
                   onDoubleClick,
                   onRowClick,
                   canChangeVisibility = false,
                   onSort,
                   onSelectRow,
                   onRowPinning,
                   canSelect = false,
                   // Контрольований selection (id→bool); без пропа — внутрішній state
                   rowSelection: rowSelectionProp,
                   // (row) => bool — додатковий фільтр вибору рядка (напр. не deleted)
                   rowSelectable,
                   canPin = false,
                   loading = false,
                   textSize = 'sm',
                   canChangeResize = false,
                   // Початковий стан сортування (напр. відновлений з localStorage) —
                   // читається один раз при монтуванні
                   initialSorting = [],
                   // id рядка (row.original.id), який підсвічується як вибраний —
                   // для master-detail сторінок з панеллю деталей
                   selectedRowId,
               }) => {
    const [rowPinning, setRowPinning] = useState({
        top: [],
        bottom: []
    });
    const [pinnedRows, setPinnedRows] = useState([]);
    const {
        onLimitChange = () => {
        },
        onPageChange = () => {
        },
        currentPage = 0,
        pageSize = 10,
        totalCount = 0
    } = pagination;

    const tableRef = useRef(null);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sorting, setSorting] = useState(initialSorting);
    const [columnSizingInfo, setColumnSizingInfo] = useState({});
    const [uncontrolledSelection, setUncontrolledSelection] = useState({});
    const isSelectionControlled = rowSelectionProp !== undefined;
    const rowSelection = isSelectionControlled ? rowSelectionProp : uncontrolledSelection;

    useEffect(() => {
        const storedColumns = localStorage.getItem(`${location.pathname}-columns`);
        if (storedColumns) {
            setColumnVisibility(JSON.parse(storedColumns));
        }
    }, []);

    useEffect(() => {
        if (columnSizingInfo?.startSize && columnSizingInfo.deltaOffset && columnSizingInfo?.isResizingColumn) {
            const newSize = columnSizingInfo.startSize + (columnSizingInfo.deltaOffset);
            const colObj = {
                size: newSize,
                column: columnSizingInfo?.isResizingColumn
            }
            const colSizes = loadColumnSizes();
            saveColumnSizes(uniqueObjectsArray(colSizes, colObj))
        }
    }, [columnSizingInfo])

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-columns`, JSON.stringify(columnVisibility));
    }, [columnVisibility]);

    const columnAccessor = useMemo(() => {
        if (canSelect) {
            return [
                columnHelper.accessor('select', {
                    id: 'select',
                    size: 10,
                    maxSize: 10,
                    enableResizing: false,
                    header: (props) => {
                        return (
                            <IndeterminateCheckbox
                                {...{
                                    checked: props?.table?.getIsAllRowsSelected(),
                                    indeterminate: props?.table?.getIsSomeRowsSelected(),
                                    onChange: props?.table?.getToggleAllRowsSelectedHandler(),
                                }}
                            />
                        );
                    },
                    cell: ({row}) => (
                        <div className="px-1">
                            <IndeterminateCheckbox
                                {...{
                                    checked: row?.getIsSelected(),
                                    disabled: !row?.getCanSelect(),
                                    indeterminate: row?.getIsSomeSelected(),
                                    onChange: row?.getToggleSelectedHandler(),
                                }}
                            />
                        </div>
                    ),
                }), ...columns
            ]
        }
        if (canPin) {
            return [
                columnHelper.accessor('pin', {
                    id: 'pin',
                    size: 30,
                    maxSize: 30,
                    enableSorting: false,
                    enableResizing: false,
                    header: () => "",
                    cell: ({row}) => {
                        const isPinned = row.getIsPinned() === 'top';
                        return (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isPinned) {
                                        setRowPinning(prev => {
                                            const result = prev.top.filter(id => id !== row.id);
                                            onRowPinning(result);
                                            return ({
                                                ...prev,
                                                top: result
                                            });
                                        });
                                        setPinnedRows((prev) => prev.filter((pinned) => pinned.id !== row.id));
                                    } else {
                                        setRowPinning(prev => {
                                            const result = [...prev.top, row.id];
                                            onRowPinning(result)

                                            return ({
                                                ...prev,
                                                top: result
                                            });
                                        });
                                        setPinnedRows((prev) => {
                                            if (!prev.find((pinned) => pinned.id === row.id)) {
                                                return [...prev, {...row.original}];
                                            }
                                            return prev;
                                        });

                                    }
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                {isPinned ? <Tooltip content="Відкріпити"><i
                                        className="fa-solid fa-thumbtack rotate-45 p-1"></i></Tooltip> :
                                    <Tooltip content="Закріпити"><i
                                        className="fa-regular fa-thumbtack p-1"></i></Tooltip>}
                            </button>
                        );
                    }

                }), ...columns
            ]
        }
        return columns
    }, [canSelect, canPin, columns]);

    const [isOpen, setIsOpen] = useState(false);


    const tableData = useMemo(() => {
        const pinnedData = pinnedRows.map(row => ({
            ...row,
            isPinned: true
        }));

        const unpinnedData = (Array.isArray(data) ? data : []).filter(
            row => !pinnedRows.some(pinned => pinned.id === row.id)
        ).map(row => ({
            ...row,
            isPinned: false,
        }));

        return [...pinnedData, ...unpinnedData];
    }, [data, pinnedRows]);

    const table = useReactTable({
        data: tableData,
        columns: columnAccessor,
        state: {
            rowPinning,
            rowSelection,
            columnVisibility,
            sorting,
            columnSizingInfo,
        },

        enableRowSelection: canSelect
            ? (row) => (typeof rowSelectable === 'function' ? rowSelectable(row) : true)
            : false,
        enableRowPinning: canPin,
        defaultColumn: {
            minSize: 80,
        },
        getRowId: row => row.id,
        onSortingChange: (model) => {
            onSort(model);
            setSorting(model);
        },
        onRowSelectionChange: (updater) => {
            const prev = isSelectionControlled ? (rowSelectionProp || {}) : uncontrolledSelection;
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (!isSelectionControlled) {
                setUncontrolledSelection(next);
            }
            onSelectRow?.(next);
        },
        onColumnVisibilityChange: setColumnVisibility,
        onColumnSizingInfoChange: setColumnSizingInfo,
        columnResizeMode: 'onChange',
        columnResizeDirection: 'ltr',
        getCoreRowModel: getCoreRowModel(),
        debugTable: false,
        debugHeaders: false,
        debugColumns: false,
    })

    const toggleModal = () => {
        setIsOpen(!isOpen);
    }

    const handleResetColumnSize = () => {
        localStorage.removeItem(`${location.pathname}-column-size`);
        table.resetColumnSizing(true)
    }

    useLayoutEffect(() => {
        if (data.length && tableRef.current) {
            const rows = tableRef.current.querySelectorAll("tr[data-updated='true']");
            rows.forEach((row) => {
                const id = row.getAttribute("data-id");
                if (id) {
                    row.classList.add("animate-highlight");
                    row.classList.add("dark:animate-darkHighlight");
                    setTimeout(() => {
                        row.classList.remove("animate-highlight")
                        row.classList.remove("dark:animate-darkHighlight")
                    }, 3000);
                }
            });
        }
    }, [data, tableRef]);
    return (
        <Fragment>
            <div>
                <div className="mb-2 flex justify-between flex-row ">
                    <Pagination onLimitChange={onLimitChange} onPageChange={onPageChange} currentPage={currentPage + 1}
                                pageSize={pageSize}
                                totalCount={totalCount}/>
                    <div className="flex shadow-md items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900/60">
                        {
                            canChangeResize &&
                            <Tooltip content="Скинути ширину стовців">
                                <button
                                    type="button"
                                    aria-label="Скинути ширину стовців"
                                    disabled={!loadColumnSizes().length}
                                    onClick={handleResetColumnSize}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:bg-gray-700"
                                >
                                    <i className="fa-solid fa-arrows-up-down-left-right text-xs"></i>
                                </button>
                            </Tooltip>
                        }
                        {
                            canChangeVisibility &&
                            <Tooltip content="Налаштувати видимість стовпців">
                                <button
                                    type="button"
                                    aria-label="Налаштувати видимість стовпців"
                                    onClick={toggleModal}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-500 bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-400 dark:bg-blue-500 dark:text-gray-900 dark:hover:bg-blue-400"
                                >
                                    <i className="fa-regular fa-eye text-xs"></i>
                                </button>
                            </Tooltip>
                        }
                    </div>
                </div>
                <div
                    className={`max-w-full shadow-md  sm:rounded-lg bg-white dark:bg-gray-800 mb-5 text-${textSize}`}>
                    <table ref={tableRef} className="table-auto  w-full text-left text-gray-500 dark:text-gray-400">
                        <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <th
                                            className={`px-1 py-0.5 sticky top-0 z-1 text-gray-800 font-normal  bg-gray-200 dark:bg-gray-700 dark:text-gray-400`}
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            style={{width: header.getSize()}}
                                        >
                                            {header.column?.id !== 'select' &&
                                                <span title={
                                                    header.column.getCanSort()
                                                        ? header.column.getNextSortingOrder() === 'asc'
                                                            ? 'Sort ascending'
                                                            : header.column.getNextSortingOrder() === 'desc'
                                                                ? 'Sort descending'
                                                                : 'Clear sort'
                                                        : undefined
                                                } onClick={header.column.getToggleSortingHandler()}
                                                      className={`${header.column.getCanSort() ? 'cursor-pointer mr-1 ' : ''}`}>
                                                {
                                                    header.column.getCanSort() ?
                                                        {
                                                            asc: <i className="fa-regular fa-arrow-up"></i>,
                                                            desc: <i className="fa-regular fa-arrow-down"></i>,
                                                        }[header.column.getIsSorted()] ??
                                                        <i className="fa-regular fa-arrow-down-arrow-up"></i> : null
                                                }
                                                </span>
                                            }

                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                            {header.column.getCanResize() && (
                                                <div
                                                    title="Змінити ширину стовпця"
                                                    onMouseDown={header.getResizeHandler()}
                                                    onMouseUp={header.getResizeHandler()}
                                                    className={`resizer  ${
                                                        header.column.getIsResizing() ? 'isResizing' : ''
                                                    } ${header.column.getCanSort()} && 'cursor-pointer`}
                                                ></div>
                                            )}
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                        {table.getTopRows().map(row => (
                            <PinnedRow key={row.id} row={row} table={table}/>
                        ))}
                        {
                            loading ?
                                <tr className="bg-white text-center dark:bg-gray-900 border-b dark:border-gray-700">
                                    <td colSpan={columns.length}
                                        className="py-1 text-gray-700 dark:text-slate-400">
                                        <span className="inline-flex justify-center items-center py-10">
                                            <Spinner className="h-12 w-12"/>
                                        </span>
                                    </td>
                                </tr>
                                :
                                table.getRowModel().rows.length ?
                                    table.getRowModel().rows.map(row => {
                                        return (
                                            <tr key={row.id}
                                                data-id={row.id}
                                                data-updated={row?.original?.isUpdated}
                                                className={`${(selectedRowId != null && row?.original?.id === selectedRowId) ? 'bg-blue-100/80 dark:bg-blue-900/40' : (row?.original?.deletedAt || row?.original?.deleted_at) ? 'bg-gray-200 dark:bg-gray-800' : 'bg-neutral-100 dark:bg-gray-900'} ${row.original?.isPinned && "hidden"} hover:bg-neutral-200 dark:hover:bg-neutral-700 ${(onDoubleClick || onRowClick) ? 'cursor-pointer' : ''}`}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td className="text-gray-700 dark:text-slate-400 font-mono"
                                                        key={cell.id}
                                                        {...{
                                                            style: {
                                                                width: cell.column.getSize(),
                                                            },
                                                        }}
                                                        onClick={(event) => {
                                                            if (onRowClick && cell.column.id !== "actions") {
                                                                clearTimeout(event.currentTarget._clickTimer);
                                                                event.currentTarget._clickTimer = setTimeout(() => {
                                                                    onRowClick(row);
                                                                }, 220);
                                                            }
                                                        }}
                                                        onDoubleClick={(event) => {
                                                            clearTimeout(event.currentTarget._clickTimer);
                                                            if (onDoubleClick && cell.column.id !== "actions") {
                                                                onDoubleClick(row);
                                                            }
                                                            event.preventDefault();
                                                        }}
                                                    >
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })
                                    :
                                    <tr className="odd:bg-white text-center odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                        <td colSpan={columns.length}
                                            className="py-2 text-lg  font-medium text-gray-700 dark:text-slate-400">Відсутні
                                            записи
                                        </td>
                                    </tr>
                        }
                        </tbody>
                        <tfoot className="border border-t border-gray-200 dark:border-gray-700">
                        {
                            canSelect ?
                                <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                    <td className="p-2 font-medium text-gray-700 dark:text-slate-400">
                                        <IndeterminateCheckbox
                                            {...{
                                                checked: table.getIsAllPageRowsSelected(),
                                                indeterminate: table.getIsSomePageRowsSelected(),
                                                onChange: table.getToggleAllPageRowsSelectedHandler(),
                                            }}
                                        />
                                    </td>
                                    <td colSpan={columns.length}>Рядків обрано
                                        ({table.getSelectedRowModel().rows.length})
                                    </td>
                                </tr> : null
                        }
                        </tfoot>
                    </table>
                </div>
                <Pagination onLimitChange={onLimitChange} onPageChange={onPageChange} currentPage={currentPage + 1}
                            pageSize={pageSize}
                            totalCount={totalCount}/>
            </div>
            <Dialog open={isOpen} size="xs" handler={toggleModal}>
                <DialogHeader>Оберіть стовпці, які будуть відображатись</DialogHeader>
                <DialogBody className="overflow-y-auto">
                    <div>
                        <div className="px-1 pb-1 border-b border-solid border-blueGray-200 dark:border-black ">
                            <label className="cursor-pointer text-slate-500 dark:text-slate-400">
                                <input
                                    className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                                    {...{
                                        type: 'checkbox',
                                        checked: table.getIsAllColumnsVisible(),
                                        onChange: table.getToggleAllColumnsVisibilityHandler(),
                                    }}
                                />{' '}
                                Всі
                            </label>
                        </div>
                        {table.getAllLeafColumns().map(column => {
                            if (column.id === 'select') return;
                            return (
                                <div key={column.id} className="px-1 py-1">
                                    <label className="cursor-pointer text-slate-500 dark:text-slate-400">
                                        <input
                                            className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                                            {...{
                                                type: 'checkbox',
                                                checked: column.getIsVisible(),
                                                onChange: column.getToggleVisibilityHandler(),
                                            }}
                                        />{' '}
                                        {typeof column.columnDef.header === 'function' ? column.columnDef.header() : column.columnDef.header}
                                    </label>
                                </div>
                            )
                        })}
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        color="gray"
                        onClick={toggleModal}
                    >
                        <span>Закрити</span>
                    </Button>
                </DialogFooter>
            </Dialog>
        </Fragment>
    );
};

export default Table;
