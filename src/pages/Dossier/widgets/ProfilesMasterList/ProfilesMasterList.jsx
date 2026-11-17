import { observer } from "mobx-react-lite";
import toast from "react-hot-toast";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { ProfilesListViewModel } from "../../viewmodel/DossierViewModels.js";
import {useEffect} from "react";
import {Spinner} from "@material-tailwind/react";
import SearchInput from "../../../../components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../../components/fields/MultiSelectChip.jsx";
import {profileTitle} from "../../entities/dossier/model.js";
import {TYPE_FILTERS} from "../../shared/config/subjectTypes.js";
import {MODEL_CLASS_OPTIONS} from "../../shared/config/sourceTypes.js";
import SubjectAvatar from "../../entities/dossier/ui/SubjectAvatar.jsx";
import ToggleChip from "../../shared/ui/ToggleChip.jsx";
import NumberRangeFilter from "../../shared/ui/NumberRangeFilter.jsx";
import SectionLabel from "../../shared/ui/SectionLabel.jsx";
import ModeratorBlock from "../../shared/ui/ModeratorBlock.jsx";
import {STATE_OPEN, STATE_RESOLVED} from "../../entities/dossierTicket/model.js";
import SanctionsStatusBadge from "../../shared/ui/SanctionsStatusBadge.jsx";
import SortFieldMenu from "../../shared/ui/SortFieldMenu.jsx";
import SortDirectionButton from "../../shared/ui/SortDirectionButton.jsx";

const COMPACT_STORAGE_KEY = "sanctionProfiles.masterList.compact";
const PAGE_SIZE_STORAGE_KEY = "sanctionProfiles.masterList.pageSize";
const PAGE_SIZE_OPTIONS = [50, 100, 200];
const DEFAULT_PAGE_SIZE = 100;

const readCompactPreference = () => {
    try {
        return localStorage.getItem(COMPACT_STORAGE_KEY) === "true";
    } catch {
        return false;
    }
};

const readPageSizePreference = () => {
    try {
        const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
        return PAGE_SIZE_OPTIONS.includes(stored) ? stored : DEFAULT_PAGE_SIZE;
    } catch {
        return DEFAULT_PAGE_SIZE;
    }
};

// Тип суб'єкта у вигляді опцій для MultiSelectChip (value:0 "Усі" тут не потрібне —
// порожній вибір і так означає "усі").
const SUBJECT_TYPE_OPTIONS = TYPE_FILTERS.filter((def) => def.value !== 0)
    .map((def) => ({id: def.value, caption: def.label}));

const byIds = (options, ids) => options.filter((option) => ids.includes(option.id));

// Квапилка "потребують рішення щодо продовження найближчим часом" — окремо від
// MultiSelectChip "Підсанкційність" (той — категорії, це — поріг у днях, не поєднуємо).
const EXPIRING_DAYS_OPTIONS = [50, 100, 200, 300];

// Фільтр за станом тікетів, привʼязаних до профілю (DossierTicket::STATE_*) —
// null = усі, без фільтра.
const TICKET_STATUS_OPTIONS = [
    {id: null, label: "Усі"},
    {id: STATE_RESOLVED, label: "Із вирішеними тікетами"},
    {id: STATE_OPEN, label: "Із відкритими тікетами"},
];

// Стандартний мінімальний набір "для проформи" — розширюється за потреби (DossierService::SORTABLE_COLUMNS).
const SORT_OPTIONS = [
    {id: "updated_at", caption: "Оновлено"},
    {id: "created_at", caption: "Створено"},
    {id: "view_caption", caption: "Назва"},
    {id: "connections_count", caption: "К-сть звʼязків"},
    {id: "ua_sanctions_days_remaining", caption: "Днів до завершення санкцій"},
];

// Копіювання id (досьє чи ДРС) у буфер — зручно шукати кандидата тут і одразу вставити
// у поле "id досьє" панелі "Список сирот" (не звʼязані програмно, лише вручну).
const copyProfileId = (event, value) => {
    event.stopPropagation();
    navigator.clipboard.writeText(String(value));
    toast.success(`Скопійовано: ${value}`);
};

// Ліва колонка майстер-списку (за макетом "Дедуплікація - широкий екран"):
// FULLTEXT-пошук, фільтри (тип суб'єкта, джерело звʼязку, потребує підтвердження,
// наявність аватара, діапазон к-сті звʼязків — усі компоненти спільні з /task), скрол-список.
const ProfilesMasterList = ({
    filters,
    onQueryChange,
    onTypeFilterChange,
    onModelClassFilterChange,
    onToggleReviewOnly,
    onToggleConflictOnly,
    onUaSanctionsStatusFilterChange,
    onMatchedPassFilterChange,
    onOriginFilterChange,
    onTicketStatusFilterChange,
    onExpiringWithinDaysChange,
    onSortChange,
    onToggleDirection,
    onConnectionsCountMinChange,
    onConnectionsCountMaxChange,
    onResetFilters,
    canManage,
    excludeId,
    activeId,
    onSelect,
}) => {
    const vm = useViewModel((deps) => new ProfilesListViewModel({
        ...deps,
        filters,
        readCompact: readCompactPreference,
        readPageSize: readPageSizePreference,
    }));
    const { isCompact, pageSize, refreshingId, total } = vm;
    const setIsCompact = vm.setIsCompact;
    const setPageSize = vm.setPageSize;
    const options = vm.options;
    const UA_STATUS_OPTIONS = options?.uaSanctionsStatuses ?? [];
    const MATCHED_PASS_OPTIONS = options?.matchedPasses ?? [];
    const ORIGIN_OPTIONS = options?.connectionOrigins ?? [];
    const refreshStatusMutation = { mutate: vm.refreshStatus, isPending: vm.refreshCmd.isPending };
    const { isFetching, hasNextPage, isFetchingNextPage } = vm.listQuery;
    const fetchNextPage = () => vm.listQuery.fetchNextPage();
    const profiles = vm.profiles(excludeId);
    // Фільтри — проп (сторінка або модалка переносу): синхронізуємо у VM.
    useEffect(() => vm.setFilters(filters), [vm, filters]);

    return (
        <section data-i-doc="view:sanction-profiles-master-list" className="flex-none w-[30%] bg-white border-r border-gray-200 flex flex-col min-w-0 dark:bg-gray-900 dark:border-gray-700">
            <div className="px-5 pt-[18px] pb-3.5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-baseline justify-between gap-2.5">
                    <SectionLabel>Реєстр досьє</SectionLabel>
                </div>
                <div className="mt-[13px]">
                    <SearchInput
                        size="xs"
                        name="q"
                        value={filters.q}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="Пошук"
                        icon="fa-solid fa-magnifying-glass"
                    />
                </div>
                {/* Загальні фільтри — доступні всім, хто бачить Реєстр досьє (profileView). */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <MultiSelectChip
                        label="Тип"
                        icon="fa-solid fa-shapes"
                        options={SUBJECT_TYPE_OPTIONS}
                        value={byIds(SUBJECT_TYPE_OPTIONS, filters.typeFilter)}
                        onChange={(selected) => onTypeFilterChange(selected.map((option) => option.id))}
                    />
                    <MultiSelectChip
                        label="Підсанкційність"
                        icon="fa-solid fa-shield-halved"
                        options={UA_STATUS_OPTIONS}
                        value={byIds(UA_STATUS_OPTIONS, filters.uaSanctionsStatusFilter)}
                        onChange={(selected) => onUaSanctionsStatusFilterChange(selected.map((option) => option.id))}
                    />
                    <div
                        className="inline-flex items-center gap-1 h-[30px] px-[9px] rounded-full border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                        title="Потребують рішення щодо продовження найближчим часом"
                    >
                        <i className="fa-solid fa-hourglass-half text-amber-500 text-[10px]"></i>
                        {EXPIRING_DAYS_OPTIONS.map((days) => (
                            <button
                                key={days}
                                type="button"
                                onClick={() => onExpiringWithinDaysChange(days)}
                                className={`rounded-full px-2 py-[3px] text-[10.5px] font-semibold transition ${
                                    filters.expiringWithinDays === days
                                        ? "bg-amber-600 text-white"
                                        : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                }`}
                            >
                                {days}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={onResetFilters}
                        title="Скинути всі фільтри та пошук"
                        className="inline-flex items-center gap-1.5 h-[30px] px-[11px] rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                        <i className="fa-solid fa-filter-circle-xmark text-[10px]"></i>Скинути
                    </button>
                </div>

                <ModeratorBlock canManage={canManage} label="Фільтри модератора" className="mt-2">
                    <MultiSelectChip
                        label="Джерело"
                        icon="fa-solid fa-database"
                        options={MODEL_CLASS_OPTIONS}
                        value={byIds(MODEL_CLASS_OPTIONS, filters.modelClassFilter)}
                        onChange={(selected) => onModelClassFilterChange(selected.map((option) => option.id))}
                    />
                    <MultiSelectChip
                        label="Спосіб звʼязування"
                        icon="fa-solid fa-diagram-project"
                        options={MATCHED_PASS_OPTIONS}
                        value={byIds(MATCHED_PASS_OPTIONS, filters.matchedPassFilter)}
                        onChange={(selected) => onMatchedPassFilterChange(selected.map((option) => option.id))}
                    />
                    <MultiSelectChip
                        label="Ручний/автоматичний"
                        icon="fa-solid fa-hand"
                        options={ORIGIN_OPTIONS}
                        value={byIds(ORIGIN_OPTIONS, filters.originFilter)}
                        onChange={(selected) => onOriginFilterChange(selected.map((option) => option.id))}
                    />
                    <div
                        className="inline-flex items-center gap-1 h-[30px] px-[9px] rounded-full border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                        title="Фільтр за станом тікетів, привʼязаних до профілю"
                    >
                        <i className="fa-solid fa-ticket text-purple-500 text-[10px]"></i>
                        {TICKET_STATUS_OPTIONS.map(({id, label}) => (
                            <button
                                key={id ?? "all"}
                                type="button"
                                onClick={() => onTicketStatusFilterChange(id)}
                                className={`rounded-full px-2 py-[3px] text-[10.5px] font-semibold transition ${
                                    filters.ticketStatusFilter === id
                                        ? "bg-purple-600 text-white"
                                        : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <ToggleChip
                        active={false}
                        disabled
                        onClick={onToggleReviewOnly}
                        icon="fa-solid fa-flag"
                        label="Необхідно підтвердити"
                        title="Тимчасово вимкнено — фільтр працює некоректно"
                        activeClasses="bg-orange-600 text-white border-orange-600"
                        idleClasses="bg-white text-orange-600 border-orange-200 hover:bg-orange-50 dark:bg-gray-800 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/40"
                    />
                    <ToggleChip
                        active={filters.conflictOnly}
                        onClick={onToggleConflictOnly}
                        icon="fa-solid fa-code-compare"
                        label="Конфліктні"
                        title="Той самий субʼєкт/проєкт веде на кілька різних досьє одночасно"
                        activeClasses="bg-red-600 text-white border-red-600"
                        idleClasses="bg-white text-red-600 border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40"
                    />
                    <NumberRangeFilter
                        icon="fa-solid fa-link"
                        label="Звʼязків"
                        valueMin={filters.connectionsCountMin}
                        valueMax={filters.connectionsCountMax}
                        onChangeMin={onConnectionsCountMinChange}
                        onChangeMax={onConnectionsCountMaxChange}
                    />
                </ModeratorBlock>
                <div className="flex items-center justify-between mt-[11px]">
                    <div className="text-[11.5px] font-semibold text-gray-400">
                        meta.total: <span className="text-blue-600 dark:text-blue-400">{total}</span> профілів
                    </div>
                    <div className="flex items-center gap-2">
                        <SortFieldMenu options={SORT_OPTIONS} value={filters.sort} onChange={onSortChange}/>
                        <SortDirectionButton direction={filters.direction} onToggle={onToggleDirection}/>
                        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 p-0.5 dark:border-gray-700"
                             title="Розмір сторінки завантаження">
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => setPageSize(size)}
                                    className={`rounded px-[7px] py-[3px] text-[10.5px] font-semibold transition ${
                                        pageSize === size
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCompact((prev) => !prev)}
                            title={isCompact ? "Звичайний вигляд" : "Компактний вигляд"}
                            className="flex-none w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                        >
                            <i className={`fa-solid ${isCompact ? "fa-list" : "fa-table-list"} text-[13px]`}></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isFetching && !profiles.length && (
                    <div className="flex justify-center py-10"><Spinner className="h-8 w-8"/></div>
                )}
                {!isFetching && !profiles.length && (
                    <div className="py-10 text-center text-sm text-gray-400">Профілів не знайдено</div>
                )}
                {profiles.map((profile) => {
                    const isActive = profile.id === activeId;
                    const needsReview = (profile.needs_review_connections_count ?? 0) > 0;
                    const hasConflict = (profile.conflicting_connections_count ?? 0) > 0;
                    return (
                        <div
                            key={profile.id}
                            onClick={() => onSelect(profile.id)}
                            className={`flex items-center gap-[13px] ${isCompact ? "px-[18px] py-2" : "px-[18px] py-3.5"} border-b border-gray-100 cursor-pointer border-l-[3px] transition-colors dark:border-b-gray-800 ${
                                isActive
                                    ? "bg-blue-50 border-l-blue-600 dark:bg-blue-900/25"
                                    : "bg-white border-l-transparent hover:bg-slate-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                            }`}
                        >
                            <SubjectAvatar
                                subjectTypeId={profile.subject_type_id}
                                avatarUrl={profile.avatar_url}
                                caption={profileTitle(profile)}
                                size={isCompact ? "xs" : "md"}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-[7px]">
                                    <span className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
                                        {profileTitle(profile)}
                                    </span>
                                    {!isCompact && hasConflict && (
                                        <span
                                            title="Конфліктний звʼязок: субʼєкт веде на кілька різних досьє"
                                            className="flex-none inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 text-[8px] dark:bg-red-900/50 dark:text-red-300"
                                        >
                                            <i className="fa-solid fa-code-compare"></i>
                                        </span>
                                    )}
                                    {!isCompact && needsReview && !hasConflict && (
                                        <span className="flex-none inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[8px] dark:bg-orange-900/50 dark:text-orange-300">
                                            <i className="fa-solid fa-flag"></i>
                                        </span>
                                    )}
                                </div>
                                {!isCompact && (
                                    <div className="text-[11px] font-mono font-semibold text-gray-400 mt-[3px] truncate">
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            title="Скопіювати id досьє"
                                            onClick={(e) => copyProfileId(e, profile.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") copyProfileId(e, profile.id);
                                            }}
                                            className="hover:text-blue-600 dark:hover:text-blue-400"
                                        >
                                            Досьє #{profile.id}
                                        </span>
                                        {" "}·{" "}
                                        {profile.drs_id ? (
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                title="Скопіювати ДРС id"
                                                onClick={(e) => copyProfileId(e, profile.drs_id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") copyProfileId(e, profile.drs_id);
                                                }}
                                                className="hover:text-blue-600 dark:hover:text-blue-400"
                                            >
                                                ДРС #{profile.drs_id}
                                            </span>
                                        ) : (
                                            <>ДРС #—</>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex-none flex flex-col items-end gap-1.5">
                                <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-[3px] rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                                    <i className="fa-solid fa-link text-[9px]"></i>{profile.connections_count ?? 0}
                                </span>
                                {!isCompact && (
                                    <span onClick={(e) => e.stopPropagation()}>
                                        <SanctionsStatusBadge
                                            status={profile.ua_sanctions_status}
                                            daysRemaining={profile.ua_sanctions_days_remaining}
                                            variant="compact"
                                            onRefresh={() => refreshStatusMutation.mutate(profile.id)}
                                            isRefreshing={refreshingId === profile.id}
                                        />
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {hasNextPage && (
                    <button
                        type="button"
                        disabled={isFetchingNextPage}
                        onClick={() => fetchNextPage()}
                        className="w-full py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-gray-800"
                    >
                        {isFetchingNextPage ? "Завантаження…" : `Показати ще (${profiles.length} із ${total})`}
                    </button>
                )}
            </div>
        </section>
    );
};

export default observer(ProfilesMasterList);
