import { flexRender } from "@tanstack/react-table";
import SortButton from "./SortButton.jsx";
import { TH, ariaSort } from "./tableStyles.js";

/**
 * Заголовок колонки (Portal UI kit, як таблиця /project) із CTA сортування (SortButton);
 * th має aria-sort. Зміну ширини колонок прибрано.
 */
const ColumnHeader = ({ header }) => {
    const { column } = header;
    const canSort = column.getCanSort() && column.id !== "select";
    const sorted = column.getIsSorted(); // false | "asc" | "desc"
    const label = header.isPlaceholder ? null : flexRender(column.columnDef.header, header.getContext());

    return (
        <th
            scope="col"
            colSpan={header.colSpan}
            aria-sort={canSort ? ariaSort(sorted) : undefined}
            style={{ width: header.getSize() }}
            className={TH}
        >
            {canSort ? (
                <SortButton label={label} direction={sorted} next={column.getNextSortingOrder()} onClick={column.getToggleSortingHandler()} />
            ) : (
                label
            )}
        </th>
    );
};

export default ColumnHeader;
