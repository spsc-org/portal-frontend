import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Typography} from "@material-tailwind/react";
import EmptyMessage from "./EmptyMessage.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TD, TH, TR } from "../../../components/Table/tableStyles.js";

const SubjectTable = ({columns = [], data = []}) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <table className={twMerge(TABLE, "w-full min-w-max table-auto text-left")}>
            <thead>
            {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                        <th key={header.id} className={TH}>
                            <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-medium leading-none dark:text-gray-100"
                            >
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                            </Typography>
                        </th>
                    ))}
                </tr>
            ))}
            </thead>
            <tbody>
            {
                !table.getRowModel().rows.length ?
                    <tr className={TR}>
                        <td colSpan={columns.length} className={twMerge(TD, "text-center")}>
                            <EmptyMessage/>
                        </td>
                    </tr>
                    : table.getRowModel().rows.map(row => (
                        <tr className={TR} key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className={twMerge(TD, "font-light")}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
            </tbody>
        </table>
    )
};

export default SubjectTable;
