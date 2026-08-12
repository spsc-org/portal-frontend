import React, {useState} from "react";
import {usePage} from "@inertiajs/react";
import ProfilesMasterList from "./widgets/ProfilesMasterList/ProfilesMasterList.jsx";
import ProfileDetailPane from "./widgets/ProfileDetailPane/ProfileDetailPane.jsx";
import OrphansPanel from "./widgets/OrphansPanel/OrphansPanel.jsx";
import {useProfilesFilters} from "./features/filter-profiles/useProfilesFilters.js";
import {canChangeLink, canDeleteProfile, canReadAudit, canViewProfiles} from "./shared/lib/permissions.js";

// Екран дедуплікації санкційних профілів (master-detail за макетом
// ".claude/Дедуплікація - широкий екран.dc.html"): список профілів зліва, деталі справа.
const Index = () => {
    const {auth} = usePage().props;
    const {
        filters, setQuery, setTypeFilter, setModelClassFilter, setUaSanctionsStatusFilter, setMatchedPassFilter, setOriginFilter, setExpiringWithinDays,
        toggleReviewOnly, toggleConflictOnly, toggleHasAvatar, setConnectionsCountMin, setConnectionsCountMax, setTicketStatusFilter,
        setSort, toggleDirection, resetFilters,
    } = useProfilesFilters();
    // Стан панелі "Список сирот" (відкрита/закрита) переживає перезавантаження сторінки —
    // модератор часто тримає її відкритою протягом усієї сесії розбору.
    const showOrphansStorageKey = `${location.pathname}-showOrphans`;
    const [showOrphans, setShowOrphansState] = useState(() => localStorage.getItem(showOrphansStorageKey) === "true");
    const setShowOrphans = (value) => {
        setShowOrphansState((prev) => {
            const next = typeof value === "function" ? value(prev) : value;
            try {
                localStorage.setItem(showOrphansStorageKey, String(next));
            } catch {
                // localStorage може бути недоступним (приватний режим) — ігноруємо
            }
            return next;
        });
    };
    const lastProfileStorageKey = `${location.pathname}-lastProfile`;
    const [activeId, setActiveId] = useState(() => {
        const view = new URLSearchParams(window.location.search).get("view");
        if (view) return Number(view);
        // Немає ?view= в адресному рядку (свіжий заход на сторінку) — відновлюємо
        // останнє відкрите досьє з попереднього візиту.
        const stored = localStorage.getItem(lastProfileStorageKey);
        return stored ? Number(stored) : null;
    });

    // Синхронізує вибір профілю з ?view={id} у адресному рядку (без нового запису в history
    // на кожен клік — replaceState, як у legacy ProjectCardManager для ?card=) і з localStorage
    // (переживає закриття вкладки/повернення на голий /dossier без параметра).
    const handleSelect = (id) => {
        setActiveId(id);

        const url = new URL(window.location.href);
        if (id) {
            url.searchParams.set("view", id);
            localStorage.setItem(lastProfileStorageKey, String(id));
        } else {
            url.searchParams.delete("view");
            localStorage.removeItem(lastProfileStorageKey);
        }
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    };

    if (!canViewProfiles(auth)) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    <i className="fa-solid fa-lock mb-2 text-xl"></i>
                    <p>Немає доступу до перегляду санкційних профілів.</p>
                </div>
            </div>
        );
    }

    return (
        <div data-i-doc="page:sanction-profiles" className="flex h-screen overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <ProfilesMasterList
                filters={filters}
                canManage={canChangeLink(auth)}
                onQueryChange={setQuery}
                onTypeFilterChange={setTypeFilter}
                onModelClassFilterChange={setModelClassFilter}
                onToggleReviewOnly={toggleReviewOnly}
                onToggleConflictOnly={toggleConflictOnly}
                onUaSanctionsStatusFilterChange={setUaSanctionsStatusFilter}
                onMatchedPassFilterChange={setMatchedPassFilter}
                onOriginFilterChange={setOriginFilter}
                onTicketStatusFilterChange={setTicketStatusFilter}
                onExpiringWithinDaysChange={setExpiringWithinDays}
                onSortChange={setSort}
                onToggleDirection={toggleDirection}
                onConnectionsCountMinChange={setConnectionsCountMin}
                onConnectionsCountMaxChange={setConnectionsCountMax}
                onResetFilters={resetFilters}
                activeId={activeId}
                onSelect={handleSelect}
            />
            <ProfileDetailPane
                profileId={activeId}
                canManage={canChangeLink(auth)}
                canDeleteProfile={canDeleteProfile(auth)}
                canReadAudit={canReadAudit(auth)}
                currentUserId={auth?.user?.id}
                onProfileDeleted={() => handleSelect(null)}
                onSelectProfile={handleSelect}
            />
            {showOrphans && (
                <aside className="flex-none w-[460px] border-l border-gray-200 dark:border-gray-700">
                    <OrphansPanel canManage={canChangeLink(auth)} onClose={() => setShowOrphans(false)}/>
                </aside>
            )}
            {canChangeLink(auth) && (
                <div className="fixed top-3 right-4 z-30 flex items-center gap-2">
                    <a
                        href="/dossier/tickets"
                        title="Усі тікети модуля Досьє"
                        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-semibold shadow-md transition bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 dark:bg-gray-800 dark:border-blue-800 dark:text-blue-400"
                    >
                        <i className="fa-solid fa-ticket text-xs"></i>
                        Тікети
                    </a>
                    <button
                        type="button"
                        onClick={() => setShowOrphans((prev) => !prev)}
                        title="Проєкти без жодного звʼязку з досьє"
                        className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-semibold shadow-md transition ${
                            showOrphans
                                ? "bg-amber-600 text-white"
                                : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 dark:bg-gray-800 dark:border-amber-800 dark:text-amber-400"
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

export default Index;
