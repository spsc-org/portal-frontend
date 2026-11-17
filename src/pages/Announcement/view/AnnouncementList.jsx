import { observer } from "mobx-react-lite";
import { Spinner } from "@material-tailwind/react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import UserAvatars from "../../../components/UserAvatars.jsx";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../components/fields/MultiSelectChip.jsx";
import ChipToggle from "../../../components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../components/fields/ChipResetButton.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";

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

/** Ліва колонка дошки. vm — AnnouncementBoardViewModel; onSelect — вибір (+ синхронізація ?view=). */
const AnnouncementList = ({ vm, onSelect }) => {
    const { list } = vm;

    return (
        <div className="flex h-full w-[420px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <PageHeader
                title="Оголошення"
                actions={vm.canCreate && <HeaderButton icon="fa-solid fa-plus" onClick={vm.openCreate}>Створити</HeaderButton>}
            />
            <div className="border-b border-slate-200 px-4 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">{list.total} усього</div>

            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-neutral-900">
                <SearchInput
                    size="xs"
                    name="q"
                    value={list.q}
                    onChange={(e) => list.setQ(e.target.value)}
                    placeholder="Пошук оголошень…"
                    icon="fa-regular fa-magnifying-glass"
                />
                {list.scopeOptions.map((option) => (
                    <ChipToggle
                        key={option.value}
                        active={list.scopeFilter === option.value}
                        onClick={() => list.toggleScope(option.value)}
                        label={option.label}
                    />
                ))}
                <ChipToggle
                    active={list.unreadOnly}
                    onClick={list.toggleUnreadOnly}
                    title="Показати лише непрочитані"
                    icon="fa-regular fa-envelope"
                    label="Непрочитані"
                />
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

                {!list.isLoading && list.announcements.length === 0 &&
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                        <i className="fa-regular fa-bullhorn mb-2 text-2xl"></i>
                        <p className="text-sm">Оголошень поки немає</p>
                    </div>
                }

                <div className="flex flex-col gap-2">
                    {list.announcements.map((announcement) => (
                        <AnnouncementCard
                            key={announcement.id}
                            announcement={announcement}
                            isActive={Number(vm.activeId) === Number(announcement.id)}
                            onSelect={onSelect}
                        />
                    ))}
                </div>

                {list.listQuery.hasNextPage &&
                    <div className="mt-3 flex justify-center">
                        <button type="button" onClick={list.loadMore} disabled={list.listQuery.isFetchingNextPage}
                                className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                            {list.listQuery.isFetchingNextPage ? "Завантаження…" : "Показати ще"}
                        </button>
                    </div>
                }
            </div>
        </div>
    );
};


export default observer(AnnouncementList);
