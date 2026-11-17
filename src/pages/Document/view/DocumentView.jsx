import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge, Button, Tooltip } from "@material-tailwind/react";
import { convertDate } from "../../../lib/utils.js";
import Table, { loadColumnSizes } from "../../../components/Table/Table.jsx";
import Page from "../../../components/Page.jsx";
import AdvancedSelect from "../../../components/fields/AdvancedSelect.jsx";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import DateRangePicker from "../../../components/fields/DateRangePicker.jsx";
import CollapsibleSection from "../../../components/CollapsibleSection.jsx";
import DocumentModal from "./DocumentModal.jsx";
import DocumentFormModal from "../../../widgets/document/DocumentFormModal.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";

const columnHelper = createColumnHelper();
const savedSize = (key, fallback) => loadColumnSizes()?.find((item) => item.column === key)?.size || fallback;

const getColor = (id) => {
    switch (id) {
        case 1:
        case 2:
            return "bg-blue-500/10 border-blue-500 border 1 text-blue-500";
        case 3:
            return "bg-red-500 text-white";
        case 4:
            return "bg-yellow-500 text-white";
        case 5:
        case 7:
            return "bg-green-500 text-white";
        default:
            return "bg-gray-950 dark:bg-gray-950 text-white";
    }
};

const dateCell = (props) => props.getValue()
    ? <Tooltip content={props.getValue()}>{convertDate(props.getValue())}</Tooltip>
    : ' ---- ';

function useDocumentColumns(vm) {
    const { canCreate, canUpdate, canDelete } = vm;
    return useMemo(() => [
        columnHelper.accessor("typeId", {
            id: 'typeId',
            size: savedSize('typeId', 220),
            header: () => 'Тип',
            cell: ({ row }) => (
                <div className="inline-flex gap-x-2 items-center p-2">
                    <div className={`relative h-[20px] w-[20px] align-middle ${getColor(row.original.typeId?.id)} rounded-[50%]`}>
                        <span className="absolute text-xs leading-none  left-1/2 top-1/2 -translate-x-1/2 p-0 -translate-y-1/2 transform ">
                            <i className={row.original.typeId?.icon}></i>
                        </span>
                    </div>
                    <span>{row.original.typeId?.caption}</span>
                </div>
            ),
        }),
        columnHelper.accessor("unitId", { id: 'unitId', size: savedSize('unitId', 100), header: () => 'Підрозділ' }),
        columnHelper.accessor("caption", { id: 'caption', size: savedSize('caption', 250), header: () => 'Назва', cell: (info) => info.getValue() }),
        columnHelper.accessor("regNum", { id: 'regNum', size: savedSize('regNum', 200), header: () => 'Реєстраційний номер', cell: (info) => info.getValue() }),
        columnHelper.accessor("regDate", { id: 'regDate', size: savedSize('regDate', 100), header: () => 'Дата реєстрації', cell: dateCell }),
        columnHelper.accessor("listItem", { id: 'listItem', size: savedSize('listItem', 100), header: () => 'Пункт переліку', cell: (info) => info.getValue() || ' ---- ' }),
        columnHelper.accessor("path", { id: 'path', size: savedSize('path', 200), header: () => 'Шлях', enableSorting: false, cell: (info) => info.getValue() }),
        columnHelper.accessor("comments", { id: 'comments', size: savedSize('comments', 150), header: () => 'Коментар', enableSorting: false, cell: (info) => info.getValue() }),
        columnHelper.accessor('performerId', { id: "performerId", header: () => 'Виконавець', cell: (props) => props.getValue(), size: savedSize('createdUserId', 200) }),
        columnHelper.accessor('createdAt', { id: "createdAt", header: () => 'Дата створення', cell: dateCell, size: 100 }),
        columnHelper.accessor("createdUserId", { id: 'createdUserId', size: savedSize('createdUserId', 250), header: () => 'Створив' }),
        columnHelper.accessor('updatedAt', { id: "updatedAt", header: () => 'Дата зміни', cell: dateCell, size: 100 }),
        columnHelper.accessor("updatedUserId", { id: 'updatedUserId', size: savedSize('updatedUserId', 250), header: () => 'Змінив', cell: (props) => props.getValue() }),
        columnHelper.accessor('deleted_at', { id: "deleted_at", header: () => 'Дата видалення', cell: dateCell, size: 100, enableResizing: false }),
        columnHelper.display({
            id: 'actions',
            maxSize: 100,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => (
                <div className="flex flex-row gap-x-2 p-2 justify-end">
                    <Badge content={row?.original?.documentCount || 0} color="blue">
                        <Tooltip content="Детальна інформація">
                            <Button onClick={() => vm.openDetails(row?.id)} size="sm" variant="outlined" color="blue">
                                <i className="fa-regular fa-circle-info"></i>
                            </Button>
                        </Tooltip>
                    </Badge>
                    {canUpdate && canCreate && row.original.typeId?.id === 1 && !row?.original?.deleted_at &&
                        <Tooltip content="Додати проєкти">
                            <a href={`/project/upload/v2?documentId=${row?.id}`} target="_blank" rel="noreferrer">
                                <Button size="sm">
                                    <i className="fa-regular fa-plus"></i>
                                </Button>
                            </a>
                        </Tooltip>
                    }
                    {canUpdate && !row?.original?.deleted_at &&
                        <Tooltip content="Редагувати">
                            <Button size="sm" color="yellow" onClick={() => vm.openEdit(row?.original?.id)}>
                                <i className="fa-regular fa-pen-to-square"></i>
                            </Button>
                        </Tooltip>
                    }
                    {/* Видалення на бекенді не реалізоване (в Inertia-версії обробник був порожнім). */}
                    {canDelete && row?.original?.deleted_at &&
                        <Tooltip content="Видалити">
                            <Button size="sm" color="yellow" disabled>
                                <i className="fa-regular fa-trash"></i>
                            </Button>
                        </Tooltip>
                    }
                </div>
            ),
        }),
    ], [vm, canCreate, canUpdate, canDelete]);
}

const DocumentView = ({ vm }) => {
    const columns = useDocumentColumns(vm);
    const { filters, table } = vm;
    const { types = [], units = [], users = [] } = vm.dictionaries;

    return (
        <Page>
            <PageHeader title="Документи" actions={vm.canCreate && <HeaderButton icon="fa-solid fa-plus" onClick={vm.openCreate}>Додати</HeaderButton>} />
            <div data-i-doc="page:document" className="mt-2 mx-2">
                <CollapsibleSection
                    title="Фільтри"
                    showHiddenAppliedBadge
                    className="mb-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-md dark:border-gray-700 dark:bg-gray-900/60 sm:p-4"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="min-w-0" data-filter-active={filters?.typeId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={types} label="Тип" id="typeId"
                                            selectedOptions={filters.typeId}
                                            onChange={vm.changeOptions('typeId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.unitId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={units} label="Підрозділ" id="unitId"
                                            selectedOptions={filters.unitId}
                                            onChange={vm.changeOptions('unitId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.performerId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={users} label="Виконавець" id="performerId"
                                            selectedOptions={filters.performerId}
                                            onChange={vm.changeOptions('performerId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.caption?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="caption" value={filters.caption} label="Назва"
                                         onChange={table.handleInput}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.regNum?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="regNum" value={filters.regNum} label="Реєстраційний номер"
                                         onChange={table.handleInput}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.listItem?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="listItem" value={filters.listItem} label="Пункт переліку"
                                         onChange={table.handleInput}/>
                        </div>
                        <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                            <DateRangePicker size="xs" onChange={vm.changeDate} from={filters.from} to={filters.to}
                                             label="Дата реєстрації"/>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            <Tooltip content="Скинути фільтри">
                                <Button className="h-9 px-3" size="sm" disabled={!vm.hasActiveFilters} onClick={vm.clearFilters}>
                                    <i className="fa-regular fa-filter-slash mr-1"></i>
                                    Скинути
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </CollapsibleSection>
                <Table
                    onDoubleClick={(row) => vm.select(row?.id)}
                    loading={vm.isFetching}
                    canChangeVisibility
                    canChangeResize
                    textSize="xs"
                    pagination={vm.pagination}
                    data={vm.documents?.data}
                    columns={columns}
                    onSort={table.applySorting}
                />
            </div>
            {vm.selectedId && vm.isDetailsOpen &&
                <DocumentModal open={vm.isDetailsOpen} selectedId={vm.selectedId} dictionaries={vm.dictionaries}
                               onClose={vm.closeDetails}/>
            }
            {vm.isCreateOpen &&
                <DocumentFormModal open mode="create" dictionaries={vm.dictionaries} onClose={vm.closeCreate}/>
            }
            {vm.isEditOpen && vm.selectedId &&
                <DocumentFormModal open mode="update" documentId={vm.selectedId} dictionaries={vm.dictionaries}
                                   onClose={vm.closeEdit}/>
            }
        </Page>
    );
};

export default observer(DocumentView);
