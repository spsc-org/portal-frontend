import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Tooltip } from "@material-tailwind/react";
import Table, { loadColumnSizes } from "../../../components/Table/Table.jsx";
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
const savedSize = (key, fallback = 100) => loadColumnSizes()?.find((item) => item.column === key)?.size || fallback;
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
        columnHelper.accessor("name", { id: "name", size: savedSize("name"), header: () => "ПІБ" }),
        columnHelper.accessor("initials", { id: "initials", size: savedSize("initials"), header: () => "Ініціали" }),
        columnHelper.accessor("email", { id: "email", size: savedSize("email"), header: () => "Email", enableSorting: false }),
        columnHelper.accessor("unit", { id: "unit", size: savedSize("unit"), header: () => "Підрозділ", cell: (info) => info.getValue() || " --- " }),
        columnHelper.accessor("isResponsible", {
            id: "isResponsible",
            size: savedSize("isResponsible"),
            header: () => "Відповідальна особа",
            cell: (info) => (info.getValue() ? "Так" : "Ні"),
        }),
        columnHelper.accessor((row) => row?.permissions?.pages, {
            id: "accessModules",
            size: savedSize("accessModules", 220),
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

const FilterSelect = observer(({ vm, id, label, options, width, searchable = false }) => (
    <div className={width}>
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
        <AdminLayout data-i-doc="page:admin" active="users">
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
            <div className="mx-2 mt-5">
                <div className="flex flex-row justify-between items-center">
                    <div className="mb-5 flex flex-wrap items-end gap-x-5 gap-y-2">
                        <div className="w-56">
                            <SearchInput size="xs" name="q" value={table.filters.q || ""} placeholder="Пошук"
                                         icon="fa-regular fa-magnifying-glass" onChange={table.handleInput}/>
                        </div>
                        <FilterSelect vm={vm} id="unit" label="Підрозділ" options={data.unitOptions} width="w-48" searchable/>
                        <FilterSelect vm={vm} id="isResponsible" label="Матеріально відповідальний" options={data.isResponsibleOptions} width="w-52"/>
                        <FilterSelect vm={vm} id="trashed" label="Видалений" options={data.trashedOptions} width="w-40"/>
                        <Tooltip content="Скинути фільтри">
                            <Button size="sm" className="h-10" disabled={!vm.hasActiveFilters} onClick={() => table.reset()}>
                                <i className="fa-regular fa-filter-slash"></i>
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                <Table
                    onDoubleClick={(row) => !row?.original?.deleted_at && vm.openEdit(row.id)}
                    loading={vm.isLoading}
                    canSelect={canUpdate}
                    rowSelectable={(row) => !row?.original?.deleted_at}
                    rowSelection={vm.rowSelection}
                    onSelectRow={vm.setRowSelection}
                    canChangeVisibility
                    canChangeResize
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
