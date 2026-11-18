import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";

/** Мої невиконані задачі (5 найновіших) на дашборді. */
const MyTasksSection = () => {
    const vm = useVM();
    const { isLoading } = vm.myTasksQuery;

    return (
        <section data-i-doc="widget:welcome-my-tasks-section" className="rounded-2xl border border-gray-300 bg-white p-4 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/60 dark:border-neutral-700 dark:bg-neutral-800/70 dark:shadow-black/20 dark:ring-0">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Мої невиконані задачі</h3>
                <Link to="/task" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Усі задачі
                </Link>
            </div>

            {!isLoading && vm.myTasks.length === 0 &&
                <p className="text-[11px] text-gray-600 dark:text-gray-400">Немає незавершених задач</p>
            }

            <ul className="p-0 m-0 list-none">
                {isLoading &&
                    <li className="p-0 m-0 text-[11px] text-gray-600 dark:text-gray-400">Завантаження…</li>
                }
                {vm.myTasks.map((task) => (
                    <li key={task.id} className="p-0 m-0">
                        <Link to={`/task?view=${task.id}`}
                              className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs transition hover:bg-gray-100 dark:hover:bg-neutral-700">
                            <p className="min-w-0 truncate text-[11px] font-medium text-gray-800 dark:text-gray-200">
                                {task.title}
                            </p>
                            <span className="shrink-0 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                {task.status?.name || ""}
                            </span>
                        </Link>
                        {task.dueDate &&
                            <p className="pl-1.5 text-[10px] text-gray-600 dark:text-gray-500">
                                Термін: {format(new Date(task.dueDate), "d MMM yyyy", {locale: uk})}
                            </p>
                        }
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default observer(MyTasksSection);
