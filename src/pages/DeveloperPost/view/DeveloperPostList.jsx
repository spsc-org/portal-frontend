import { observer } from "mobx-react-lite";
import { Spinner } from "@material-tailwind/react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../components/fields/MultiSelectChip.jsx";
import ChipToggle from "../../../components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../components/fields/ChipResetButton.jsx";
import { statusBadge, tagBadge } from "./badges.js";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";

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

/** Ліва колонка. vm — DeveloperPostBoardViewModel; onSelect — вибір (+ ?view=). */
const DeveloperPostList = ({ vm, onSelect }) => {
    const { list } = vm;

    return (
        <div className="flex h-full w-[420px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <PageHeader
                title="Пости"
                documentTitle="Блог розробників"
                actions={vm.canCreate && <HeaderButton icon="fa-solid fa-plus" onClick={vm.openCreate}>Створити</HeaderButton>}
            />
            <div className="border-b border-slate-200 px-4 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">{list.meta.total} усього</div>

            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-neutral-900">
                <SearchInput
                    size="xs"
                    name="q"
                    value={list.q}
                    onChange={(e) => list.setQ(e.target.value)}
                    placeholder="Пошук постів…"
                    icon="fa-regular fa-magnifying-glass"
                />
                <ChipToggle active={list.scopeFilter === "mine"} onClick={list.toggleMine} label="Мої пости"/>
                <ChipToggle active={list.unreadOnly} onClick={list.toggleUnreadOnly}
                            title="Показати лише непрочитані" icon="fa-regular fa-envelope" label="Непрочитані"/>
                <MultiSelectChip label="Тег" icon="fa-regular fa-tag"
                                  options={list.tagOptions} value={list.selectedTags} onChange={list.setTags}/>
                <MultiSelectChip label="Статус" icon="fa-regular fa-circle-half-stroke"
                                  options={list.statusOptions} value={list.selectedStatuses} onChange={list.setStatuses}/>
                <MultiSelectChip label="Автор" icon="fa-regular fa-user-pen"
                                  options={list.authors} value={list.selectedAuthors} onChange={list.setAuthors}/>
                <ChipResetButton onClick={list.resetFilters} hasActive={list.hasActiveFilters}/>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {list.isLoading &&
                    <div className="flex items-center justify-center py-10">
                        <Spinner className="h-6 w-6"/>
                    </div>
                }

                {!list.isLoading && list.posts.length === 0 &&
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                        <i className="fa-regular fa-code-branch mb-2 text-2xl"></i>
                        <p className="text-sm">Постів поки немає</p>
                    </div>
                }

                <div className="flex flex-col gap-2">
                    {list.posts.map((post) => (
                        <DeveloperPostCard
                            key={post.id}
                            post={post}
                            isActive={Number(vm.activeId) === Number(post.id)}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            </div>

            {list.meta.pages > 1 &&
                <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 dark:border-slate-800">
                    <button type="button" onClick={list.prevPage} disabled={list.page <= 1}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition hover:bg-white disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Сторінка {list.meta.page} із {list.meta.pages}</span>
                    <button type="button" onClick={list.nextPage} disabled={list.page >= list.meta.pages}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition hover:bg-white disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            }
        </div>
    );
};


export default observer(DeveloperPostList);
