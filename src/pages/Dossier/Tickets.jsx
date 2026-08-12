import React, {useMemo, useState} from "react";
import {usePage} from "@inertiajs/react";
import {useQuery} from "@tanstack/react-query";
import {Spinner} from "@material-tailwind/react";
import MultiSelectChip from "../../Components/fields/MultiSelectChip.jsx";
import {fetchAllTickets} from "./entities/dossierTicket/api.js";
import {useTicketOptionsQuery} from "./entities/dossierTicket/queries.js";
import {canChangeLink, canViewProfiles} from "./shared/lib/permissions.js";
import TicketListRow from "./widgets/TicketsModal/TicketListRow.jsx";
import TicketDetailPanel from "./widgets/TicketsModal/TicketDetailPanel.jsx";

const byIds = (options, ids) => options.filter((option) => ids.includes(option.id));

const DEFAULT_FILTERS = {states: [], entityType: null, authorIds: []};

// Дашборд усіх тікетів модуля Досьє (App\Models\DossierTicket) — окрема сторінка
// /dossier/tickets, посилання на неї — з /dossier (кнопка "Тікети" біля "Список сирот").
// Дизайн — master-detail за зразком /task: sticky-панель фільтрів із чипами на основі
// словників GET /api/dossier/tickets/options (той самий принцип, що й TaskFilters +
// GET /api/task/options), компактний список зліва (TaskList), картка деталей справа
// (TaskViewPanel) — TicketDetailPanel, перевикористовує спільний MetaRow з Components/.
// Ізольований модуль: не показує й не редагує App\Models\ProjectTicket.
const Tickets = () => {
    const {auth} = usePage().props;
    const canManage = canChangeLink(auth);
    const {data: options} = useTicketOptionsQuery();
    const stateOptions = options?.states ?? [];
    const entityTypeOptions = options?.entityTypes ?? [];
    const authorOptions = options?.authors ?? [];

    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);

    const hasActive = Boolean(filters.states.length || filters.entityType || filters.authorIds.length);
    const clearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setPage(1);
    };

    const {data, isFetching} = useQuery({
        queryKey: ["dossier-tickets-all", filters, page],
        queryFn: () => fetchAllTickets({
            state: filters.states,
            entityType: filters.entityType,
            authorIds: filters.authorIds,
            page,
            perPage: 50,
        }),
    });

    const tickets = data?.data ?? [];
    const meta = data?.meta;
    const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedId) ?? null, [tickets, selectedId]);

    if (!canViewProfiles(auth)) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    <i className="fa-solid fa-lock mb-2 text-xl"></i>
                    <p>Немає доступу до тікетів досьє.</p>
                </div>
            </div>
        );
    }

    return (
        <div data-i-doc="page:dossier-tickets" className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-[1200px] mx-auto px-4 py-6">
                {/* Sticky-панель фільтрів — той самий принцип, що й TaskFilters на /task */}
                <div className="sticky top-0 z-20 -mx-1 mb-3 flex flex-wrap items-center gap-1.5 bg-gray-100/90 px-1 py-2 backdrop-blur dark:bg-gray-900/90">
                    <h1 className="text-base font-bold flex items-center gap-2 mr-1">
                        <i className="fa-solid fa-ticket"></i>Тікети досьє
                    </h1>
                    <MultiSelectChip
                        label="Стан"
                        icon="fa-regular fa-circle-half-stroke"
                        options={stateOptions}
                        value={byIds(stateOptions, filters.states)}
                        onChange={(selected) => {
                            setFilters((prev) => ({...prev, states: selected.map((o) => o.id)}));
                            setPage(1);
                        }}
                    />
                    <MultiSelectChip
                        label="Автор"
                        icon="fa-regular fa-user-pen"
                        options={authorOptions}
                        value={byIds(authorOptions, filters.authorIds)}
                        onChange={(selected) => {
                            setFilters((prev) => ({...prev, authorIds: selected.map((o) => o.id)}));
                            setPage(1);
                        }}
                    />
                    <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
                         title="Тип привʼязаної сутності">
                        <button
                            type="button"
                            onClick={() => {
                                setFilters((prev) => ({...prev, entityType: null}));
                                setPage(1);
                            }}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                                filters.entityType === null
                                    ? "bg-blue-500 text-white"
                                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            }`}
                        >
                            Усі
                        </button>
                        {entityTypeOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    setFilters((prev) => ({...prev, entityType: option.id}));
                                    setPage(1);
                                }}
                                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                                    filters.entityType === option.id
                                        ? "bg-blue-500 text-white"
                                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                }`}
                            >
                                {option.caption}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={clearFilters}
                        disabled={!hasActive}
                        title={hasActive ? "Скинути всі фільтри" : "Немає активних фільтрів"}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                            hasActive
                                ? "border-red-200 text-red-500 hover:border-red-400 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                                : "cursor-default border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600"
                        }`}
                    >
                        <i className="fa-regular fa-filter-slash text-[10px]"></i>Скинути
                    </button>
                    {Boolean(meta) && (
                        <span className="text-[11px] text-slate-400">
                            {meta.total} {meta.total === 1 ? "тікет" : "тікетів"}
                        </span>
                    )}
                    <a
                        href="/dossier"
                        className="ml-auto text-[12px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                        ← До реєстру досьє
                    </a>
                </div>

                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-gray-900">
                        {isFetching && (
                            <div className="flex justify-center py-10"><Spinner className="h-7 w-7"/></div>
                        )}
                        {!isFetching && tickets.length === 0 && (
                            <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Тікетів немає</div>
                        )}
                        {!isFetching && tickets.map((ticket) => (
                            <TicketListRow
                                key={ticket.id}
                                ticket={ticket}
                                isSelected={ticket.id === selectedId}
                                onClick={() => setSelectedId(ticket.id)}
                            />
                        ))}

                        {meta && meta.pages > 1 && (
                            <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="rounded-md px-2.5 py-1 text-[12px] font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-default disabled:opacity-40 dark:text-blue-400 dark:hover:bg-slate-800"
                                >
                                    ← Назад
                                </button>
                                <span className="text-[12px] text-slate-500 dark:text-slate-400">{meta.page} / {meta.pages}</span>
                                <button
                                    type="button"
                                    disabled={page >= meta.pages}
                                    onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                                    className="rounded-md px-2.5 py-1 text-[12px] font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-default disabled:opacity-40 dark:text-blue-400 dark:hover:bg-slate-800"
                                >
                                    Вперед →
                                </button>
                            </div>
                        )}
                    </div>

                    <TicketDetailPanel
                        ticket={selectedTicket}
                        canManage={canManage}
                        onClose={() => setSelectedId(null)}
                    />
                </div>
            </div>
        </div>
    );
};

export default Tickets;
