import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { InventoryListViewModel } from "./viewmodel/InventoryViewModels.js";
import { confirmToast } from "../../components/confirmToast.jsx";
import {useMemo} from 'react';
import {Link} from "react-router";
import {convertDate} from "../../lib/utils.js";
import AdvancedSelect from "../../components/fields/AdvancedSelect.jsx";
import {createColumnHelper} from "@tanstack/react-table";
import Table, {loadColumnSizes} from "../../components/Table/Table.jsx";
import InventoryModal from "./InventoryModal.jsx";
import InventoryDetailsModal from "./InventoryDetailsModal.jsx";
import {Badge, Button, Menu, MenuHandler, MenuItem, MenuList, Switch, Tooltip} from "@material-tailwind/react";
import Page from "../../components/Page.jsx";
import SearchInput from "../../components/fields/SearchInput.jsx";
import DateRangePicker from "../../components/fields/DateRangePicker.jsx";
// import InventoryAttachmentsDropdown from "./InventoryAttachmentsDropdown.jsx";
import InventoryAttachmentsInline from "./InventoryAttachmentsInline.jsx";
import InventoryNoteCell from "./InventoryNoteCell.jsx";
import InventoryCommentModal from "./InventoryCommentModal.jsx";
import CollapsibleSection from "../../components/CollapsibleSection.jsx";
import PageHeader from "../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../layouts/app/HeaderButtons.jsx";

const columnHelper = createColumnHelper();
const Index = () => {
    const vm = useViewModel((deps) => new InventoryListViewModel(deps));
    const auth = vm.auth;
    const { filters, pinnedRows, selectedId, isEditOpen, isCloneOpen, isDetailsOpen, commentModal } = vm;
    const dictionary = vm.dictionary;
    const isDictionaryFetching = vm.optionsQuery.isFetching;
    const { inventoryLocation, inventoryType, users, responsibleUsers } = vm.lists;
    const inventories = vm.inventories;
    const isInventoryFetching = vm.isFetching;
    const setCommentModal = (modal) => (modal ? vm.openCommentModal(modal) : vm.closeCommentModal());
    const handleDetails = (id) => () => vm.openDetails(id);
    const handleRestore = (id) => () => confirmToast("Відновити елемент?", () => vm.restore(id), { confirmText: "Відновити", color: "green" });
    const handleDelete = (id) => () => confirmToast("Видалити елемент?", () => vm.remove(id));
    const handleEdit = (id) => () => vm.openEdit(id);
    const handleClone = (id) => () => vm.openClone(id);
    const showRestoreBtn = (row) => vm.canRestore(row);
    const handleDeleteComment = (inventoryId) => (commentId) =>
        confirmToast("Видалити коментар?", () => vm.deleteComment(inventoryId, commentId), { confirmText: "Так" });

    const columns = useMemo(() => [
        columnHelper.accessor('valueTypeId', {
            id: 'valueTypeId',
            cell: (info) => {
                const valueType = info.getValue() ? inventoryType.find(t=>t.id === info.getValue())  : null;
                return valueType ?
                    <span className="inline-flex gap-x-2 items-center"><i
                        className={`${valueType?.icon} fa-lg`}></i> {valueType?.caption}  </span>
                    : null;
            },
            size: loadColumnSizes()?.find(item => item.column === 'valueTypeId')?.size || 120,
            header: () => 'Тип',
            footer: info => info.column.id,
            enableSorting: true,
        }),
        columnHelper.accessor('inventoryNum', {
            id: 'inventoryNum',
            size: loadColumnSizes()?.find(item => item.column === 'inventoryNum')?.size || 120,
            cell: info => info.getValue(),
            header: () => 'Інвентарний номер',
            footer: info => info.column.id,
        }),
        columnHelper.accessor('registryNum', {
            id: 'registryNum',
            size: loadColumnSizes()?.find(item => item.column === 'registryNum')?.size || 120,
            cell: info => info.getValue(),
            header: () => 'Реєстр. №',
            footer: info => info.column.id,
        }),
        columnHelper.accessor('locationId', {
            id: 'locationId',
            header: () => 'Розташування',
            size: loadColumnSizes()?.find(item => item.column === 'locationId')?.size || 80,
            cell: info => info.getValue() ? inventoryLocation.find(l=>l.id === info.getValue())?.caption : null,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('serial', {
            id: "serial",
            header: () => 'Серійний номер',
            size: loadColumnSizes()?.find(item => item.column === 'serial')?.size || 150,
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),
        columnHelper.accessor('caption', {
            id: "caption",
            header: () => 'Заголовок',
            size: loadColumnSizes()?.find(item => item.column === 'caption')?.size || 250,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('details', {
            id: "details",
            header: () => 'Деталі',
            size: loadColumnSizes()?.find(item => item.column === 'details')?.size || 150,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('responsibleUserId', {
            id: 'responsibleUserId',
            header: () => 'Мат. відповідальний',
            size: loadColumnSizes()?.find(item => item.column === 'responsibleUserId')?.size || 100,
            cell: info => info.getValue() ? responsibleUsers.find(u=>u.id === info.getValue())?.initials : null,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('baileeUserId', {
            id: 'baileeUserId',
            header: () => 'Відповідальний',
            cell: info => info.getValue() ? users.find(u=>u.id === info.getValue())?.caption : null,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('note', {
            id: 'note',
            header: () => 'Примітка',
            size: loadColumnSizes()?.find(item => item.column === 'note')?.size || 200,
            footer: info => info.column.id,
            cell: info => (
                <InventoryNoteCell onDeleteComment={handleDeleteComment(info.row.original.id)}
                    note={info.getValue()}
                    comments={info.row.original.comments ?? []}
                    users={users}
                    inventoryId={info.row.original.id}
                    currentUserId={auth?.user?.id}
                    onOpenModal={setCommentModal}
                />
            ),
        }),
        columnHelper.accessor('cost', {
            id: 'cost',
            header: () => 'Вартість',
            size: loadColumnSizes()?.find(item => item.column === 'cost')?.size || 100,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('amount', {
            id: 'amount',
            header: () => 'Кількість',
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('createdAt', {
            id: 'createdAt',
            header: () => 'Створено',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 120,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('updatedAt', {
            id: 'updatedAt',
            header: () => 'Оновлено',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 120,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('deletedAt', {
            id: 'deletedAt',
            header: () => "Видалено",
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 120,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('nodes', {
            id: 'nodes',
            header: () => 'Вузли',
            size: loadColumnSizes()?.find(item => item.column === 'nodes')?.size || 160,
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => {
                const nodes = info.getValue() ?? [];
                if (!nodes.length) return null;
                return (
                    <div className="flex flex-wrap gap-1">
                        {nodes.map(node => (
                            <span
                                key={node.id}
                                className="inline-block text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                title={node.name}
                            >
                                {node.name}
                            </span>
                        ))}
                    </div>
                );
            },
        }),
        columnHelper.accessor("attachments", {
            id: 'attachments',
            size: loadColumnSizes()?.find(item => item.column === 'attachments')?.size || 120,
            header: () => 'Файли',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => <InventoryAttachmentsInline attachments={info.getValue() ?? []}/>,
        }),
        /*
        columnHelper.accessor("attachments_count", {
            id: 'attachments_count',
            size: loadColumnSizes()?.find(item => item.column === 'attachments_count')?.size || 80,
            header: () => 'Кількість файлів',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => <InventoryAttachmentsDropdown id={info.row.id} count={info.getValue()}/>
        }),
        */

        columnHelper.display({
            id: 'actions',
            maxSize: 80,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Дії',
            cell: ({row}) => (
                <div className="flex flex-row gap-x-1 p-1 justify-end">
                    {
                        (auth?.user?.permissions?.pages?.inventory?.read && !row?.original?.deletedAt || auth?.user?.permissions?.pages?.inventory?.restore) &&
                        <Tooltip content="Деталі">
                            <Button onClick={handleDetails(row?.id)} size="sm" variant="outlined" color="blue">
                                <i className="fa-regular fa-circle-info"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        auth?.user?.permissions?.pages?.inventory?.create && !row?.original?.deletedAt &&
                        <Tooltip content="Створити копію">
                            <Button onClick={handleClone(row?.id)} size="sm" variant="outlined" title="Створити копію">
                                <i className="fa-solid fa-clone"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        auth?.user?.permissions?.pages?.inventory?.update && !row?.original?.deletedAt &&
                        <Tooltip content="Редагувати">
                            <Button onClick={handleEdit(row?.id)} size="sm" color="yellow" title="Редагувати">
                                <i className="fa-regular fa-pen-to-square"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        auth?.user?.permissions?.pages?.inventory?.delete && !row?.original?.deletedAt &&
                        <Tooltip content="Видалити">
                            <Button onClick={handleDelete(row?.id)} size="sm" color="red" title="Видалити">
                                <i className="fa-regular fa-trash"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        showRestoreBtn(row) ?
                            <Tooltip content="Відновити">
                                <Button onClick={handleRestore(row?.id)} size="sm" color="green" title="Відновити">
                                    <i className="fa-regular fa-trash-can-arrow-up"></i>
                                </Button>
                            </Tooltip>
                            : null
                    }
                </div>),
        }),
    ], [vm, auth, inventoryType, inventoryLocation, users, responsibleUsers]);

    const hasNonEmptyFilter = () => vm.hasActiveFilters;
    const handleChangeOptions = vm.changeOptions;
    const handleChangeInput = vm.changeText;
    const handleSortModel = vm.table.applySorting;
    const handleLimit = vm.table.setLimit;
    const handlePageChange = vm.table.setPageFromPaginator;
    const handlePinRow = vm.setPinnedRows;
    const handleClearFilters = vm.clearFilters;
    const handleAdd = vm.openAdd;
    const onCloseModal = vm.closeEdit;
    const onDetailsClose = vm.closeDetails;
    const toggleFilterSwitch = vm.toggleSwitch;
    const handleChangeDate = vm.changeDate;

    // Видимі колонки таблиці (localStorage Table) — для друку/експорту.
    const getActiveColumns = () => {
        let storedCols = {};
        try {
            storedCols = JSON.parse(localStorage.getItem(`${location.pathname}-columns`)) || {};
        } catch {
            storedCols = {};
        }
        return columns.filter(c => c.id !== "actions").reduce((acc, col) => {
            if (col.id) acc[col.id] = Object.prototype.hasOwnProperty.call(storedCols, col.id) ? storedCols[col.id] : true;
            return acc;
        }, {});
    };
    const handleExport = (e) => {
        e.preventDefault();
        vm.exportAll(getActiveColumns());
    };
    const handleSelectedExport = (e) => {
        e.preventDefault();
        vm.exportSelected(getActiveColumns());
    };

    return (
            <Page>
                <PageHeader title="Інвентар" actions={<>
                    <Tooltip content="Версія для друку">
                        <Menu>
                            <Badge content={pinnedRows.length}
                                   invisible={!pinnedRows.length}>
                                <MenuHandler>
                                    <Button size="sm" variant="outlined"> <i className="fa-regular fa-print"></i></Button>
                                </MenuHandler>
                            </Badge>
                            <MenuList className="p-0">
                                <MenuItem className="hover:bg-gray-200" onClick={handleExport}
                                          disabled={!inventories?.data?.length}>
                                    Всі елементи
                                </MenuItem>
                                <MenuItem className="hover:bg-gray-200" onClick={handleSelectedExport}
                                          disabled={!pinnedRows.length}>
                                    Обрані елементи: {pinnedRows.length}
                                </MenuItem>
                            </MenuList>
                        </Menu>

                    </Tooltip>
                    <Tooltip content="Управління вузлами (комплектами)">
                        <Link to="/inventory/nodes">
                            <Button size="sm" variant="outlined">
                                <i className="fa-regular fa-diagram-nested mr-1.5"/>Вузли
                            </Button>
                        </Link>
                    </Tooltip>
                    {auth?.user?.permissions?.pages?.inventory?.create &&
                        <HeaderButton icon="fa-solid fa-plus" title="Додати" onClick={handleAdd}>Додати</HeaderButton>
                    }
                </>} />
                <span data-i-doc="page:inventory" hidden />
                <CollapsibleSection
                    title="Фільтри"
                    showHiddenAppliedBadge
                    className="mt-2 mx-2 mb-5 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-md dark:border-gray-700 dark:bg-gray-900/60 sm:p-4"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="min-w-0" data-filter-active={filters?.fText?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="caption" value={filters?.fText} label="Фільтр за текстом"
                                         onChange={handleChangeInput}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fType?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={inventoryType} label="Тип" id="fType"
                                            selectedOptions={filters.fType}
                                            onChange={handleChangeOptions('fType')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fBaileeUser?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={users} label="Відповідальний"
                                            id="fBaileeUser"
                                            selectedOptions={filters.fBaileeUser}
                                            onChange={handleChangeOptions('fBaileeUser')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fResponsibleUser?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={responsibleUsers}
                                            label="Мат. відповідальний"
                                            id="fResponsibleUser"
                                            selectedOptions={filters.fResponsibleUser}
                                            onChange={handleChangeOptions('fResponsibleUser')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fLocation?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={inventoryLocation} label="Розташування"
                                            id="fLocation"
                                            selectedOptions={filters.fLocation}
                                            onChange={handleChangeOptions('fLocation')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.fNode?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={dictionary?.inventoryNode ?? []} label="Вузол"
                                            id="fNode"
                                            selectedOptions={filters.fNode}
                                            onChange={handleChangeOptions('fNode')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                            <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                             label="Дата оновлення"/>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            <div className="flex flex-wrap items-center gap-2">
                                {Boolean(auth?.user?.permissions?.pages?.inventory?.restore) &&
                                    <Tooltip content="Приховати видалені">
                                        <label
                                            htmlFor="hideDeletedInventory"
                                            data-filter-active={filters.hideDeleted ? "true" : "false"}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200"
                                        >
                                            <Switch id="hideDeletedInventory" size="xs" ripple={false}
                                                    color="green"
                                                    name="hideDeleted" checked={filters.hideDeleted}
                                                    onChange={toggleFilterSwitch}/>
                                            <span>Приховати видалені</span>
                                        </label>
                                    </Tooltip>
                                }
                                <Tooltip content="Приховати те, що не на обліку">
                                    <label
                                        htmlFor="hideNonInventory"
                                        data-filter-active={filters.hideNonInventory ? "true" : "false"}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200"
                                    >
                                        <Switch id="hideNonInventory" size="xs" ripple={false}
                                                color="green"
                                                name="hideNonInventory" checked={filters.hideNonInventory}
                                                onChange={toggleFilterSwitch}/>
                                        <span>Не на обліку</span>
                                    </label>
                                </Tooltip>
                            </div>
                            <Tooltip content="Скинути фільтри">
                                <Button
                                    size="sm"
                                    className="h-9 px-3"
                                    disabled={!hasNonEmptyFilter()}
                                    onClick={handleClearFilters}>
                                    <i className="fa-regular fa-filter-slash mr-1"></i>
                                    Скинути
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </CollapsibleSection>
                <div className="mt-6 mx-2 mb-10">
                    <Table
                        textSize="xs"
                        onRowClick={(row) => {
                            if (window.getSelection()?.toString()) return;
                            if ((auth?.user?.permissions?.pages?.inventory?.read && !row?.original?.deletedAt) || auth?.user?.permissions?.pages?.inventory?.restore) {
                                vm.openDetails(row.id);
                            }
                        }}
                        onDoubleClick={(row) => {
                            if (auth?.user?.permissions?.pages?.inventory?.update && !row?.original?.deletedAt) {
                                vm.openEdit(row.id);
                            }
                        }}
                        canPin
                        onRowPinning={handlePinRow}
                        loading={isDictionaryFetching || isInventoryFetching}
                        canChangeResize
                        canChangeVisibility pagination={{
                        onLimitChange: handleLimit,
                        onPageChange: handlePageChange,
                        currentPage: filters?.page,
                        pageSize: inventories?.limit,
                        totalCount: inventories?.total,
                    }} data={inventories?.data ?? []} columns={columns} onSort={handleSortModel}/>
                </div>
                {
                    (isEditOpen || isCloneOpen) &&
                    <InventoryModal id={selectedId} isClone={isCloneOpen} dictionary={dictionary} open={isEditOpen || isCloneOpen} onClose={onCloseModal}/>
                }
                {
                    isDetailsOpen &&
                    <InventoryDetailsModal open={isDetailsOpen} dictionary={dictionary} onClose={onDetailsClose}
                                           id={selectedId}/>
                }
                {commentModal &&
                    <InventoryCommentModal
                        key={`${commentModal.mode}-${commentModal.inventoryId}-${commentModal.comment?.id ?? "new"}`}
                        modal={commentModal}
                        onClose={() => setCommentModal(null)}
                    />
                }
            </Page>
    );
};

export default observer(Index);
