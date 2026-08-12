import {Popover, PopoverContent, PopoverHandler, Tooltip, Typography} from "@material-tailwind/react";
import {createColumnHelper, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Fragment, useMemo} from "react";


const columnHelper = createColumnHelper()
const TableValidation = ({data = [], headers = [], validation = null, warnings = null, duplicate = null}) => {
    const columns = useMemo(() => {
            const mergeStartIndex = 22;
            const mergeEndIndex = 52;
            const regularColumns = headers
                .map((name, index) => {
                    if (index >= mergeStartIndex && index <= mergeEndIndex) {
                        return null;
                    }
                    return columnHelper.accessor(index.toString(), {
                        header: name,
                        footer: name,
                        cell: info => <TableCell {...info} validation={validation} warnings={warnings}/>
                    });
                })
                .filter(Boolean);

            const mergedColumn = columnHelper.accessor('merged_22_52', {
                header: 'Обмеження',
                footer: 'Обмеження',
                cell: info => {
                    const rowData = info.row.original;
                    const mergedIndices = [];
                    for (let i = mergeStartIndex; i <= mergeEndIndex; i++) {
                        if (rowData[i] === "1") {
                            mergedIndices.push({
                                original: `[${headers[i]}]`
                            });
                        }
                    }
                    return <TableCell {...info} validation={validation} warnings={warnings} value={mergedIndices}/>;
                }
            });

            regularColumns.splice(mergeStartIndex, 0, mergedColumn);

            return regularColumns;
        },
        [data, validation, warnings, duplicate, headers]);

    const table = useReactTable({
        data,
        columns,
        getRowId: (_, rowIndex) => rowIndex,
        getCoreRowModel: getCoreRowModel(),
    });


    return Boolean(data.length) && (
        <Fragment>
            <div className="inline-flex gap-x-2 items-center mb-5">
                <Typography variant="h6">
                    {
                        Boolean(validation) ?
                            <>
                                <i className="fa-regular fa-triangle-exclamation text-red-500 mr-1"></i>
                                <span className="dark:text-slate-200">Неможливо додати через помилки валідації! Виправте файл та завантажте знову.</span>
                            </>
                            : <>
                                <i className="fa-regular fa-circle-check text-green-600 mr-1"></i>
                                <span className="dark:text-slate-200">Перевірки пройшли успішно!</span>
                            </>
                    }

                </Typography>
            </div>
            <div className="mb-0.5 flex justify-end gap-x-2">
                <p className="text-xs">
                    <i className="fa-regular fa-message-exclamation text-yellow-500 mr-1"></i>
                    <span className="dark:text-slate-200">Попередження.</span>
                </p>
                <p className="text-xs">
                    <i className="fa-regular fa-triangle-exclamation text-red-500 mr-1"></i>
                    <span className="dark:text-slate-200">Помилки валідації.</span>
                </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white text-[11px] shadow-sm dark:border-gray-700/60 dark:bg-gray-800 sm:text-xs">
                <div className="max-h-[60vh] overflow-auto">
                    <table
                        className="min-w-[1100px] w-full border-collapse text-left text-gray-600 dark:text-gray-300">
                    <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id}
                                    className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 px-1.5 py-1 font-medium text-gray-800 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-700/80 dark:text-gray-200">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>
                    <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="odd:bg-slate-50/60 hover:bg-blue-50/40 dark:odd:bg-gray-900/30 dark:hover:bg-blue-900/20">
                            {row.getVisibleCells().map(cell => (
                                <Fragment key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </Fragment>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                    <tfoot>
                    {table.getFooterGroups().map(footerGroup => (
                        <tr key={footerGroup.id}>
                            {footerGroup.headers.map(header => (
                                <th key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.footer,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                    </tfoot>
                    </table>
                </div>
            </div>
        </Fragment>

    );
};

export default TableValidation;

const ValidationTooltip = ({message, icon, color, children}) => (
    <Tooltip
        className="bg-white shadow-md dark:bg-gray-600 relative"
        content={
            <Typography color="white" className="font-normal text-xs text-slate-600 dark:text-slate-200">
                <i className={`fa-regular ${icon} ${color} mr-1`}></i>
                <span>{message}</span>
                <span
                    className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-[12px] border-t-white dark:border-t-gray-600 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent"/>
            </Typography>
        }
        placement="top"
    >
        {children}
    </Tooltip>
);

const CellContent = ({value}) => {
    if (Array.isArray(value)){
        return value.map((item, index) => (
            <span
                key={index}
                className={`inline-flex m-[1px] w-fit p-[1px] rounded-md bg-blue-100 dark:bg-blue-900`}
            >
          {item?.original || item}
        </span>));
    }
    if (typeof value === "string" && value.includes(";")) {
        return value
            .trim()
            .split(";")
            .filter(Boolean)
            .map((item, index) => (
                <span
                    key={index}
                    className={`inline-flex m-[1px] w-fit p-[1px] rounded-md bg-blue-100 dark:bg-blue-900`}
                >
          {item}
        </span>
            ));
    }
    return value;
};

const TableCell = ({validation, warnings, value, ...props}) => {
    const resolveMessages = (source, rowIndex, columnId) => {
        const mergedMatch = /^merged_(\d+)_(\d+)$/.exec(columnId);
        if (!mergedMatch) {
            const key = `${rowIndex}.${columnId}`;
            return source?.[key] ? [source[key]] : [];
        }
        const start = Number(mergedMatch[1]);
        const end = Number(mergedMatch[2]);
        const messages = [];
        for (let i = start; i <= end; i++) {
            const key = `${rowIndex}.${i}`;
            if (source?.[key]) {
                messages.push(source[key]);
            }
        }
        return messages;
    };

    const validationMessages = resolveMessages(validation, props.row.index, props.cell.column.id);
    const warningMessages = validationMessages.length
        ? []
        : resolveMessages(warnings, props.row.index, props.cell.column.id);
    const findValidation = validationMessages.length ? validationMessages.join("; ") : null;
    const findWarning = warningMessages.length ? warningMessages.join("; ") : null;
    const columnIndex = parseInt(props.cell.column.id, 10); // Індекс колонки


    const getStateClasses = () => {
        if (findValidation) return "border-red-500 bg-red-50 dark:bg-danger-900/50";
        if (findWarning) return "border-yellow-500 bg-yellow-50 dark:bg-amber-950/50";
        return "border-slate-300";
    };

    // Обрізання тексту
    const rawValue = value !== undefined ? value : props.getValue();
    const isLongText = typeof rawValue === "string" && rawValue.length > 80;
    const displayText = isLongText ? `${rawValue.slice(0, 80)}...` : rawValue;

    const cellContent = (
        <CellContent
            value={displayText}
        />
    );

    const cell = (
        <td
            className={`border border-slate-200 px-1.5 py-0.5 leading-tight ${getStateClasses()} min-w-[30px] align-top relative dark:border-gray-700`}
        >
            {(columnIndex === 18 || columnIndex === 51 || columnIndex === 52) && isLongText ? (
                <Popover>
                    <PopoverHandler>
                        <span className="inline-flex w-full cursor-pointer max-w-[150px] hover:underline">{cellContent}</span>
                    </PopoverHandler>
                    <PopoverContent
                        className="bg-white dark:bg-gray-800 shadow-md max-w-lg max-h-80 overflow-auto font-normal text-xs text-slate-600 dark:text-slate-200">
                        {rawValue}
                    </PopoverContent>
                </Popover>

            ) : (
                <span className="w-full max-w-[150px]">
                    <CellContent
                        value={rawValue}
                    />
                </span>
            )}
            {(findValidation || findWarning) && (
                <span
                    className={`absolute top-0 right-0 w-0 h-0 border-r-[8px] border-b-[8px] border-transparent ${
                        findValidation ? "border-r-red-500" : "border-r-yellow-500"
                    }`}
                />
            )}
        </td>
    );

    if (findValidation) {
        return (
            <ValidationTooltip
                message={findValidation}
                icon="fa-triangle-exclamation"
                color="text-red-500"
            >
                {cell}
            </ValidationTooltip>
        );
    }

    if (findWarning) {
        return (
            <ValidationTooltip
                message={findWarning}
                icon="fa-message-exclamation"
                color="text-yellow-500"
            >
                {cell}
            </ValidationTooltip>
        );
    }

    return cell;
};
