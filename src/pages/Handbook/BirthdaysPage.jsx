import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/index.js";
import { BirthdaysViewModel } from "./viewmodel/BirthdayViewModels.js";
import { BIRTHDAY_COMMANDS } from "./model/handbookCommands.js";
import { birthdayImportTemplateUrl } from "./model/birthdayApi.js";
import HandbookLayout from "./view/HandbookLayout.jsx";
import BirthdayFilters from "./view/BirthdayFilters.jsx";
import BirthdayList from "./view/BirthdayList.jsx";
import BirthdayDetailPanel from "./view/BirthdayDetailPanel.jsx";
import BirthdayFormModal from "./view/BirthdayFormModal.jsx";
import ImportModal from "./view/ImportModal.jsx";
import LoadMore from "./view/LoadMore.jsx";
import PageHeader from "../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../layouts/app/HeaderButtons.jsx";

const IMPORT_COLUMNS = [
    { key: "name", label: "Ім'я" },
    { key: "date_of_birth", label: "Дата народження" },
    { key: "note", label: "Примітка" },
];

const BirthdaysView = observer(({ vm }) => {
    if (!vm.canRead) {
        return (
            <HandbookLayout active="birthdays">
                <div className="flex min-h-[50vh] items-center justify-center text-gray-600 dark:text-gray-600">
                    <i className="fa-solid fa-lock mr-2"></i>Немає доступу до довідників.
                </div>
            </HandbookLayout>
        );
    }

    return (
        <HandbookLayout data-i-doc="page:handbook-birthdays" active="birthdays">
            <PageHeader
                title="Дні народження"
                actions={
                    <>
                        {vm.canImport && <HeaderButton tone="default" icon="fa-regular fa-file-arrow-up" title="Імпортувати з Excel" onClick={vm.openImport}>Імпорт</HeaderButton>}
                        <HeaderButton icon="fa-regular fa-plus" onClick={vm.openCreate}>Додати</HeaderButton>
                    </>
                }
            />
            <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <BirthdayFilters
                        q={vm.q} onChangeQ={vm.setQ}
                        scope={vm.scopeFilter} onChangeScope={vm.setScope} scopeOptions={vm.scopeOptions}
                        month={vm.month} onChangeMonth={vm.setMonth}
                        onClear={vm.clearFilters}
                    />
                    <BirthdayList
                        entries={vm.entries}
                        loading={vm.listQuery.isLoading}
                        selectedId={vm.selectedId}
                        onSelect={vm.select}
                        onDelete={vm.remove}
                        auth={vm.auth}
                    />
                    <LoadMore query={vm.listQuery}/>
                </div>
                {vm.selectedId &&
                    <BirthdayDetailPanel key={vm.selectedId} entryId={vm.selectedId} onClose={vm.closeDetail} onDeleted={vm.closeDetail}/>
                }
            </div>

            {vm.createOpen && <BirthdayFormModal onClose={vm.closeCreate} onCreated={vm.select}/>}
            {vm.importOpen &&
                <ImportModal
                    onClose={vm.closeImport}
                    title="Імпорт днів народження"
                    templateUrl={birthdayImportTemplateUrl}
                    columns={IMPORT_COLUMNS}
                    previewSpec={BIRTHDAY_COMMANDS.previewImport}
                    commitSpec={BIRTHDAY_COMMANDS.commitImport}
                    onImported={(entries) => entries?.length && vm.select(entries[0].id)}
                />
            }
        </HandbookLayout>
    );
});

/** Маршрут /handbook-birthdays (pageAccess). */
export default function BirthdaysPage() {
    const vm = useViewModel((deps) => new BirthdaysViewModel(deps));
    return <BirthdaysView vm={vm} />;
}
