const TableHeadCell = ({children}) => {
    return (
        <th scope="col"
            className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-x-3">
                {children}
            </div>
        </th>
    );
};

export default TableHeadCell;
