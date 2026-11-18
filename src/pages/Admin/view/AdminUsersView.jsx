import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createColumnHelper } from "@tanstack/react-table";
import { Tooltip } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import Table from "../../../components/Table/Table.jsx";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import SingleSelect from "../../../components/fields/SingleSelect.jsx";
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";
import BackToTop from "../../../components/BackToTop.jsx";
import { convertDate } from "../../../lib/utils.js";
import AdminLayout from "../shared/ui/AdminLayout.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";
import AccessModulesCell from "./components/AccessModulesCell.jsx";
import UserFormModal from "./UserFormModal.jsx";
import BulkActionsModal from "./BulkActionsModal.jsx";

const columnHelper = createColumnHelper();
const DateCell = ({ value }) => (value ? <Tooltip content={value}>{convertDate(value)}</Tooltip> : " ---- ");

const RowActions = observer(({ vm, row }) => {
    const deleted = Boolean(row.original?.deleted_at);
    const self = vm.isSelf(row.original);
    return (
        <div className="flex flex-row gap-x-1 p-1 justify-end">
            {vm.can("update") && !deleted && (
                <Tooltip content="Редагувати">
                    <Button onClick={() => vm.openEdit(row.id)} size="sm" color="yellow" title="Редагувати">
                        <i className="fa-regular fa-pen-to-square"></i>
                    </Button>
                </Tooltip>
            )}
            {vm.can("delete") && !deleted && !self && (
                <Tooltip content="Видалити">
                    <Button onClick={() => vm.askDelete(row.id)} size="sm" color="red" title="Видалити">
                        <i className="fa-regular fa-trash"></i>
                    </Button>
                </Tooltip>
            )}
            {vm.can("restore") && deleted && !self && (
                <Tooltip content="Відновити">
                    <Button onClick={() => vm.askRestore(row.id)} size="sm" color="green" title="Відновити">
                        <i className="fa-regular fa-trash-can-arrow-up"></i>
                    </Button>
                </Tooltip>
            )}
        </div>
    );
});

function useAdminColumns(vm) {
    const moduleKeys = vm.data.moduleSchemaKeys;
    return useMemo(() => [
        columnHelper.accessor("name", { id: "name", size: 100, header: () => "ПІБ" }),
        columnHelper.accessor("initials", { id: "initials", size: 100, header: () => "Ініціали" }),
        columnHelper.accessor("email", { id: "email", size: 100, header: () => "Email", enableSorting: false }),
        columnHelper.accessor("unit", { id: "unit", size: 100, header: () => "Підрозділ", cell: (info) => info.getValue() || " --- " }),
        columnHelper.accessor("isResponsible", {
            id: "isResponsible",
            size: 100,
            header: () => "Відповідальна особа",
            cell: (info) => (info.getValue() ? "Так" : "Ні"),
        }),
        columnHelper.accessor((row) => row?.permissions?.pages, {
            id: "accessModules",
            size: 220,
            header: () => "Доступи",
            enableSorting: false,
            cell: ({ getValue }) => <AccessModulesCell schemaPages={moduleKeys} userPages={getValue() ?? {}}/>,
        }),
        ...[["created_at", "Дата створення"], ["updated_at", "Дата зміни"], ["deleted_at", "Дата видалення"]].map(([id, title]) =>
            columnHelper.accessor(id, { id, header: () => title, size: 100, enableResizing: false, cell: (props) => <DateCell value={props.getValue()}/> }),
        ),
        columnHelper.display({
            id: "actions",
            maxSize: 100,
            header: () => "Дії",
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => <RowActions vm={vm} row={row}/>,
        }),
    ], [vm, moduleKeys]);
}

const FilterSelect = observer(({ vm, id, label, options, searchable = false }) => (
    <div className="min-w-0">
        <SingleSelect
            size="xs"
            id={id}
            label={label}
            options={options}
            value={vm.selectedOption(options, id)}
            onChange={(option) => vm.setSelectFilter(id, option)}
            isSearchable={searchable}
            closeMenuOnSelect
        />
    </div>
));

const AdminUsersView = ({ vm }) => {
    const { table, data } = vm;
    const columns = useAdminColumns(vm);
    const canUpdate = vm.can("update");

    return (
        <AdminLayout data-i-doc="page:admin">
            <PageHeader
                title="Користувачі"
                actions={
                    <>
                        {canUpdate && vm.selectedUserIds.length > 0 && (
                            <HeaderButton tone="default" icon="fa-solid fa-layer-group" onClick={vm.openBulk}>
                                Масові дії ({vm.selectedUserIds.length})
                            </HeaderButton>
                        )}
                        {vm.can("create") && (
                            <HeaderButton icon="fa-solid fa-plus" title="Додати (Insert)" disabled={vm.isLoading} onClick={vm.openCreate}>
                                Додати
                            </HeaderButton>
                        )}
                    </>
                }
            />
            <div className="flex flex-col gap-2">
                {/* Панель фільтрів — як на /project (ProjectFilters): картка surface-card + сітка полів */}
                <div
                    data-i-doc="component:admin-users-filters"
                    className="rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800"
                >
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] items-end gap-2">
                        <SearchInput size="xs" name="q" value={table.filters.q || ""} placeholder="Пошук"
                                     icon="fa-regular fa-magnifying-glass" onChange={table.handleInput}/>
                        <FilterSelect vm={vm} id="unit" label="Підрозділ" options={data.unitOptions} searchable/>
                        <FilterSelect vm={vm} id="isResponsible" label="Матеріально відповідальний" options={data.isResponsibleOptions}/>
                        <FilterSelect vm={vm} id="trashed" label="Видалений" options={data.trashedOptions}/>
                    </div>
                    {vm.hasActiveFilters && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => table.reset()}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                                <i className="fa-solid fa-filter-circle-xmark" />
                                Скинути фільтри
                            </button>
                        </div>
                    )}
                </div>
                <Table
                    onDoubleClick={(row) => !row?.original?.deleted_at && vm.openEdit(row.id)}
                    loading={vm.isLoading}
                    canSelect={canUpdate}
                    rowSelectable={(row) => !row?.original?.deleted_at}
                    rowSelection={vm.rowSelection}
                    onSelectRow={vm.setRowSelection}
                    canChangeVisibility
                    textSize="xs"
                    pagination={vm.pagination}
                    data={vm.rows}
                    columns={columns}
                    initialSorting={table.sorting}
                    onSort={table.applySorting}
                />
            </div>

            {vm.createOpen && <UserFormModal data={data} onClose={vm.closeCreate}/>}
            {vm.editId != null && <UserFormModal key={vm.editId} data={data} id={vm.editId} onClose={vm.closeEdit}/>}
            {vm.bulkOpen && <BulkActionsModal data={data} userIds={vm.selectedUserIds} onClose={vm.closeBulk}/>}

            {vm.confirm && (
                <ConfirmModal
                    open
                    title={vm.confirm.kind === "delete" ? "Видалити користувача?" : "Відновити користувача?"}
                    message={vm.confirm.kind === "delete" ? "Користувача буде позначено видаленим." : "Користувача буде відновлено."}
                    isLoading={vm.deleteMutation.isPending || vm.restoreMutation.isPending}
                    onClose={vm.cancelConfirm}
                    onConfirm={vm.confirmAction}
                />
            )}
            <BackToTop/>
        </AdminLayout>
    );
};

export default observer(AdminUsersView);
