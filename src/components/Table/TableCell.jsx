const TableCell = ({canSelect = false, columns = [], index, row = {}}) => {
    return columns.map((column, index) => {
        return (
            <td key={index} className="px-2 py-2 text-xs font-medium text-gray-700 whitespace-break-spaces">
                <div className="inline-flex items-center gap-x-3">
                    {
                        canSelect &&
                        <input type="checkbox"
                               className="text-blue-500 border-gray-300 rounded dark:bg-gray-900 dark:ring-offset-gray-900 dark:border-gray-700"/>
                    }
                    <div className="flex items-center gap-x-2">
                        {column.hasOwnProperty('render') ? column.render(row) : row[column.key]}
                    </div>
                </div>
            </td>
        )
    })

};

export default TableCell;
