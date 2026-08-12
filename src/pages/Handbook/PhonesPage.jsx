import React, {useEffect, useMemo, useState} from "react";
import {usePage} from "@inertiajs/react";
import HandbookLayout from "./shared/ui/HandbookLayout.jsx";
import PhoneFilters from "./widgets/PhoneFilters/PhoneFilters.jsx";
import PhoneList from "./widgets/PhoneList/PhoneList.jsx";
import PhoneDetailPanel from "./widgets/PhoneDetailPanel/PhoneDetailPanel.jsx";
import CreatePhoneModal from "./features/create-phone/CreatePhoneModal.jsx";
import EditPhoneModal from "./features/edit-phone/EditPhoneModal.jsx";
import ImportPhoneModal from "./features/import-phone/ImportPhoneModal.jsx";
import {
    useCommitPhoneImportMutation,
    useInfinitePhonesQuery,
    usePhoneOptionsQuery,
    usePreviewPhoneImportMutation,
    useTogglePhoneFavoriteMutation,
} from "./entities/phone/queries.js";
import {phoneImportTemplateUrl} from "./entities/phone/importApi.js";
import {canImportPhones, canReadPhones} from "./shared/lib/permissions.js";

// Рядки превʼю тепер — уже ЗГРУПОВАНІ записи-суб'єкти (кілька Excel-рядків
// з однаковим Ім'я+Підрозділ схлопнулись в один запис із кількома
// номерами) — див. PhoneImportService::groupRowsIntoEntries().
const IMPORT_COLUMNS = [
    {key: "name", label: "Ім'я"},
    {key: "department", label: "Підрозділ"},
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
    {key: "note", label: "Примітка до особи"},
];

// Пошук/фільтри — у localStorage, щоб не скидались при кожному новому візиті
// сторінки (пряма вимога користувача).
const FILTERS_STORAGE_KEY = "handbook-phones-filters";

const loadStoredFilters = () => {
    try {
        const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

const PhonesPage = () => {
    const {auth} = usePage().props;
    const [q, setQ] = useState(() => loadStoredFilters().q);
    const [department, setDepartment] = useState(() => {
        const stored = loadStoredFilters().department;
        return Array.isArray(stored) ? stored : [];
    });
    const [status, setStatus] = useState(() => loadStoredFilters().status || "active");
    const [sort, setSort] = useState(() => loadStoredFilters().sort || "name");
    const [direction, setDirection] = useState(() => loadStoredFilters().direction || "asc");
    const [onlyFavorite, setOnlyFavorite] = useState(() => loadStoredFilters().onlyFavorite || false);
    const [onlyConfirmed, setOnlyConfirmed] = useState(() => loadStoredFilters().onlyConfirmed || false);
    const [selectedId, setSelectedId] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const previewImportMutation = usePreviewPhoneImportMutation();
    const commitImportMutation = useCommitPhoneImportMutation();

    const {data: optionsData} = usePhoneOptionsQuery();
    const statusOptions = optionsData?.statuses || [];
    const departmentOptions = optionsData?.departments || [];
    const sortOptions = (optionsData?.sorts || []).map((option) => ({value: option.value, label: option.label}));

    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfinitePhonesQuery({
        q, department: department.length ? department : undefined,
        status, sort, direction, onlyFavorite, onlyConfirmed,
    });
    const entries = useMemo(() => (data?.pages || []).flatMap((page) => page?.data || []), [data]);

    useEffect(() => {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({q, department, status, sort, direction, onlyFavorite, onlyConfirmed}));
    }, [q, department, status, sort, direction, onlyFavorite, onlyConfirmed]);

    const toggleFavoriteMutation = useTogglePhoneFavoriteMutation();

    const handleClear = () => {
        setQ(undefined);
        setDepartment([]);
        setStatus("active");
        setSort("name");
        setDirection("asc");
        setOnlyFavorite(false);
        setOnlyConfirmed(false);
    };

    if (!canReadPhones(auth)) {
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
            <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <PhoneFilters
                        q={q} onChangeQ={setQ}
                        department={department} onChangeDepartment={setDepartment} departmentOptions={departmentOptions}
                        status={status} onChangeStatus={setStatus} statusOptions={statusOptions}
                        sort={sort} onChangeSort={setSort} sortOptions={sortOptions}
                        direction={direction} onToggleDirection={() => setDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
                        onlyFavorite={onlyFavorite} onToggleOnlyFavorite={setOnlyFavorite}
                        onlyConfirmed={onlyConfirmed} onToggleOnlyConfirmed={setOnlyConfirmed}
                        onClear={handleClear}
                        canCreate onCreate={() => setOpenCreate(true)}
                        canImport={canImportPhones(auth)} onImport={() => setOpenImport(true)}
                    />
                    <PhoneList
                        entries={entries}
                        loading={isLoading}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onEdit={setEditingEntry}
                        onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                        auth={auth}
                        showStatusBadge={status !== "active"}
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
                    <PhoneDetailPanel
                        entryId={selectedId}
                        onClose={() => setSelectedId(null)}
                        onDeleted={() => setSelectedId(null)}
                    />
                }
            </div>

            {openCreate &&
                <CreatePhoneModal
                    open={openCreate}
                    onClose={() => setOpenCreate(false)}
                    onCreated={(id) => setSelectedId(id)}
                />
            }

            {editingEntry &&
                <EditPhoneModal
                    open={Boolean(editingEntry)}
                    onClose={() => setEditingEntry(null)}
                    entry={editingEntry}
                />
            }

            {openImport &&
                <ImportPhoneModal
                    open={openImport}
                    onClose={() => setOpenImport(false)}
                    title="Імпорт телефонів"
                    templateUrl={phoneImportTemplateUrl}
                    columns={IMPORT_COLUMNS}
                    previewMutation={previewImportMutation}
                    commitMutation={commitImportMutation}
                    onImported={(entries) => entries?.length && setSelectedId(entries[0].id)}
                />
            }
        </HandbookLayout>
    );
};

export default PhonesPage;
