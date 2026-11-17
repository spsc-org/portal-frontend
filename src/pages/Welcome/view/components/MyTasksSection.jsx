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
        <section data-i-doc="widget:welcome-my-tasks-section" className="rounded-2xl border border-slate-300 bg-white p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-black/20 dark:ring-0">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Мої невиконані задачі</h3>
                <Link to="/task" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Усі задачі
                </Link>
            </div>

            {!isLoading && vm.myTasks.length === 0 &&
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Немає незавершених задач</p>
            }

            <ul className="p-0 m-0 list-none">
                {isLoading &&
                    <li className="p-0 m-0 text-[11px] text-slate-500 dark:text-slate-400">Завантаження…</li>
                }
                {vm.myTasks.map((task) => (
                    <li key={task.id} className="p-0 m-0">
                        <Link to={`/task?view=${task.id}`}
                              className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800">
                            <p className="min-w-0 truncate text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                {task.title}
                            </p>
                            <span className="shrink-0 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                {task.status?.name || ""}
                            </span>
                        </Link>
                        {task.dueDate &&
                            <p className="pl-1.5 text-[10px] text-slate-400 dark:text-slate-500">
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
