import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";
import { formatUpdated } from "../../model/welcomeModel.js";
import { CARD, CARD_HEAD, LINK, MUTED, SECTION_TITLE } from "../styles.js";

/** Останні непрочитані оголошення (5 штук); найновіше виділене. */
const AnnouncementsSection = () => {
    const vm = useVM();
    const { isLoading } = vm.announcementsQuery;
    const items = vm.announcements;

    return (
        <section data-i-doc="widget:welcome-announcements-section" aria-labelledby="w-alerts" className={`${CARD} min-w-0 flex-[1_1_280px] overflow-hidden`}>
            <div className={CARD_HEAD}>
                <h2 id="w-alerts" className={SECTION_TITLE}>Оголошення</h2>
                <Link to="/announcement" className={LINK}>Усі</Link>
            </div>
            <div className="flex flex-col gap-3 px-4 py-3">
                {isLoading && <p className={`m-0 ${MUTED}`}>Завантаження…</p>}
                {!isLoading && items.length === 0 && <p className={`m-0 ${MUTED}`}>Нових оголошень немає</p>}
                {items.map((announcement, index) => {
                    const first = index === 0;
                    return (
                        <Link
                            key={announcement.id}
                            to={`/announcement?view=${announcement.id}`}
                            className={`flex flex-col gap-1 rounded-lg p-3 no-underline transition-colors ${
                                first
                                    ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                                    : "border border-gray-200 hover:border-blue-300 dark:border-neutral-700 dark:hover:border-blue-500"
                            }`}
                        >
                            <span className={`text-sm font-bold ${first ? "text-blue-800 dark:text-blue-200" : "text-gray-800 dark:text-gray-100"}`}>
                                {announcement.title}
                            </span>
                            {announcement.details && (
                                <span className={`line-clamp-2 text-[13px] leading-[18px] ${first ? "text-blue-800 dark:text-blue-200" : "text-gray-600 dark:text-gray-400"}`}>
                                    {announcement.details}
                                </span>
                            )}
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                {[announcement.author?.name, announcement.created_at && formatUpdated(announcement.created_at)].filter(Boolean).join(" · ")}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default observer(AnnouncementsSection);
