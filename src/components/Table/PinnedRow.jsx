import {flexRender} from "@tanstack/react-table";
import {TD} from "./tableStyles.js";

const PinnedRow = ({row}) => {
    return (
        <tr
            className="sticky z-[5] bg-blue-50 shadow-sm dark:bg-blue-900/40"
            style={{
                top:
                    row.getIsPinned() === 'top'
                        ? `${row.getPinnedIndex() * 26 + 60}px`
                        : undefined,
            }}
        >
            {row.getVisibleCells().map(cell => {
                return (
                    <td key={cell.id} className={TD}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                )
            })}
        </tr>
    )
};


export default PinnedRow;
