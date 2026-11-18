import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Typography} from "@material-tailwind/react";
import EmptyMessage from "./EmptyMessage.jsx";

const SubjectTable = ({columns = [], data = []}) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <table className="w-full min-w-max table-auto text-left">
            <thead>
            {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                        <th key={header.id} className="border-b border-blue-gray-100 bg-blue-gray-50 p-2">
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
                    <tr>
                        <td colSpan={columns.length} className="text-center">
                            <EmptyMessage/>
                        </td>
                    </tr>
                    : table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="font-light text-xs dark:text-gray-300 p-2 ">
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
