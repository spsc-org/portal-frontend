import {useEffect, useState} from "react";

const DEFAULT_FILTERS = {
    q: "",
    typeFilter: [], // subject_type_id[] — порожньо = усі
    modelClassFilter: [], // model_class[] (джерело звʼязку) — порожньо = усі
    reviewOnly: false,
    conflictOnly: false, // лише звʼязки review_reason=conflict (підмножина reviewOnly)
    uaSanctionsStatusFilter: [], // ua_sanctions_status[] — порожньо = усі
    matchedPassFilter: [], // matched_pass[] (спосіб звʼязування — App\Enums\Dossier\MatchedPass) — порожньо = усі
    originFilter: [], // origin[] (ручний/автоматичний — DossierConnection::ORIGIN_*) — порожньо = усі
    ticketStatusFilter: null, // "open"/"resolved" (DossierTicket::STATE_*) — null = усі, без фільтра за тікетами
    expiringWithinDays: null, // поріг "потребують рішення щодо продовження найближчим часом" (50/100/200), null = вимкнено
    hasAvatar: undefined, // undefined = усі; true = лише з фото
    connectionsCountMin: "", // "" = межа неактивна
    connectionsCountMax: "",
    sort: "updated_at",
    direction: "desc",
};

// Старі збережені фільтри (typeFilter був одиничним числом, не масивом) — ігноруємо,
// якщо форма не збігається, замість падіння на некоректному стані.
const sanitize = (stored) => ({
    ...DEFAULT_FILTERS,
    ...stored,
    typeFilter: Array.isArray(stored?.typeFilter) ? stored.typeFilter : DEFAULT_FILTERS.typeFilter,
    modelClassFilter: Array.isArray(stored?.modelClassFilter) ? stored.modelClassFilter : DEFAULT_FILTERS.modelClassFilter,
    uaSanctionsStatusFilter: Array.isArray(stored?.uaSanctionsStatusFilter) ? stored.uaSanctionsStatusFilter : DEFAULT_FILTERS.uaSanctionsStatusFilter,
    matchedPassFilter: Array.isArray(stored?.matchedPassFilter) ? stored.matchedPassFilter : DEFAULT_FILTERS.matchedPassFilter,
    originFilter: Array.isArray(stored?.originFilter) ? stored.originFilter : DEFAULT_FILTERS.originFilter,
});

// Синхронізація з localStorage за location.pathname — той самий патерн, що й
// у ReactPages/Inventory/Index.jsx.
export const useProfilesFilters = () => {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    useEffect(() => {
        const stored = localStorage.getItem(`${location.pathname}-filters`);
        if (stored) {
            setFilters(sanitize(JSON.parse(stored)));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-filters`, JSON.stringify(filters));
    }, [filters]);

    const setQuery = (q) => setFilters((prev) => ({...prev, q}));
    const setTypeFilter = (typeFilter) => setFilters((prev) => ({...prev, typeFilter}));
    const setModelClassFilter = (modelClassFilter) => setFilters((prev) => ({...prev, modelClassFilter}));
    const setUaSanctionsStatusFilter = (uaSanctionsStatusFilter) => setFilters((prev) => ({...prev, uaSanctionsStatusFilter}));
    const setMatchedPassFilter = (matchedPassFilter) => setFilters((prev) => ({...prev, matchedPassFilter}));
    const setOriginFilter = (originFilter) => setFilters((prev) => ({...prev, originFilter}));
    // Клік на вже активне значення — вимикає (toggle) назад до "Усі", а не просто перевибір.
    const setTicketStatusFilter = (ticketStatus) => setFilters((prev) => ({...prev, ticketStatusFilter: prev.ticketStatusFilter === ticketStatus ? null : ticketStatus}));
    // Клік на вже активний поріг — вимикає (toggle), а не просто перевибір.
    const setExpiringWithinDays = (days) => setFilters((prev) => ({...prev, expiringWithinDays: prev.expiringWithinDays === days ? null : days}));
    const toggleReviewOnly = () => setFilters((prev) => ({...prev, reviewOnly: !prev.reviewOnly}));
    const toggleConflictOnly = () => setFilters((prev) => ({...prev, conflictOnly: !prev.conflictOnly}));
    const toggleHasAvatar = () => setFilters((prev) => ({...prev, hasAvatar: prev.hasAvatar ? undefined : true}));
    const setConnectionsCountMin = (connectionsCountMin) => setFilters((prev) => ({...prev, connectionsCountMin}));
    const setConnectionsCountMax = (connectionsCountMax) => setFilters((prev) => ({...prev, connectionsCountMax}));
    const setSort = (sort) => setFilters((prev) => ({...prev, sort}));
    const toggleDirection = () => setFilters((prev) => ({...prev, direction: prev.direction === "asc" ? "desc" : "asc"}));
    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    return {
        filters, setQuery, setTypeFilter, setModelClassFilter, setUaSanctionsStatusFilter, setMatchedPassFilter, setOriginFilter, setExpiringWithinDays,
        toggleReviewOnly, toggleConflictOnly, toggleHasAvatar, setConnectionsCountMin, setConnectionsCountMax, setTicketStatusFilter,
        setSort, toggleDirection, resetFilters,
    };
};
