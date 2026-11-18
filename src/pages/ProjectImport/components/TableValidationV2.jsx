import {Tooltip, Typography} from "@material-tailwind/react";
import {createColumnHelper, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Fragment, useMemo} from "react";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH } from "../../../components/Table/tableStyles.js";


const columnHelper = createColumnHelper()
const TableValidationV2 = ({data = [], headers = [], validation = null, warnings = null, info = null, duplicate = null,}) => {
    const columns = useMemo(() => {
          return headers
                .map((name, index) => {
                    return columnHelper.accessor(index.toString(), {
                        header: name,
                        footer: name,
                        cell: cellInfo => <TableCell {...cellInfo} validation={validation} warnings={warnings} info={info}/>
                    });
                })
        },
        [data, validation, warnings, info, duplicate, headers]);

    const table = useReactTable({
        data,
        columns,
        getRowId: (_, rowIndex) => rowIndex,
        getCoreRowModel: getCoreRowModel(),
    });


    return Boolean(headers.length) && (
        <Fragment>
            <div className="inline-flex gap-x-2 items-center ">
                <Typography variant="h6">
                    {
                        validation ?
                            <>
                                <i className="fa-regular fa-triangle-exclamation text-red-500 mr-1"></i>
                                <span className="dark:text-gray-200">Неможливо додати через помилки валідації! Виправте файл та завантажте знову.</span>
                            </>
                            : !data.length ?
                                <>
                                    <i className="fa-regular fa-circle-info text-blue-500 mr-1"></i>
                                    <span className="dark:text-gray-200">Файл пустий, або містить невідповідні значення.</span>
                                </>
                                : <>
                                    <i className="fa-regular fa-circle-check text-green-600 mr-1"></i>
                                    <span className="dark:text-gray-200">Перевірки пройшли успішно!</span>
                                </>
                    }

                </Typography>
            </div>
            <div className="mb-0.5 flex justify-end gap-x-2">
                <p className="text-xs text-gray-600 dark:text-gray-200">
                    <i className="fa-regular fa-message-exclamation text-yellow-500 mr-1"></i>
                    <span>Попередження.</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-200">
                    <i className="fa-regular fa-circle-info text-blue-500 mr-1"></i>
                    <span>Інформація.</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-200">
                    <i className="fa-regular fa-triangle-exclamation text-red-500 mr-1"></i>
                    <span>Помилки валідації.</span>
                </p>
            </div>
            <div className="rounded border border-gray-300 bg-gray-100 text-[10px] shadow-sm dark:border-neutral-700 dark:bg-neutral-700 sm:text-[11px]">
                <div className={twMerge(TABLE_WRAP, "max-h-[68vh] overflow-auto")}>
                    <table
                        className={twMerge(TABLE, "min-w-[980px] w-full text-left")}>
                    <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id}
                                    className={twMerge(TH, "sticky top-0 z-10")}>
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
                        <tr key={row.id}>
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
                                <th className={TH} key={header.id}>
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

export default TableValidationV2;

const ValidationTooltip = ({message, icon, color, children}) => (
    <Tooltip
        className="bg-gray-100 shadow-md dark:bg-neutral-500 relative border border-gray-300 dark:border-neutral-700"
        content={
            <Typography color="white" className="font-normal text-xs text-gray-600 dark:text-gray-200">
                <i className={`fa-regular ${icon} ${color} mr-1`}></i>
                <span>{message}</span>
                <span
                    className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-[12px] border-t-gray-100 dark:border-t-gray-600 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent"/>
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
                className="inline-flex m-[1px] w-fit rounded-sm bg-gray-300 px-1 py-0.5 text-[10px] text-gray-800 dark:bg-neutral-600 dark:text-gray-200"
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
                    className="inline-flex m-[1px] w-fit rounded-sm bg-gray-300 px-1 py-0.5 text-[10px] text-gray-800 dark:bg-neutral-600 dark:text-gray-200"
                >
          {item}
        </span>
            ));
    }
    return value;
};

const TableCell = ({validation, warnings, info, value, ...props}) => {
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
    const infoMessages = (validationMessages.length || warningMessages.length)
        ? []
        : resolveMessages(info, props.row.index, props.cell.column.id);
    const findValidation = validationMessages.length ? validationMessages.join("; ") : null;
    const findWarning = warningMessages.length ? warningMessages.join("; ") : null;
    const findInfo = infoMessages.length ? infoMessages.join("; ") : null;
    const getStateClasses = () => {
        if (findValidation) return "border-red-300 bg-red-300/50 dark:border-red-500/70 dark:bg-red-900/30";
        if (findWarning) return "border-yellow-300 bg-amber-300/50 dark:border-yellow-500/70 dark:bg-amber-900/20";
        if (findInfo) return "border-blue-300 bg-blue-300/40 dark:border-blue-500/70 dark:bg-blue-900/20";
        return "border-gray-300 bg-gray-100/90 dark:bg-transparent";
    };

    const rawValue = value !== undefined ? value : props.getValue();

    const cell = (
        <td
            className={twMerge(TD, `border px-1 py-[3px] leading-tight text-gray-800 ${getStateClasses()} min-w-[30px] align-top relative dark:border-neutral-700 dark:text-gray-200`)}>
            <div
                className="inline-block w-full max-w-[130px] max-h-[74px] overflow-y-auto break-words pr-0.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600"
            >
                <CellContent value={rawValue}/>
            </div>
            {(findValidation || findWarning || findInfo) && (
                <span
                    className={`absolute top-0 right-0 w-0 h-0 border-r-[8px] border-b-[8px] border-transparent ${
                        findValidation ? "border-r-red-500" : (findWarning ? "border-r-yellow-500" : "border-r-blue-500")
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

    if (findInfo) {
        return (
            <ValidationTooltip
                message={findInfo}
                icon="fa-circle-info"
                color="text-blue-500"
            >
                {cell}
            </ValidationTooltip>
        );
    }

    return cell;
};
