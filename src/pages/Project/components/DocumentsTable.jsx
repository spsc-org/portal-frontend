import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable
} from "@tanstack/react-table";
import {Fragment, useEffect, useState} from "react";
import EditableCellSelect from "./EditableCellSelect.jsx";
import EditableCell from "./EditableCell.jsx";
import {Button} from "@material-tailwind/react";

const columnHelper = createColumnHelper();

const DocumentsTable = ({data = [], options = [], initiators = [], onTableChange}) => {
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        if (data.length) {
            setTableData(data);
        }
    }, [data]);

    const columns = [
        columnHelper.accessor('typeId', {
            header: () => 'Вид документа',
            cell: props => <EditableCellSelect {...props} options={options}/>
        }),
        columnHelper.accessor('regNum', {
            header: () => 'Реєстр.№',
            cell: EditableCell
        }),
        columnHelper.accessor('regDate', {
            header: () => 'Дата',
            cell: props => <EditableCell {...props} placeholder="дд.мм.рррр"/>
        }),
        columnHelper.accessor('unitId', {
            header: () => 'Підрозділ',
            cell: props => <EditableCellSelect {...props} options={initiators}/>
        }),
        columnHelper.accessor('path', {
            header: () => 'Тека з матеріалами',
            cell: EditableCell
        }),
        columnHelper.accessor('caption', {
            header: () => 'Примітки',
            cell: EditableCell
        }),
    ];

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        meta: {
            updateData: (rowIndex, columnId, value) => {
                const result = tableData.map((row, index) => {
                    if (index === rowIndex) {
                        return {
                            ...tableData[rowIndex],
                            [columnId]: value,
                        };
                    }
                    return row;
                });
                onTableChange(result);
                setTableData(result);

            },
        },
    })

    const handleAddRow = () => {
        const keys = columns.map((column) => column.accessorKey);
        const obj = Object.fromEntries(keys.map(item => [item, ""]));
        setTableData(old => [...old, obj])
    }
    return (
        <Fragment>
            <table>
                <thead>
                {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => {
                            return (
                                <th key={header.id} className="dark:text-slate-300" colSpan={header.colSpan}>
                                    {header.isPlaceholder ? null : (
                                        <div>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </div>
                                    )}
                                </th>
                            )
                        })}
                    </tr>
                ))}
                </thead>
                <tbody>
                {table.getRowModel().rows.map(row => {
                    return (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => {
                                return (
                                    <td key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    )
                })}
                </tbody>
            </table>
            <Button className="mt-5" size="sm" variant="text" onClick={handleAddRow}>
                <span>Додати запис</span>
            </Button>
        </Fragment>
    );
};

export default DocumentsTable;
