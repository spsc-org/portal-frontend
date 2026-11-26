import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";
import { formatUpdated } from "../../model/welcomeModel.js";
import { BADGE, BADGE_TONES, CARD, CARD_HEAD, LINK, MUTED, SECTION_TITLE } from "../styles.js";

const TH = "px-4 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400";
const TD = "px-4 py-3 align-middle";

/** Останні додані проєкти (картка проєкту — ?card={id} на /project). */
const RecentProjectsSection = () => {
    const vm = useVM();
    const rows = vm.recentProjects;

    return (
        <section aria-labelledby="w-recent" className={`${CARD} min-w-0 flex-[2_1_520px] overflow-hidden`}>
            <div className={CARD_HEAD}>
                <h2 id="w-recent" className={SECTION_TITLE}>Останні проєкти</h2>
                <Link to="/project" className={LINK}>Усі проєкти</Link>
            </div>
            {vm.isRecentProjectsLoading ? (
                <p className={`m-0 px-4 py-3 ${MUTED}`}>Завантаження…</p>
            ) : rows.length === 0 ? (
                <p className={`m-0 px-4 py-3 ${MUTED}`}>Проєктів ще немає</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm text-gray-700 dark:text-gray-300">
                        <thead>
                            <tr>
                                <th scope="col" className={TH}>Назва</th>
                                <th scope="col" className={TH}>Стан</th>
                                <th scope="col" className={TH}>Оновлено</th>
                                <th scope="col" className={TH}>Виконавець</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((project) => (
                                <tr key={project.id} className="border-t border-gray-200 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700/60">
                                    <td className={`${TD} max-w-0 w-1/2`}>
                                        <Link
                                            to={`/project?card=${project.id}`}
                                            className="block truncate font-medium text-gray-800 no-underline hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-300"
                                            title={project.name}
                                        >
                                            {project.name}
                                        </Link>
                                    </td>
                                    <td className={`${TD} whitespace-nowrap`}>
                                        {project.state ? <span className={`${BADGE} ${BADGE_TONES.gray}`}>{project.state}</span> : "—"}
                                    </td>
                                    <td className={`${TD} whitespace-nowrap text-gray-600 dark:text-gray-400`}>{formatUpdated(project.updatedAt)}</td>
                                    <td className={`${TD} whitespace-nowrap text-gray-600 dark:text-gray-400`}>{project.performer || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default observer(RecentProjectsSection);
