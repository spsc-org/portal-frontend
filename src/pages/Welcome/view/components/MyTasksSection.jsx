import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";
import { formatDue } from "../../model/welcomeModel.js";
import { BADGE, BADGE_TONES, CARD, CARD_HEAD, LINK, MUTED, SECTION_TITLE, SEGMENTS, segment } from "../styles.js";

// statusId: 1 Нова, 2 В роботі, 5 Повернуто (див. OPEN_TASK_STATUS_IDS)
const STATUS_TONE = { 1: "blue", 2: "gray", 5: "amber" };

const TaskRow = ({ task, mode }) => {
    const due = formatDue(task.dueDate);
    const late = Boolean(due?.late);
    const people =
        mode === "created"
            ? (task.assignedUsers ?? []).map((user) => user.name).join(", ")
            : task.createdUser && `від ${task.createdUser}`;
    const meta = [task.project, people].filter(Boolean).join(" · ");

    return (
        <li className="flex items-center gap-3 border-t border-gray-200 px-4 py-3 transition-colors first:border-t-0 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700/60">
            <span className={`${BADGE} ${BADGE_TONES[late ? "red" : STATUS_TONE[task.statusId] ?? "gray"]}`}>
                {late ? "Прострочено" : task.status || "—"}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                    to={`/task?view=${task.id}`}
                    className="truncate text-sm font-medium text-gray-800 no-underline hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-300"
                    title={task.title}
                >
                    {task.title}
                </Link>
                {meta && <span className="truncate text-xs text-gray-600 dark:text-gray-400">{meta}</span>}
            </div>
            {due && (
                <span className={`shrink-0 whitespace-nowrap text-xs ${late ? "font-medium text-red-700 dark:text-red-300" : "text-gray-600 dark:text-gray-400"}`}>
                    {due.label}
                </span>
            )}
        </li>
    );
};

/** Мої відкриті задачі: вкладки "Я виконавець" / "Створені мною" (5 найновіших). */
const MyTasksSection = () => {
    const vm = useVM();

    return (
        <section data-i-doc="widget:welcome-my-tasks-section" aria-labelledby="w-tasks" className={`${CARD} min-w-0 flex-[2_1_520px] overflow-hidden`}>
            <div className={CARD_HEAD}>
                <h2 id="w-tasks" className={SECTION_TITLE}>Мої задачі</h2>
                <div role="group" aria-label="Фільтр задач" className={SEGMENTS}>
                    {vm.taskTabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            aria-pressed={tab.active}
                            onClick={() => vm.setTaskTab(tab.id)}
                            className={segment(tab.active)}
                        >
                            {tab.label}
                            {tab.count != null && (
                                <span
                                    className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                                        tab.active ? "bg-white text-blue-800" : "bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-gray-200"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            <ul className="m-0 list-none p-0">
                {vm.isTasksLoading && <li className={`px-4 py-3 ${MUTED}`}>Завантаження…</li>}
                {!vm.isTasksLoading && vm.tasks.length === 0 && <li className={`px-4 py-3 ${MUTED}`}>Немає незавершених задач</li>}
                {vm.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} mode={vm.taskTab} />
                ))}
            </ul>
            {vm.canSeeTasks && (
                <div className="border-t border-gray-200 px-4 py-3 dark:border-neutral-700">
                    <Link to="/task" className={LINK}>Усі задачі</Link>
                </div>
            )}
        </section>
    );
};

export default observer(MyTasksSection);
