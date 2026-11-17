import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/index.js";
import { PhonesViewModel } from "./viewmodel/PhoneViewModels.js";
import { PHONE_COMMANDS } from "./model/handbookCommands.js";
import { phoneImportTemplateUrl } from "./model/phoneApi.js";
import HandbookLayout from "./view/HandbookLayout.jsx";
import PhoneFilters from "./view/PhoneFilters.jsx";
import PhoneList from "./view/PhoneList.jsx";
import PhoneDetailPanel from "./view/PhoneDetailPanel.jsx";
import PhoneFormModal from "./view/PhoneFormModal.jsx";
import ImportModal from "./view/ImportModal.jsx";
import LoadMore from "./view/LoadMore.jsx";
import PageHeader from "../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../layouts/app/HeaderButtons.jsx";

// Рядки превʼю — уже ЗГРУПОВАНІ записи-суб'єкти (PhoneImportService::groupRowsIntoEntries()).
const IMPORT_COLUMNS = [
    { key: "name", label: "Ім'я" },
    { key: "department", label: "Підрозділ" },
    {
        key: "phones",
        label: "Номери",
        render: (row) => (
            <div className="flex flex-col gap-0.5">
                {(row.phones || []).map((p, i) => (
                    <span key={i}>
                        {p.phone}
                        {p.note && <span className="ml-1 text-slate-400">({p.note})</span>}
                    </span>
                ))}
            </div>
        ),
    },
    { key: "note", label: "Примітка до особи" },
];

const PhonesView = observer(({ vm }) => {
    const { filters } = vm;

    if (!vm.canRead) {
        return (
            <HandbookLayout active="phones">
                <div className="flex min-h-[50vh] items-center justify-center text-slate-400 dark:text-slate-600">
                    <i className="fa-solid fa-lock mr-2"></i>Немає доступу до довідників.
                </div>
            </HandbookLayout>
        );
    }

    return (
        <HandbookLayout data-i-doc="page:handbook-phones" active="phones">
            <PageHeader
                title="Телефони"
                actions={
                    <>
                        {vm.canImport && <HeaderButton tone="default" icon="fa-regular fa-file-arrow-up" title="Імпортувати з Excel" onClick={vm.openImport}>Імпорт</HeaderButton>}
                        <HeaderButton icon="fa-regular fa-plus" onClick={vm.openCreate}>Додати</HeaderButton>
                    </>
                }
            />
            <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <PhoneFilters
                        q={filters.q} onChangeQ={(v) => vm.setFilter("q", v)}
                        department={filters.department} onChangeDepartment={(v) => vm.setFilter("department", v)} departmentOptions={vm.departmentOptions}
                        status={filters.status} onChangeStatus={(v) => vm.setFilter("status", v)} statusOptions={vm.statusOptions}
                        sort={filters.sort} onChangeSort={(v) => vm.setFilter("sort", v)} sortOptions={vm.sortOptions}
                        direction={filters.direction} onToggleDirection={vm.toggleDirection}
                        onlyFavorite={filters.onlyFavorite} onToggleOnlyFavorite={(v) => vm.setFilter("onlyFavorite", v)}
                        onlyConfirmed={filters.onlyConfirmed} onToggleOnlyConfirmed={(v) => vm.setFilter("onlyConfirmed", v)}
                        onClear={vm.clearFilters}
                    />
                    <PhoneList
                        entries={vm.entries}
                        loading={vm.listQuery.isLoading}
                        selectedId={vm.selectedId}
                        onSelect={vm.select}
                        onEdit={vm.edit}
                        onToggleFavorite={vm.toggleFavorite}
                        auth={vm.auth}
                        showStatusBadge={filters.status !== "active"}
                    />
                    <LoadMore query={vm.listQuery}/>
                </div>
                {vm.selectedId &&
                    <PhoneDetailPanel key={vm.selectedId} entryId={vm.selectedId} onClose={vm.closeDetail} onDeleted={vm.closeDetail}/>
                }
            </div>

            {vm.createOpen && <PhoneFormModal onClose={vm.closeCreate} onCreated={vm.select}/>}
            {vm.editingEntry && <PhoneFormModal key={vm.editingEntry.id} entry={vm.editingEntry} onClose={vm.closeEdit}/>}
            {vm.importOpen &&
                <ImportModal
                    iDoc="modal:handbook-phone-import"
                    onClose={vm.closeImport}
                    title="Імпорт телефонів"
                    templateUrl={phoneImportTemplateUrl}
                    columns={IMPORT_COLUMNS}
                    previewSpec={PHONE_COMMANDS.previewImport}
                    commitSpec={PHONE_COMMANDS.commitImport}
                    onImported={(entries) => entries?.length && vm.select(entries[0].id)}
                />
            }
        </HandbookLayout>
    );
});

/** Маршрут /handbook-phones (pageAccess). */
export default function PhonesPage() {
    const vm = useViewModel((deps) => new PhonesViewModel(deps));
    return <PhonesView vm={vm} />;
}
