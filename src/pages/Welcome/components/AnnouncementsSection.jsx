import React from "react";
import {useQuery} from "@tanstack/react-query";
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import {fetchAnnouncements} from "../../Announcement/entities/announcement/api.js";

// Останні НЕПРОЧИТАНІ оголошення на дашборді /welcome — окремий легкий запит
// (не useInfiniteAnnouncementsQuery модуля Announcement), лише 5 штук.
// isRead:false + видимість бекенду (Announcement::scopeVisibleTo) разом дають
// точно "адресовані мені або загальні, і які я ще не бачив" — дашборд не для
// перегляду вже прочитаного, для цього є сама дошка /announcement.
// Чернетки не показуємо навіть автору — це стрічка "що нового", не редактор.
// Рядок списку — той самий мінімалістичний патерн, що й BirthdayList.jsx
// (без картки-бордера, підсвітка лише на hover), для візуальної консистентності
// з рештою дашборду.
const AnnouncementsSection = () => {
    const {data, isLoading} = useQuery({
        queryKey: ["welcome-announcements"],
        queryFn: () => fetchAnnouncements({limit: 5, isRead: false}),
        staleTime: 60 * 1000,
    });

    const announcements = (data?.data || []).filter((a) => !a.is_draft);

    return (
        <section data-i-doc="widget:welcome-announcements-section" className="rounded-2xl border border-slate-300 bg-white p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-black/20 dark:ring-0">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Останні оголошення</h3>
                <a href="/announcement" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Усі оголошення
                </a>
            </div>

            {!isLoading && announcements.length === 0 &&
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Немає нового</p>
            }

            <ul className="p-0 m-0 list-none">
                {isLoading &&
                    <li className="p-0 m-0 text-[11px] text-slate-500 dark:text-slate-400">Завантаження…</li>
                }
                {announcements.map((announcement) => (
                    <li key={announcement.id} className="p-0 m-0">
                        <a href={`/announcement?view=${announcement.id}`}
                           className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                                <p className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                    {announcement.title}
                                </p>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {announcement.created_at ? format(new Date(announcement.created_at), "d MMM", {locale: uk}) : ""}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default AnnouncementsSection;
