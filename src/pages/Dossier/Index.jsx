import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { DossierPageViewModel } from "./viewmodel/DossierViewModels.js";
import { Link } from "react-router";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import {useEffect} from "react";
import {useSearchParams} from "react-router";
import ProfilesMasterList from "./widgets/ProfilesMasterList/ProfilesMasterList.jsx";
import ProfileDetailPane from "./widgets/ProfileDetailPane/ProfileDetailPane.jsx";
import OrphansPanel from "./widgets/OrphansPanel/OrphansPanel.jsx";

// Екран дедуплікації санкційних профілів (master-detail за макетом
// ".claude/Дедуплікація - широкий екран.dc.html"): список профілів зліва, деталі справа.
const Index = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const vm = useViewModel((deps) => new DossierPageViewModel({ ...deps, viewParam: searchParams.get("view") }));
    usePageTitle("Досьє");
    const { filters, activeId, showOrphans } = vm;
    const { canView, canManage, canDeleteProfile: canDelete, canReadAudit: canAudit } = vm.rights;
    const currentUserId = vm.stores.session.userId;
    const setShowOrphans = vm.setShowOrphans;
    // ?view={id} — без нового запису в history (replace), як у Inertia-версії.
    const handleSelect = (id) => {
        vm.select(id);
        setSearchParams((params) => {
            if (id) params.set("view", id); else params.delete("view");
            return params;
        }, { replace: true });
    };
    // Відновлений з localStorage профіль — одразу в адресний рядок.
    useEffect(() => {
        if (vm.activeId && !searchParams.get("view")) handleSelect(vm.activeId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!canView) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-neutral-800">
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400">
                    <i className="fa-solid fa-lock mb-2 text-xl"></i>
                    <p>Немає доступу до перегляду санкційних профілів.</p>
                </div>
            </div>
        );
    }

    return (
        <div data-i-doc="page:sanction-profiles" className="flex h-full overflow-hidden bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
            <ProfilesMasterList
                filters={filters}
                canManage={canManage}
                onQueryChange={vm.setQuery}
                onTypeFilterChange={vm.setTypeFilter}
                onModelClassFilterChange={vm.setModelClassFilter}
                onToggleReviewOnly={vm.toggleReviewOnly}
                onToggleConflictOnly={vm.toggleConflictOnly}
                onUaSanctionsStatusFilterChange={vm.setUaSanctionsStatusFilter}
                onMatchedPassFilterChange={vm.setMatchedPassFilter}
                onOriginFilterChange={vm.setOriginFilter}
                onTicketStatusFilterChange={vm.setTicketStatusFilter}
                onExpiringWithinDaysChange={vm.setExpiringWithinDays}
                onSortChange={vm.setSort}
                onToggleDirection={vm.toggleDirection}
                onConnectionsCountMinChange={vm.setConnectionsCountMin}
                onConnectionsCountMaxChange={vm.setConnectionsCountMax}
                onResetFilters={vm.resetFilters}
                activeId={activeId}
                onSelect={handleSelect}
            />
            <ProfileDetailPane
                key={activeId ?? "none"}
                profileId={activeId}
                canManage={canManage}
                canDeleteProfile={canDelete}
                canReadAudit={canAudit}
                currentUserId={currentUserId}
                onProfileDeleted={() => handleSelect(null)}
                onSelectProfile={handleSelect}
            />
            {showOrphans && (
                <aside className="flex-none w-[460px] border-l border-gray-200 dark:border-neutral-700">
                    <OrphansPanel canManage={canManage} onClose={() => setShowOrphans(false)}/>
                </aside>
            )}
            {canManage && (
                <div className="fixed top-3 right-4 z-30 flex items-center gap-2">
                    <Link
                        to="/dossier/tickets"
                        title="Усі тікети модуля Досьє"
                        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-semibold shadow-md transition bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 dark:bg-neutral-700 dark:border-blue-800 dark:text-blue-400"
                    >
                        <i className="fa-solid fa-ticket text-xs"></i>
                        Тікети
                    </Link>
                    <button
                        type="button"
                        onClick={() => setShowOrphans((prev) => !prev)}
                        title="Проєкти без жодного звʼязку з досьє"
                        className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-semibold shadow-md transition ${
                            showOrphans
                                ? "bg-amber-600 text-white"
                                : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 dark:bg-neutral-700 dark:border-amber-800 dark:text-amber-400"
                        }`}
                    >
                        <i className="fa-solid fa-user-large-slash text-xs"></i>
                        {showOrphans ? "Закрити список сирот" : "Список сирот"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default observer(Index);
