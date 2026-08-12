import React, {useEffect, useMemo, useState} from "react";
import {Spinner} from "@material-tailwind/react";
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import SearchInput from "../../../../Components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../../Components/fields/MultiSelectChip.jsx";
import ChipToggle from "../../../../Components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../../Components/fields/ChipResetButton.jsx";
import {tagBadge, statusBadge} from "../../shared/ui/badges.js";
import {useDeveloperPostOptionsQuery, useDeveloperPostsQuery} from "../../entities/developerPost/queries.js";

const DeveloperPostCard = ({post, isActive, onSelect}) => {
    const isUnread = post.status === "published" && !post.is_read;
    const postTags = post.tags || [];
    const status = statusBadge(post.status);

    return (
        <button data-i-doc="widget:developer-post-list"
            type="button"
            onClick={() => onSelect(post.id)}
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
                        {post.title}
                    </span>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    v{post.version}
                </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {postTags.map((t) => {
                        const badge = tagBadge(t);
                        return badge && <span key={t} className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge.className}`}>{badge.label}</span>;
                    })}
                    {post.status !== "published" &&
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${status.className}`}>{status.label}</span>
                    }
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {post.author?.name || "—"} · {post.created_at ? format(new Date(post.created_at), "d MMM, HH:mm", {locale: uk}) : ""}
                </span>
            </div>
        </button>
    );
};

// Той самий принцип персистентності, що й TaskPage.jsx/AnnouncementList.jsx:
// фільтри відновлюються з localStorage одразу при ініціалізації.
const FILTERS_STORAGE_KEY = `${location.pathname}-filters`;

const restoreFilters = () => {
    try {
        return JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
};

// Панель фільтрів в один рядок — та сама структура/стилістика, що й
// ReactPages/Task/Components/TaskFilters.jsx і Announcement/widgets/AnnouncementList,
// через спільні атомарні компоненти (SearchInput/MultiSelectChip/ChipToggle/ChipResetButton).
// На відміну від Task/Announcement — КЛАСИЧНА пагінація (сторінки), не "показати ще".
const DeveloperPostList = ({activeId, onSelect, canCreate, onOpenCreate}) => {
    const [q, setQ] = useState(() => restoreFilters().q || "");
    const [scope, setScope] = useState(() => restoreFilters().scope || "all");
    const [unreadOnly, setUnreadOnly] = useState(() => Boolean(restoreFilters().unreadOnly));
    const [selectedAuthors, setSelectedAuthors] = useState(() => restoreFilters().selectedAuthors || []);
    const [selectedTags, setSelectedTags] = useState(() => restoreFilters().selectedTags || []);
    const [selectedStatuses, setSelectedStatuses] = useState(() => restoreFilters().selectedStatuses || []);
    const [page, setPage] = useState(1);

    useEffect(() => {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({q, scope, unreadOnly, selectedAuthors, selectedTags, selectedStatuses}));
    }, [q, scope, unreadOnly, selectedAuthors, selectedTags, selectedStatuses]);

    useEffect(() => {
        setPage(1);
    }, [q, scope, unreadOnly, selectedAuthors, selectedTags, selectedStatuses]);

    // Словники сторінки (автори/теги/статуси) з GET /api/developer-post/options —
    // той самий принцип, що й useTaskOptions/useAnnouncementOptionsQuery.
    const {data: optionsData} = useDeveloperPostOptionsQuery();
    const authors = optionsData?.authors || [];
    const tagOptions = useMemo(() => (optionsData?.tags || []).map((t) => ({id: t.value, label: t.label})), [optionsData]);
    const statusOptions = useMemo(() => (optionsData?.statuses || []).map((s) => ({id: s.value, label: s.label})), [optionsData]);

    const {data, isLoading} = useDeveloperPostsQuery({
        page,
        limit: 20,
        q: q || undefined,
        isRead: unreadOnly ? false : undefined,
        scope: scope === "all" ? undefined : scope,
        authorIds: selectedAuthors.map((author) => author.id),
        tags: selectedTags.map((tag) => tag.id),
        statuses: selectedStatuses.map((status) => status.id),
    });

    const posts = data?.data || [];
    const meta = data?.meta || {total: 0, page: 1, pages: 1};

    const hasActive = Boolean(q || scope !== "all" || unreadOnly || selectedAuthors.length || selectedTags.length || selectedStatuses.length);
    const handleReset = () => {
        setQ("");
        setScope("all");
        setUnreadOnly(false);
        setSelectedAuthors([]);
        setSelectedTags([]);
        setSelectedStatuses([]);
    };

    return (
        <div className="flex h-full w-[420px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Оновлення</h1>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{meta.total} усього</p>
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
                    placeholder="Пошук постів…"
                    icon="fa-regular fa-magnifying-glass"
                />
                <ChipToggle active={scope === "mine"} onClick={() => setScope(scope === "mine" ? "all" : "mine")} label="Мої пости"/>
                <ChipToggle active={unreadOnly} onClick={() => setUnreadOnly((prev) => !prev)}
                            title="Показати лише непрочитані" icon="fa-regular fa-envelope" label="Непрочитані"/>
                <MultiSelectChip label="Тег" icon="fa-regular fa-tag"
                                  options={tagOptions} value={selectedTags} onChange={setSelectedTags}/>
                <MultiSelectChip label="Статус" icon="fa-regular fa-circle-half-stroke"
                                  options={statusOptions} value={selectedStatuses} onChange={setSelectedStatuses}/>
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

                {!isLoading && posts.length === 0 &&
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                        <i className="fa-regular fa-code-branch mb-2 text-2xl"></i>
                        <p className="text-sm">Постів поки немає</p>
                    </div>
                }

                <div className="flex flex-col gap-2">
                    {posts.map((post) => (
                        <DeveloperPostCard
                            key={post.id}
                            post={post}
                            isActive={Number(activeId) === Number(post.id)}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            </div>

            {meta.pages > 1 &&
                <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 dark:border-slate-800">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition hover:bg-white disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Сторінка {meta.page} із {meta.pages}</span>
                    <button type="button" onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={page >= meta.pages}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition hover:bg-white disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            }
        </div>
    );
};

export default DeveloperPostList;
