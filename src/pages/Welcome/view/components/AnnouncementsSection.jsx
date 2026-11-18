import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";

/** Останні непрочитані оголошення (5 штук) на дашборді. */
const AnnouncementsSection = () => {
    const vm = useVM();
    const { isLoading } = vm.announcementsQuery;

    return (
        <section data-i-doc="widget:welcome-announcements-section" className="rounded-2xl border border-gray-300 bg-white p-4 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/60 dark:border-neutral-700 dark:bg-neutral-800/70 dark:shadow-black/20 dark:ring-0">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Останні оголошення</h3>
                <Link to="/announcement" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Усі оголошення
                </Link>
            </div>

            {!isLoading && vm.announcements.length === 0 &&
                <p className="text-[11px] text-gray-600 dark:text-gray-400">Немає нового</p>
            }

            <ul className="p-0 m-0 list-none">
                {isLoading &&
                    <li className="p-0 m-0 text-[11px] text-gray-600 dark:text-gray-400">Завантаження…</li>
                }
                {vm.announcements.map((announcement) => (
                    <li key={announcement.id} className="p-0 m-0">
                        <Link to={`/announcement?view=${announcement.id}`}
                              className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs transition hover:bg-gray-100 dark:hover:bg-neutral-700">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                                <p className="truncate text-[11px] font-medium text-gray-800 dark:text-gray-200">
                                    {announcement.title}
                                </p>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                                {announcement.created_at ? format(new Date(announcement.created_at), "d MMM", {locale: uk}) : ""}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default observer(AnnouncementsSection);
