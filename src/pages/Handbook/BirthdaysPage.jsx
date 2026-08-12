import React, {useMemo, useState} from "react";
import {usePage} from "@inertiajs/react";
import HandbookLayout from "./shared/ui/HandbookLayout.jsx";
import BirthdayFilters from "./widgets/BirthdayFilters/BirthdayFilters.jsx";
import BirthdayList from "./widgets/BirthdayList/BirthdayList.jsx";
import BirthdayDetailPanel from "./widgets/BirthdayDetailPanel/BirthdayDetailPanel.jsx";
import CreateBirthdayModal from "./features/create-birthday/CreateBirthdayModal.jsx";
import ImportModal from "./shared/ui/ImportModal.jsx";
import {
    useBirthdayOptionsQuery,
    useCommitBirthdayImportMutation,
    useDeleteBirthdayMutation,
    useInfiniteBirthdaysQuery,
    usePreviewBirthdayImportMutation,
} from "./entities/birthday/queries.js";
import {birthdayImportTemplateUrl} from "./entities/birthday/importApi.js";
import {canImportBirthdays, canReadBirthdays} from "./shared/lib/permissions.js";

const IMPORT_COLUMNS = [
    {key: "name", label: "Ім'я"},
    {key: "date_of_birth", label: "Дата народження"},
    {key: "note", label: "Примітка"},
];

const BirthdaysPage = () => {
    const {auth} = usePage().props;
    const [q, setQ] = useState(undefined);
    const [scope, setScope] = useState("all");
    const [month, setMonth] = useState(undefined);
    const [selectedId, setSelectedId] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const previewImportMutation = usePreviewBirthdayImportMutation();
    const commitImportMutation = useCommitBirthdayImportMutation();

    const {data: optionsData} = useBirthdayOptionsQuery();
    const scopeOptions = (optionsData?.scopes || []).filter((option) => option.value !== "all");

    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfiniteBirthdaysQuery({
        q, month, scope: scope === "all" ? undefined : scope,
    });
    const entries = useMemo(() => (data?.pages || []).flatMap((page) => page?.data || []), [data]);

    const deleteMutation = useDeleteBirthdayMutation();

    const handleClear = () => {
        setQ(undefined);
        setScope("all");
        setMonth(undefined);
    };

    const handleDelete = (id) => {
        deleteMutation.mutate(id, {onSuccess: () => setSelectedId((prev) => (prev === id ? null : prev))});
    };

    if (!canReadBirthdays(auth)) {
        return (
            <HandbookLayout active="birthdays">
                <div className="flex min-h-[50vh] items-center justify-center text-slate-400 dark:text-slate-600">
                    <i className="fa-solid fa-lock mr-2"></i>Немає доступу до довідників.
                </div>
            </HandbookLayout>
        );
    }

    return (
        <HandbookLayout data-i-doc="page:handbook-birthdays" active="birthdays">
            <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <BirthdayFilters
                        q={q} onChangeQ={setQ}
                        scope={scope} onChangeScope={setScope} scopeOptions={scopeOptions}
                        month={month} onChangeMonth={setMonth}
                        onClear={handleClear}
                        canCreate onCreate={() => setOpenCreate(true)}
                        canImport={canImportBirthdays(auth)} onImport={() => setOpenImport(true)}
                    />
                    <BirthdayList
                        entries={entries}
                        loading={isLoading}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDelete={handleDelete}
                        auth={auth}
                    />
                    {hasNextPage &&
                        <div className="mt-3 flex justify-center">
                            <button type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                                    className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                {isFetchingNextPage ? "Завантаження…" : "Показати ще"}
                            </button>
                        </div>
                    }
                </div>
                {selectedId &&
                    <BirthdayDetailPanel
                        entryId={selectedId}
                        onClose={() => setSelectedId(null)}
                        onDeleted={() => setSelectedId(null)}
                    />
                }
            </div>

            {openCreate &&
                <CreateBirthdayModal
                    open={openCreate}
                    onClose={() => setOpenCreate(false)}
                    onCreated={(id) => setSelectedId(id)}
                    auth={auth}
                />
            }

            {openImport &&
                <ImportModal
                    open={openImport}
                    onClose={() => setOpenImport(false)}
                    title="Імпорт днів народження"
                    templateUrl={birthdayImportTemplateUrl}
                    columns={IMPORT_COLUMNS}
                    previewMutation={previewImportMutation}
                    commitMutation={commitImportMutation}
                    onImported={(entries) => entries?.length && setSelectedId(entries[0].id)}
                />
            }
        </HandbookLayout>
    );
};

export default BirthdaysPage;
