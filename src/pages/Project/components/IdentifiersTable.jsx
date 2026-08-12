import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable
} from "@tanstack/react-table";
import {Fragment, useEffect, useState} from "react";
import {Button} from "@material-tailwind/react";
import EditableCellSelect from "./EditableCellSelect.jsx";
import EditableCell from "./EditableCell.jsx";

const columnHelper = createColumnHelper();

const IdentifiersTable = ({data = [], countries = [], options = [], subjectTypeId, onTableChange}) => {
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        if (data.length) {
            setTableData(data);
        }
    }, [data]);

    const columns = [
        columnHelper.accessor('identifierCountryId', {
            header: () => 'Країна',
            cell: props => <EditableCellSelect {...props} options={countries}/>
        }),
        columnHelper.accessor('identifierId', {
            header: () => 'Тип',
            cell: props => {
                const countryIdentifiers = Boolean(tableData[props?.row?.index]?.identifierCountryId) ?
                    [...options
                        .filter(o => o.belongCountryId === Number(tableData[props?.row?.index]?.identifierCountryId))
                        .filter(o => subjectTypeId ? o.subjectTypeId === subjectTypeId : true),
                        {
                            belongCountryId: null,
                            caption: "tax",
                            code: null,
                            id: 46,
                            label: null,
                            subjectTypeId: 0
                        }
                    ].map(o => ({...o, label: `${o?.code || "null"}/${o?.caption || null}`}))

                    : []
                return (<EditableCellSelect {...props} options={countryIdentifiers}/>)
            }
        }),
        columnHelper.accessor('identifierValue', {
            header: () => 'Значення',
            cell: EditableCell
        }),
    ]

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
                                <th className="dark:text-slate-300" key={header.id} colSpan={header.colSpan}>
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
            <Button className="mt-5"  size="sm" variant="text" onClick={handleAddRow}>
                <span>Додати запис</span>
            </Button>
        </Fragment>
    );
};

export default IdentifiersTable;
