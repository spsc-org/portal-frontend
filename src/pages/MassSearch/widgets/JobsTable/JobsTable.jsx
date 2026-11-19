import {useState} from "react";
import {Link} from "react-router";
import {IconButton, Tooltip} from "@material-tailwind/react";
import {format} from "date-fns";
import ConfirmModal from "../../../../components/Modal/ConfirmModal.jsx";
import {useDeleteMassSearchJobMutation, useMassSearchJobsQuery} from "../../entities/job/queries.js";

const STATUS_LABELS = {
    draft: {label: "Не запускався", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"},
    queued: {label: "У черзі", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"},
    running: {label: "Виконується", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"},
    completed: {label: "Завершено", color: "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"},
    completed_with_errors: {label: "Завершено з помилками", color: "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"},
    failed: {label: "Помилка", color: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300"},
};

const StatusBadge = ({status}) => {
    const meta = STATUS_LABELS[status] || {label: status || "—", color: "bg-slate-100 text-slate-600"};
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
            {meta.label}
        </span>
    );
};

// Список власних завдань масового пошуку — кожен користувач бачить лише свої
// (фільтрація вже на бекенді, `MassSearchJobService::listForUser()`).
// Перегляд — ОКРЕМА сторінка (`/mass-search/{id}`), не модалка: дає бачити
// прогрес пошуку по рядках наживо, не чекаючи завершення всього завдання.
const JobsTable = () => {
    const {data: jobsData, isLoading} = useMassSearchJobsQuery();
    const jobs = jobsData || [];

    const [deletingJob, setDeletingJob] = useState(null);
    const deleteMutation = useDeleteMassSearchJobMutation();

    return (
        <div data-i-doc="widget:mass-search-jobs-table">
            <div className="max-w-full overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-800">
                <table className="w-full table-auto text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead>
                        <tr className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                            <th className="px-3 py-2 font-normal">Файл</th>
                            <th className="px-3 py-2 font-normal">Рядків</th>
                            <th className="px-3 py-2 font-normal">Статус</th>
                            <th className="px-3 py-2 font-normal">Створено</th>
                            <th className="px-3 py-2 font-normal">Дії</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                        {!isLoading && jobs.length === 0 &&
                            <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-gray-400 dark:text-slate-500">
                                    Завдань ще немає — завантажте файл, щоб створити перше
                                </td>
                            </tr>
                        }
                        {jobs.map((job) => (
                            <tr key={job.id} className="bg-neutral-100 hover:bg-neutral-200 dark:bg-gray-900 dark:hover:bg-neutral-700">
                                <td className="px-3 py-2 font-semibold text-gray-800 dark:text-slate-200">
                                    {job.file_name || "—"}
                                </td>
                                <td className="px-3 py-2">{job.items_count}</td>
                                <td className="px-3 py-2"><StatusBadge status={job.status}/></td>
                                <td className="px-3 py-2">{job.created_at ? format(new Date(job.created_at), "dd.MM.yyyy HH:mm") : "—"}</td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-1">
                                        <Tooltip content="Переглянути дані/результати">
                                            <Link to={`/mass-search/${job.id}`}>
                                                <IconButton size="sm" variant="text">
                                                    <i className="fa-regular fa-eye text-slate-500"></i>
                                                </IconButton>
                                            </Link>
                                        </Tooltip>
                                        <Tooltip content="Видалити завдання">
                                            <IconButton size="sm" variant="text" onClick={() => setDeletingJob(job)}>
                                                <i className="fa-regular fa-trash text-red-500"></i>
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                open={Boolean(deletingJob)}
                onClose={() => setDeletingJob(null)}
                onConfirm={() => deleteMutation.mutate(deletingJob.id, {onSuccess: () => setDeletingJob(null)})}
                isLoading={deleteMutation.isPending}
                title="Видалити завдання?"
                message={deletingJob ? `Завдання «${deletingJob.file_name || deletingJob.id}» разом з усіма рядками буде видалено.` : ""}
            />
        </div>
    );
};

export default JobsTable;
