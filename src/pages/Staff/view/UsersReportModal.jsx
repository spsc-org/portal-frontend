import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { UsersReportViewModel } from "../viewmodel/ResponsibleViewModels.js";
import {Chip, Dialog, DialogBody, DialogHeader, IconButton} from "@material-tailwind/react";
import SearchInput from "../../../components/fields/SearchInput.jsx";

const STATUS_OPTIONS = [
    ["all", "Всі"],
    ["active", "Діючі"],
    ["inactive", "Недіючі"],
];

const buildRows = (users, assignments, status) => {
    const byUser = new Map();

    for (const assignment of assignments) {
        const isActive = !assignment.ended_at;
        if (status === "active" && !isActive) continue;
        if (status === "inactive" && isActive) continue;

        for (const user of assignment.users || []) {
            if (!byUser.has(user.id)) byUser.set(user.id, []);
            byUser.get(user.id).push({
                assignmentId: assignment.id,
                functionName: assignment.function?.name || "—",
                isActive,
            });
        }
    }

    return users
        .filter((u) => !u.deleted_at)
        .map((u) => ({user: u, entries: byUser.get(u.id) || []}))
        .sort((a, b) => a.user.name.localeCompare(b.user.name, "uk"));
};

// "Звіт по користувахах" — не частина повсякденної роботи (Функції/
// Призначення), тому окрема модалка, а не постійна колонка сторінки.
// Джерело даних — усі призначення (активні й скасовані), не лише активні
// (`func.active_assignments`) — щоб фільтр "недіючі" мав що показувати.
const UsersReportModalInner = observer(({open, onClose, users = [], assignmentsQuery}) => {
    const vm = useViewModel((deps) => new UsersReportViewModel({ ...deps, assignmentsQuery }));
    const { q, status, setQ, setStatus, assignments } = vm;
    const isLoading = vm.query.isLoading;
    // Звіт — чиста функція від даних (buildRows), рахується в рендері.
    const rows = buildRows(users, assignments, status);
    const filtered = q ? rows.filter(({user}) => user.name.toLowerCase().includes(q.toLowerCase())) : rows;

    return (
        <Dialog data-i-doc="modal:staff-responsible-users-report" open={open} handler={onClose} size="lg">
            <DialogHeader className="flex items-center justify-between">
                Звіт по користувачах
                <IconButton size="sm" variant="text" onClick={onClose}>
                    <i className="fa-regular fa-xmark"></i>
                </IconButton>
            </DialogHeader>
            <DialogBody className="flex max-h-[75vh] flex-col gap-3 overflow-hidden">
                <div className="flex flex-wrap items-center gap-1.5">
                    <div className="w-56">
                        <SearchInput size="xs" name="q" value={q} onChange={(e) => setQ(e.target.value || "")}
                                     placeholder="Пошук людини…" icon="fa-regular fa-magnifying-glass"/>
                    </div>
                    <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800">
                        {STATUS_OPTIONS.map(([key, label]) => (
                            <button key={key} type="button" onClick={() => setStatus(key)}
                                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${status === key
                                        ? "bg-blue-500 text-white"
                                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full table-auto text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead>
                            <tr className="sticky top-0 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                                <th className="px-3 py-2 font-normal">Ім'я</th>
                                <th className="px-3 py-2 font-normal">Функції</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-neutral-700 dark:bg-gray-900">
                            {!isLoading && filtered.length === 0 &&
                                <tr>
                                    <td colSpan={2} className="px-3 py-6 text-center text-gray-400 dark:text-slate-500">
                                        Нікого не знайдено
                                    </td>
                                </tr>
                            }
                            {filtered.map(({user, entries}) => (
                                <tr key={user.id}>
                                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-gray-800 dark:text-slate-200">{user.name}</td>
                                    <td className="px-3 py-2">
                                        {entries.length === 0
                                            ? <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                                            : (
                                                <div className="flex flex-wrap gap-1">
                                                    {entries.map((e) => (
                                                        <Chip key={e.assignmentId} size="sm" value={e.functionName}
                                                              variant="ghost" color={e.isActive ? "blue-gray" : "gray"}
                                                              className={`rounded-full text-[10px] py-0.5 px-2 ${e.isActive ? "" : "opacity-60"}`}/>
                                                    ))}
                                                </div>
                                            )
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DialogBody>
        </Dialog>
    );
});

/** Монтується лише відкритою (запит призначень — лише коли звіт відкрито). */
const UsersReportModal = (props) => (props.open ? <UsersReportModalInner {...props}/> : null);

export default UsersReportModal;
