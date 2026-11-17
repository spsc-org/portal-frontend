import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { AttachDecreeViewModel } from "../viewmodel/ProposalViewModels.js";
import { useProposalProps } from "../viewmodel/useProposalProps.js";
import {
    Button,
    Checkbox,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Tooltip,
    Typography
} from "@material-tailwind/react";
import SingleSelect from "../../../components/fields/SingleSelect.jsx";
import React, {useMemo, useState} from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable
} from "@tanstack/react-table";
import {format} from "date-fns";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import AlertProjects from "./AlertProjects.jsx";

const columnHelper = createColumnHelper();

const FlagChip = ({ iso, name }) => {
    const [imgError, setImgError] = React.useState(false);
    if (imgError) {
        return (
            <span className="font-mono text-[10px] font-medium px-[4px] py-[1px] rounded-[3px]
                             bg-gray-100 text-gray-600 dark:bg-[#252d40] dark:text-[#8b91a3]">
                {iso}
            </span>
        );
    }
    return (
        <img
            src={`/flag-svg/${iso?.toLowerCase()}.svg`}
            alt={iso}
            title={name}
            className="w-5 h-[14px] object-cover rounded-[2px] inline-block"
            onError={() => setImgError(true)}
        />
    );
};

const AttachDecreeModal = ({open = false, onClose, ...dialogProps}) => {
    const { id: proposalId, projectState = [], proposalState = [], subjectTypes = [], decrees = [] } = useProposalProps();
    const vm = useViewModel((deps) => new AttachDecreeViewModel({ ...deps, proposalId }));
    const { form, errors } = vm;
    const setForm = vm.setForm;
    const create = vm.attachCmd;
    // Вибір рядків таблиці / фільтр за типом — локальний UI-стан View (react-table).
    const [columnFilters, setColumnFilters] = useState("");
    const [rowSelection, setRowSelection] = useState([]);

    const columns = useMemo(() => [
        {
            id: "select",
            header: ({table}) => (
                <div className="px-2">
                    <Tooltip content="Обрати всі">
                        <Checkbox
                            color="blue"
                            ripple={false}
                            checked={table.getIsAllRowsSelected()}
                            indeterminate={table.getIsSomeRowsSelected()}
                            onChange={table.getToggleAllRowsSelectedHandler()}
                            className="h-4 w-4"
                        />
                    </Tooltip>

                </div>
            ),
            cell: ({row}) => (
                <div className="px-2">
                    <Checkbox
                        color="blue"
                        ripple={false}
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        indeterminate={row.getIsSomeSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="h-4 w-4"
                    />
                </div>
            ),
            enableSorting: false,
            size: 20,
            minSize: 20,
            maxSize: 20,
        },
        columnHelper.accessor("stateId", {
            id: "stateId",
            header: () => "Стан",
            cell: (info) => {
                return projectState.find(s => s.id === info.getValue())?.caption;
            },
            size: 60
        }),
        columnHelper.accessor("subjectTypeId", {
            id: "subjectTypeId",
            header: () => "Тип",
            cell: (info) => {
                return subjectTypes.find(s => s.id === info.getValue())?.caption;
            },
            size: 60
        }),

        columnHelper.accessor("_names", {
            id: "_names",
            header: () => "Назви",
            size: 36,
            minSize: 36,
            maxSize: 48,
            cell: ({row}) => {
                const parsed = row.original?.precomputedData ? JSON.parse(row.original?.precomputedData) : null;
                const countries = Array.isArray(parsed?.countries) ? parsed?.countries : [];
                return (
                    <div className="flex space-y-1 flex-col">
                        <span className="text-[13px] font-medium text-gray-800 dark:text-[#e8eaf0]">
                            {row?.original?.nameUk || row?.original?.nameEn || "Відсутнє значення"}
                        </span>
                        <div className="text-[10.5px] font-mono text-gray-400 dark:text-[#555d72] space-x-1">
                            <span>ID: {row.original.id}</span>
                            {
                                Boolean(row.original?.createdAt) &&
                                <span>Створено: {format(row.original.createdAt, "dd.MM.yyyy HH:mm:ss")}</span>
                            }
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {countries.length ? countries.map((item, index) => (
                                <FlagChip key={index} iso={item.iso} name={item?.name} />
                            )) : "Відсутнє значення"}
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.accessor("decreeId", {
            id: "decreeId",
            header: () => "Указ",
            cell: (info) => {
                if (info.getValue()) {
                    const value = decrees.find(d => d.id === info.getValue())?.name;
                    return <span className="text-sm">{value}</span>
                } else {
                    return <span className="text-xs italic">Указ відсутній</span>
                }
            }
        }),
        columnHelper.accessor("_linkedProposals", {
            id: "linkedProposals",
            header: () => "Пов'язані подання",
            cell: ({row}) => {
                const parsed = row.original?.precomputedData ? JSON.parse(row.original?.precomputedData) : null;
                const linkedProposal = Array.isArray(parsed?.proposals) ? parsed?.proposals.filter(item => item.caption !== row.original?.caption).map(item => ({
                    ...item,
                    state: proposalState.find(s => s.id === item.stateId)?.caption
                })) : [];
                return linkedProposal.length > 0 ?
                    <div className="flex flex-col">
                        {
                            linkedProposal.map((item, index) => {
                                const isLongText = item.caption.length > 80;
                                const displayText = isLongText ? `${item.caption.slice(0, 80)}...` : item.caption;
                                return (
                                    <span title={item.caption} key={index}><span
                                        className="font-medium">{item.state}</span>: {displayText}</span>
                                )
                            })
                        }
                    </div>
                    : "Відсутнє значення"
            },
        }),
    ], [dialogProps?.data])


    const filteredData = useMemo(() => {
        if (!columnFilters) return dialogProps.data
        return dialogProps.data.filter((row) => row.subjectTypeId === Number(columnFilters))
    }, [columnFilters, dialogProps.data])

    const table = useReactTable({
        data: filteredData || [],
        columns,
        state: {rowSelection},
        enableRowSelection: true,
        onRowSelectionChange: (updater) => {
            setRowSelection((prev) => {
                return typeof updater === "function" ? updater(prev) : updater;
            });
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row, index) => row.id ?? String(index),
        columnResizeMode: "onChange",
        getFilteredRowModel: getFilteredRowModel(),
    });

    const handleChangeSelect = (key = '') => (selected) => {
        setForm(prevState => ({...prevState, [key]: selected}));
    }

    const handleSubmit = async () => {
        if (await vm.submit(Object.keys(rowSelection))) onClose();
    }

    const ignoreAttachAlert = useMemo(() => {
        if (!Object.keys(rowSelection).length) return [];
        return Object.keys(rowSelection)
            .map(Number)
            .map((item) => {
                const project = dialogProps.data.find(d => d.id === item);
                return project?.decreeId ? project : null;
            })
            .filter(Boolean);
    }, [rowSelection])

    return (
        <Dialog open={open} handler={onClose} size="xxl">
            <DialogHeader className="border-b border-gray-200 dark:border-[rgba(255,255,255,0.07)] py-3 px-4">
                <Typography variant="h6" className="text-gray-900 dark:text-[#e8eaf0]">
                    Прикріплення указу
                </Typography>
            </DialogHeader>
            <DialogBody>
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[12px] text-gray-500 dark:text-[#8b91a3]">
                                Обрано: <span className="font-semibold text-gray-800 dark:text-[#e8eaf0]">{table.getSelectedRowModel().flatRows.length}</span>
                            </span>
                            {table.getSelectedRowModel().flatRows.length > 0 && (
                                <button
                                    onClick={() => table.resetRowSelection()}
                                    className="text-[11px] text-red-500 hover:text-red-600 transition-colors"
                                >
                                    Очистити
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {[
                                { value: "", label: "Всі" },
                                { value: "1", label: "Фізичні" },
                                { value: "2", label: "Юридичні" },
                                { value: "5", label: "Судна" },
                                { value: "6", label: "Повітряні" },
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setColumnFilters(value)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                        columnFilters === value
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#252d40] dark:text-[#8b91a3] dark:hover:bg-[#2e3650]'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="h-[70vh] overflow-y-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                style={{width: header.getSize()}}
                                                className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1a2035] text-[11px] font-semibold text-gray-500 dark:text-[#8b91a3] uppercase tracking-wide px-3 py-2 text-left border-b border-gray-200 dark:border-[rgba(255,255,255,0.07)]"
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                                </thead>
                                <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`border-b border-gray-100 dark:border-[rgba(255,255,255,0.05)] transition-colors
                                            ${row.getIsSelected() ? 'bg-blue-50 dark:bg-[rgba(79,142,247,0.08)]' : 'hover:bg-gray-50 dark:hover:bg-[#1e2536]'}
                                        `}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-3 py-2 text-[12px] text-gray-700 dark:text-[#c9d8ff]">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="w-full lg:w-[320px] shrink-0 space-y-4">
                        <div className="rounded-[10px] border border-gray-200 dark:border-[rgba(255,255,255,0.07)] p-4 bg-gray-50 dark:bg-[#161b27]">
                            <SingleSelect closeMenuOnSelect
                                          isClearable
                                          options={decrees}
                                          label="Указ"
                                          isOptionDisabled={option => Boolean(option?.deletedAt)}
                                          id="decreeId"
                                          error={errors?.decreeId}
                                          value={form.decreeId}
                                          onChange={handleChangeSelect('decreeId')}/>
                            <Typography
                                variant="paragraph"
                                className="text-[12px] text-gray-500 dark:text-[#8b91a3] flex items-start gap-2 p-3 rounded-[8px] bg-blue-50 dark:bg-[rgba(79,142,247,0.08)] mt-3"
                            >
                                <i className="fa-solid fa-circle-info mt-0.5"></i>
                                Оберіть указ та проєкти.
                            </Typography>
                        </div>
                        {
                            Boolean(ignoreAttachAlert.length) && <AlertProjects ignoreAttachAlert={ignoreAttachAlert}/>
                        }
                    </div>
                </div>
            </DialogBody>
            <DialogFooter className="border-t border-gray-200 dark:border-[rgba(255,255,255,0.07)] py-3 px-4 gap-2">
                <Button
                    variant="text"
                    color="red"
                    onClick={onClose}
                    className="mr-1"
                >
                    <span>Закрити</span>
                </Button>
                <LoadingButton
                    isLoading={create.isPending}
                    color="green"
                    disabled={!Object.keys(rowSelection).length || !form.decreeId}
                    onClick={handleSubmit}
                >
                    <span>Прикріпити</span>
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(AttachDecreeModal);
