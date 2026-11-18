import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createColumnHelper } from "@tanstack/react-table";
import { Tooltip } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import { format } from "date-fns";
import Page from "../../../components/Page.jsx";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import SingleSelect from "../../../components/fields/SingleSelect.jsx";
import DateRangePicker from "../../../components/fields/DateRangePicker.jsx";
import CollapsibleSection from "../../../components/CollapsibleSection.jsx";
import Table from "../../../components/Table/Table.jsx";
import { loadColumnSizes } from "../../../components/Table/columnSizes.js";
import { confirmToast } from "../../../components/confirmToast.jsx";
import { BOOLEANS, convertDate, SANC_DECREE_TYPES } from "../../../lib/utils.js";
import DecreeModal from "./DecreeModal.jsx";
import DecreeFormModal from "./DecreeFormModal.jsx";
import AttachmentsDropdown from "./AttachmentsDropdown.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";

const columnHelper = createColumnHelper();
const savedSize = (key, fallback) => loadColumnSizes()?.find((item) => item.column === key)?.size || fallback;
const dateCell = (props) => props.getValue()
    ? <Tooltip content={props.getValue()}>{convertDate(props.getValue())}</Tooltip>
    : ' ---- ';

function useDecreeColumns(vm) {
    const { canUpdate, canDelete } = vm;
    return useMemo(() => [
        columnHelper.accessor("id", { id: 'id', size: 80, enableResizing: false, header: () => 'ID' }),
        columnHelper.accessor("typeId", { id: 'typeId', size: savedSize('typeId', 150), header: () => 'Тип' }),
        columnHelper.accessor("code", { id: 'code', size: savedSize('code', 100), header: () => 'Код', cell: (info) => info.getValue() }),
        columnHelper.accessor("date", {
            id: 'date',
            size: savedSize('date', 100),
            header: () => 'Дата',
            cell: (props) => props.getValue() ? format(props.getValue(), 'dd.MM.yyyy') : ' ---- ',
        }),
        columnHelper.accessor("projects_count", {
            id: 'projects_count',
            size: 80,
            header: () => 'К-сть проєктів',
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => {
                const { project_init_count = 0, project_update_count = 0, project_cancel_count = 0 } = row.original;
                return <div>
                    <p><i className="fa-solid fa-right-to-bracket text-green-500" title="Застосування"></i> {project_init_count}</p>
                    <p><i className="fa-solid fa-right-left text-blue-500 " title="Зміна"></i> {project_update_count}</p>
                    <p><i className="fa-solid fa-right-from-bracket text-red-800 " title="Скасування"></i> {project_cancel_count}</p>
                </div>;
            },
        }),
        columnHelper.accessor("comment", { id: 'comment', size: savedSize('comment', 250), header: () => 'Коментар', enableSorting: false }),
        columnHelper.accessor('createdAt', { id: "createdAt", header: () => 'Дата створення', cell: dateCell, size: 100 }),
        columnHelper.accessor('updatedAt', { id: "updatedAt", header: () => 'Дата зміни', cell: dateCell, size: 100 }),
        columnHelper.accessor('deleted_at', { id: "deleted_at", header: () => 'Дата видалення', cell: dateCell, size: 100, enableResizing: false }),
        columnHelper.accessor("attachments_count", {
            id: 'attachments_count',
            size: savedSize('attachments_count', 80),
            header: () => 'Кількість файлів',
            enableSorting: false,
            cell: (info) => <AttachmentsDropdown id={info.row.id} count={info.getValue()}/>,
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 100,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => (
                <div className="flex flex-row gap-x-2 p-2 justify-end">
                    <Tooltip content="Детальна інформація">
                        <Button onClick={() => vm.openDetails(row?.id)} size="sm" variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    </Tooltip>
                    {canUpdate && !row?.original?.deleted_at &&
                        <Tooltip content="Редагувати">
                            <Button size="sm" color="yellow" onClick={() => vm.openEdit(row?.original?.id)}>
                                <i className="fa-regular fa-pen-to-square"></i>
                            </Button>
                        </Tooltip>
                    }
                    {canDelete && !row?.original?.deleted_at &&
                        <Tooltip content="Видалити">
                            <Button size="sm" color="red"
                                    onClick={() => confirmToast("Видалити елемент?", () => vm.deleteDecree(row?.id))}>
                                <i className="fa-regular fa-trash"></i>
                            </Button>
                        </Tooltip>
                    }
                </div>
            ),
        }),
    ], [vm, canUpdate, canDelete]);
}

const DecreeView = ({ vm }) => {
    const columns = useDecreeColumns(vm);
    const { filters, table } = vm;

    return (
        <Page>
            <PageHeader title="Укази" actions={vm.canCreate && <HeaderButton icon="fa-solid fa-plus" onClick={vm.openCreate}>Додати</HeaderButton>} />
            <div data-i-doc="page:decree" className="mt-2 mx-2">
                <CollapsibleSection
                    title="Фільтри"
                    showHiddenAppliedBadge
                    className="mb-4 rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="min-w-0" data-filter-active={filters?.typeId?.value !== undefined ? "true" : "false"}>
                            <SingleSelect size="xs" closeMenuOnSelect options={SANC_DECREE_TYPES}
                                          label="Тип"
                                          id="typeId"
                                          value={filters.typeId}
                                          onChange={vm.changeOption('typeId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.code?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="code" value={filters.code} label="Код"
                                         onChange={table.handleInput}/>
                        </div>
                        <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                            <DateRangePicker size="xs" onChange={vm.changeDate} from={filters.from} to={filters.to}
                                             label="Дата"/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.isActive?.value !== undefined ? "true" : "false"}>
                            <SingleSelect size="xs" closeMenuOnSelect options={BOOLEANS}
                                          label="Діючий"
                                          id="isActive"
                                          value={filters.isActive}
                                          onChange={vm.changeOption('isActive')}/>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-2 dark:border-neutral-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            <Tooltip content="Скинути фільтри">
                                <Button size="sm" className="h-9 px-3" onClick={vm.clearFilters}>
                                    <i className="fa-regular fa-filter-slash mr-1"></i>
                                    Скинути
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </CollapsibleSection>
                <Table
                    loading={vm.isFetching}
                    canChangeVisibility
                    canChangeResize
                    textSize="xs"
                    pagination={vm.pagination}
                    data={vm.decrees?.data}
                    columns={columns}
                    onSort={table.applySorting}
                />
            </div>

            {vm.selectedId && vm.isDetailsOpen &&
                <DecreeModal open={vm.isDetailsOpen} selectedId={vm.selectedId} onClose={vm.closeDetails}/>
            }
            {vm.selectedId && vm.isEditOpen &&
                <DecreeFormModal open={vm.isEditOpen} decreeId={vm.selectedId} onClose={vm.closeEdit}/>
            }
            {vm.isCreateOpen &&
                <DecreeFormModal open={vm.isCreateOpen} onClose={vm.closeCreate}/>
            }
        </Page>
    );
};

export default observer(DecreeView);
