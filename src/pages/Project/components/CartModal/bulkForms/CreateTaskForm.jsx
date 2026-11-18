import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import { SelectField } from "./fields.jsx";

const inputClass = "w-full text-sm border border-gray-200 dark:border-neutral-600 rounded-md px-3 py-2 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

// bulkTab12 — "Створити задачу". На відміну від інших 11 форм, НЕ проходить
// через BulkFormShell: немає "reason", а джерела словників подвійні —
// "Учасник" з entities/project (той самий `user`, що й в usual bulk-формах),
// "Пріоритет"/"Проєкт" з домену Task (entities/cart/api.js:fetchTaskOptionsForCart,
// точнісінько як initCreateTaskSelects() у легасі cartManager.js).
const CreateTaskForm = ({ projectIds, userId, onDone }) => {
    const projectVoc = useVM().cartModal.options;
    const users = useMemo(() => Object.values(projectVoc?.user ?? {}), [projectVoc]);

    const taskVoc = useVM().cartModal.taskOptions;
    const priorities = useMemo(() => taskVoc?.priorities ?? [], [taskVoc]);
    const tasksProjects = useMemo(
        () => (taskVoc?.projects ?? []).map((p) => ({ id: p.id, caption: p.name })),
        [taskVoc],
    );
    const defaultPriorityId = useMemo(
        () => priorities.find((p) => p.caption === "Середній")?.id ?? "",
        [priorities],
    );

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedUserId, setAssignedUserId] = useState("");
    const [projectId, setProjectId] = useState("");
    // Поки користувач не вибрав сам — "Середній" зі словника (/api/task/options приходить асинхронно), як legacy initCreateTaskSelects()
    const [priorityChoice, setPriorityId] = useState("");
    const priorityId = priorityChoice || defaultPriorityId;
    const [dueDate, setDueDate] = useState("");

    const mutation = useVM().cartModal.cmd.createTaskWithProjects;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || projectIds.length === 0) return;
        mutation.mutate(
            [projectIds, { title: title.trim(), description, assignedUserId, projectId, priorityId: priorityId || defaultPriorityId, dueDate }, userId],
            { onSuccess: (result) => onDone(result) },
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400">Створити задачу</h2>

            <div className="space-y-1 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                <p>Створює задачу в розділі «Задачі» з прив'язкою всіх відібраних проєктів. Учасник зможе відкрити цей набір із картки задачі одним кліком.</p>
            </div>

            <div>
                <label className={labelClass}>Назва задачі <span className="text-red-500">*</span></label>
                <input type="text" required maxLength={1000} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </div>

            <div>
                <label className={labelClass}>Опис</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <SelectField label="Учасник" value={assignedUserId} onChange={setAssignedUserId} options={users} placeholder="— не призначати —" />
                <SelectField label="Проєкт" value={projectId} onChange={setProjectId} options={tasksProjects} placeholder="— без проєкту —" />
                <SelectField label="Пріоритет" value={priorityId} onChange={setPriorityId} options={priorities} />
                <div>
                    <label className={labelClass}>Термін <span className="font-normal text-gray-600">(не обов'язково)</span></label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
                </div>
            </div>

            {mutation.isError && (
                <p className="text-sm text-red-600 dark:text-red-400">{cartErrorMessage(mutation.error, "Не вдалося створити задачу")}</p>
            )}

            <button
                type="submit"
                disabled={mutation.isPending || !title.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            >
                <i className={`fas ${mutation.isPending ? "fa-spinner fa-spin" : "fa-list-check"} mr-2`} />
                Створити задачу
            </button>
        </form>
    );
};

export default observer(CreateTaskForm);
