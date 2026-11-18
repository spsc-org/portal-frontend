import {createColumnHelper, flexRender, getCoreRowModel, useReactTable,} from "@tanstack/react-table";
import {Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import Pagination from "./Pagination.jsx";
import {IndeterminateCheckbox} from "./IndeterminateCheckbox.jsx";
import { Spinner, Tooltip } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../Modal/Modal.jsx"
import Button from "../Buttons/Button.jsx"
import PinnedRow from "./PinnedRow.jsx";
import ColumnHeader from "./ColumnHeader.jsx";
import {TABLE, TABLE_WRAP, TD, TD_EMPTY, TR, TR_MUTED, TR_SELECTED} from "./tableStyles.js";

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
    const [uncontrolledSelection, setUncontrolledSelection] = useState({});
    const isSelectionControlled = rowSelectionProp !== undefined;
    const rowSelection = isSelectionControlled ? rowSelectionProp : uncontrolledSelection;

    useEffect(() => {
        const storedColumns = localStorage.getItem(`${location.pathname}-columns`);
        if (storedColumns) {
            setColumnVisibility(JSON.parse(storedColumns));
        }
    }, []);


    // Зміну ширини колонок прибрано — чистимо збережені раніше ширини сторінки
    useEffect(() => {
        localStorage.removeItem(`${location.pathname}-column-size`);
    }, []);

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
        enableColumnResizing: false,
        getCoreRowModel: getCoreRowModel(),
        debugTable: false,
        debugHeaders: false,
        debugColumns: false,
    })

    const toggleModal = () => {
        setIsOpen(!isOpen);
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
                    {canChangeVisibility && <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-800">
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
                    </div>}
                </div>
                <div className={`${TABLE_WRAP} mb-5`}>
                    <table ref={tableRef} className={`${TABLE} table-auto text-${textSize === "sm" ? "xs" : textSize}`}>
                        <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <ColumnHeader key={header.id} header={header}/>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody>
                        {table.getTopRows().map(row => (
                            <PinnedRow key={row.id} row={row} table={table}/>
                        ))}
                        {
                            loading ?
                                <tr>
                                    <td colSpan={table.getVisibleLeafColumns().length}
                                        className={TD_EMPTY}>
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
                                                className={`${TR} ${(selectedRowId != null && row?.original?.id === selectedRowId) ? TR_SELECTED : (row?.original?.deletedAt || row?.original?.deleted_at) ? TR_MUTED : ""} ${row.original?.isPinned ? "hidden" : ""} ${(onDoubleClick || onRowClick) ? "cursor-pointer" : ""}`}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td className={TD}
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
                                    <tr>
                                        <td colSpan={table.getVisibleLeafColumns().length} className={TD_EMPTY}>
                                            Відсутні записи
                                        </td>
                                    </tr>
                        }
                        </tbody>
                        <tfoot>
                        {
                            canSelect ?
                                <tr className="bg-gray-50 dark:bg-neutral-900/40">
                                    <td className={`${TD} border-b-0 py-2`}>
                                        <IndeterminateCheckbox
                                            {...{
                                                checked: table.getIsAllPageRowsSelected(),
                                                indeterminate: table.getIsSomePageRowsSelected(),
                                                onChange: table.getToggleAllPageRowsSelectedHandler(),
                                            }}
                                        />
                                    </td>
                                    <td colSpan={columns.length} className={`${TD} border-b-0 py-2 text-gray-600 dark:text-gray-400`}>Рядків обрано
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
            <Modal open={isOpen} size="xs" handler={toggleModal}>
                <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">Оберіть стовпці, які будуть відображатись</h3>
            </ModalHeader>
                <ModalBody className="overflow-y-auto">
                    <div>
                        <div className="px-1 pb-1 border-b border-gray-200 dark:border-neutral-700">
                            <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                                <input
                                    className="cursor-pointer h-4 w-4 rounded text-blue-600 focus:ring-blue-300"
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
                                    <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <input
                                            className="cursor-pointer h-4 w-4 rounded text-blue-600 focus:ring-blue-300"
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
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary"
                        onClick={toggleModal}>
                        <span>Закрити</span>
                    </Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default Table;
