import React from "react";
import {usePage} from "@inertiajs/react";
import {useQuery} from "@tanstack/react-query";
import {format} from "date-fns";
import {uk} from "date-fns/locale";

// Нова(1)/В роботі(2)/Повернуто(5) — ще не завершено з боку виконавця,
// на відміну від Виконано(3, чекає приймання) і Закрито(6).
const OPEN_STATUS_IDS = [1, 2, 5];

// Мої невиконані задачі на дашборді /welcome — ті, де я серед виконавців
// (assignedUserId), у відкритому статусі; 5 найновіших. Рядок списку — той
// самий мінімалістичний патерн, що й BirthdayList.jsx/AnnouncementsSection.jsx.
const MyTasksSection = () => {
    const {auth} = usePage().props;
    const userId = auth?.user?.id;

    const {data, isLoading} = useQuery({
        queryKey: ["welcome-my-tasks", userId],
        queryFn: async () => {
            const response = await axios.get("/api/task", {
                params: {
                    assignedUserId: [userId],
                    statusId: OPEN_STATUS_IDS,
                    limit: 5,
                    sort: "created_at",
                    direction: "desc",
                },
                headers: {userId},
            });
            return response.data;
        },
        enabled: Boolean(userId),
        staleTime: 60 * 1000,
    });

    const tasks = data?.data || [];

    return (
        <section data-i-doc="widget:welcome-my-tasks-section" className="rounded-2xl border border-slate-300 bg-white p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-black/20 dark:ring-0">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Мої невиконані задачі</h3>
                <a href="/task" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Усі задачі
                </a>
            </div>

            {!isLoading && tasks.length === 0 &&
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Немає незавершених задач</p>
            }

            <ul className="p-0 m-0 list-none">
                {isLoading &&
                    <li className="p-0 m-0 text-[11px] text-slate-500 dark:text-slate-400">Завантаження…</li>
                }
                {tasks.map((task) => (
                    <li key={task.id} className="p-0 m-0">
                        <a href={`/task?view=${task.id}`}
                           className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800">
                            <p className="min-w-0 truncate text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                {task.title}
                            </p>
                            <span className="shrink-0 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                {task.status?.name || ""}
                            </span>
                        </a>
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

export default MyTasksSection;
