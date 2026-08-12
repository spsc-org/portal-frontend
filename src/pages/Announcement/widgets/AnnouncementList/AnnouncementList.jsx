import React, {useEffect, useMemo, useState} from "react";
import {Spinner} from "@material-tailwind/react";
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import UserAvatars from "../../../../Components/UserAvatars.jsx";
import SearchInput from "../../../../Components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../../Components/fields/MultiSelectChip.jsx";
import ChipToggle from "../../../../Components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../../Components/fields/ChipResetButton.jsx";
import {useAnnouncementOptionsQuery, useInfiniteAnnouncementsQuery} from "../../entities/announcement/queries.js";

const AnnouncementCard = ({announcement, isActive, onSelect}) => {
    const isUnread = !announcement.is_draft && !announcement.is_read;

    return (
        <button data-i-doc="widget:announcement-list"
            type="button"
            onClick={() => onSelect(announcement.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${
                isActive
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" title="Непрочитано"></span>}
                    <span className={`truncate text-sm ${isUnread ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                        {announcement.title}
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {announcement.is_draft &&
                        <span title="Чернетка — бачите лише ви"
                              className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Чернетка
                        </span>
                    }
                    <span title={announcement.audience_type === "selected" ? "Для обраних користувачів" : "Для всіх користувачів"}
                          className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <i className={`fa-solid ${announcement.audience_type === "selected" ? "fa-user-check" : "fa-users"}`}></i>
                    </span>
                    {!announcement.is_draft && announcement.requires_acknowledgement &&
                    (announcement.is_read ? (
                        <span title="Ви підтвердили прочитання"
                              className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <i className="fa-solid fa-circle-check"></i>
                        </span>
                    ) : (
                        <span title="Потребує підтвердження прочитання"
                              className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <i className="fa-solid fa-circle-check"></i>
                        </span>
                    ))}
                </div>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{announcement.details}</p>
            {!announcement.is_draft && announcement.recipients_count > 0 &&
                <div className="mt-1.5">
                    {announcement.is_fully_read ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <i className="fa-solid fa-check-double"></i>Прочитали всі адресати
                        </span>
                    ) : (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            Прочитали {announcement.recipients_read_count}/{announcement.recipients_count} адресатів
                        </span>
                    )}
                </div>
            }
            <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {announcement.author?.name || "—"} · {announcement.created_at ? format(new Date(announcement.created_at), "d MMM, HH:mm", {locale: uk}) : ""}
                </span>
                <UserAvatars users={announcement.readers || []} max={4}/>
            </div>
        </button>
    );
};

// Той самий принцип персистентності, що й TaskPage.jsx: фільтри відновлюються
// з localStorage одразу при ініціалізації (без окремого effect на монтування),
// щоб перший запит уже йшов з відновленими значеннями.
const FILTERS_STORAGE_KEY = `${location.pathname}-filters`;

const restoreFilters = () => {
    try {
        return JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
};

// Панель фільтрів в один рядок — та сама структура/стилістика, що й
// ReactPages/Task/Components/TaskFilters.jsx: пошук + чипи зліва, дія справа.
const AnnouncementList = ({activeId, onSelect, canCreate, onOpenCreate}) => {
    const [q, setQ] = useState(() => restoreFilters().q || "");
    const [scope, setScope] = useState(() => restoreFilters().scope || "all");
    const [unreadOnly, setUnreadOnly] = useState(() => Boolean(restoreFilters().unreadOnly));
    const [selectedAuthors, setSelectedAuthors] = useState(() => restoreFilters().selectedAuthors || []);

    useEffect(() => {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({q, scope, unreadOnly, selectedAuthors}));
    }, [q, scope, unreadOnly, selectedAuthors]);

    // Словники сторінки (автори + допустимі значення "чиї оголошення") з
    // GET /api/announcement/options — той самий принцип, що й useTaskOptions.
    const {data: optionsData} = useAnnouncementOptionsQuery();
    const authors = optionsData?.authors || [];
    const scopeOptions = (optionsData?.scopes || []).filter((option) => option.value !== "all");

    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfiniteAnnouncementsQuery({
        q: q || undefined,
        isRead: unreadOnly ? false : undefined,
        scope: scope === "all" ? undefined : scope,
        authorIds: selectedAuthors.map((author) => author.id),
    });

    const announcements = useMemo(
        () => (data?.pages || []).flatMap((page) => page?.data || []),
        [data],
    );
    const total = data?.pages?.[0]?.meta?.total ?? 0;

    const hasActive = Boolean(q || scope !== "all" || unreadOnly || selectedAuthors.length);
    const handleReset = () => {
        setQ("");
        setScope("all");
        setUnreadOnly(false);
        setSelectedAuthors([]);
    };

    return (
        <div className="flex h-screen w-[420px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Оголошення</h1>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{total} усього</p>
                </div>
                {canCreate &&
                    <button type="button" onClick={onOpenCreate}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                        <i className="fa-solid fa-plus"></i>
                        Створити
                    </button>
                }
            </div>

            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-neutral-900">
                <SearchInput
                    size="xs"
                    name="q"
                    value={q}
                    onChange={(e) => setQ(e.target.value || "")}
                    placeholder="Пошук оголошень…"
                    icon="fa-regular fa-magnifying-glass"
                />
                {scopeOptions.map((option) => (
                    <ChipToggle
                        key={option.value}
                        active={scope === option.value}
                        onClick={() => setScope(scope === option.value ? "all" : option.value)}
                        label={option.label}
                    />
                ))}
                <ChipToggle
                    active={unreadOnly}
                    onClick={() => setUnreadOnly((prev) => !prev)}
                    title="Показати лише непрочитані"
                    icon="fa-regular fa-envelope"
                    label="Непрочитані"
                />
                <MultiSelectChip label="Автор" icon="fa-regular fa-user-pen"
                                  options={authors} value={selectedAuthors} onChange={setSelectedAuthors}/>
                <ChipResetButton onClick={handleReset} hasActive={hasActive}/>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {isLoading &&
                    <div className="flex items-center justify-center py-10">
                        <Spinner className="h-6 w-6"/>
                    </div>
                }

                {!isLoading && announcements.length === 0 &&
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                        <i className="fa-regular fa-bullhorn mb-2 text-2xl"></i>
                        <p className="text-sm">Оголошень поки немає</p>
                    </div>
                }

                <div className="flex flex-col gap-2">
                    {announcements.map((announcement) => (
                        <AnnouncementCard
                            key={announcement.id}
                            announcement={announcement}
                            isActive={Number(activeId) === Number(announcement.id)}
                            onSelect={onSelect}
                        />
                    ))}
                </div>

                {hasNextPage &&
                    <div className="mt-3 flex justify-center">
                        <button type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                                className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                            {isFetchingNextPage ? "Завантаження…" : "Показати ще"}
                        </button>
                    </div>
                }
            </div>
        </div>
    );
};

export default AnnouncementList;
