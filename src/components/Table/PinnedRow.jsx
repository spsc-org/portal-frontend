import {flexRender} from "@tanstack/react-table";

const PinnedRow = ({row}) => {
    return (
        <tr
            className="bg-blue-300 dark:bg-indigo-800 dark:text-slate-300 shadow-md text-black sticky z-[999]"
            style={{
                top:
                    row.getIsPinned() === 'top'
                        ? `${row.getPinnedIndex() * 26 + 60}px`
                        : undefined,
            }}
        >
            {row.getVisibleCells().map(cell => {
                return (
                    <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                )
            })}
        </tr>
    )
};


export default PinnedRow;
