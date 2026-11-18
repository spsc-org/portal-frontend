import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/index.js";

const ROW_BG = {
    added: "bg-green-50 dark:bg-green-900/10",
    changed: "bg-yellow-50 dark:bg-yellow-900/10",
    removed: "bg-red-50 dark:bg-red-900/10",
};
const ROW_ICON = {
    added: "fa-solid fa-plus text-green-600 dark:text-green-400",
    changed: "fa-solid fa-pen text-yellow-600 dark:text-yellow-400",
    removed: "fa-solid fa-minus text-red-600 dark:text-red-400",
};
const LEGEND = [
    ["bg-green-100 border-green-500 dark:bg-green-900/40", "Додано"],
    ["bg-yellow-100 border-yellow-500 dark:bg-yellow-900/40", "Змінено"],
    ["bg-red-100 border-red-500 dark:bg-red-900/40", "Видалено"],
];

/** Вкладка "Історія змін" (tab-changes.blade.php + legacy ChangeLogComponent): таймлайн аудиту. */
const CardChangesTab = () => {
    const vm = useVM().projectCard;
    return (
        <div className="p-4" data-testid="card-tab-changes">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Історія змін</h3>
                <div className="flex gap-3">
                    {LEGEND.map(([swatch, title]) => (
                        <div key={title} className="flex items-center text-xs">
                            <span className={`mr-1 inline-block h-3 w-3 rounded-sm border ${swatch}`} />
                            <span className="text-gray-600 dark:text-gray-400">{title}</span>
                        </div>
                    ))}
                </div>
            </div>
            {vm.historyLoading ? (
                <div className="flex w-full justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            ) : vm.history.length === 0 ? (
                <div className="py-10 text-center text-gray-600 dark:text-gray-500">
                    <i className="fa-solid fa-clock-rotate-left mb-3 text-3xl opacity-30" />
                    <p className="text-sm">Змін не знайдено</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {vm.history.map((entry) => (
                        <div key={entry.id} className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                                <div className="flex min-w-0 items-center gap-3 text-sm">
                                    <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">
                                        <i className="fa-regular fa-clock mr-1 text-gray-500" />
                                        {entry.date}
                                    </span>
                                    <span className="whitespace-nowrap text-xs text-gray-600">{entry.relative}</span>
                                    {entry.user && (
                                        <span className="truncate text-gray-600 dark:text-gray-400">
                                            <i className="fa-regular fa-user mr-1 text-gray-500" />
                                            {entry.user}
                                        </span>
                                    )}
                                </div>
                                <div className="ml-2 flex shrink-0 items-center gap-2">
                                    <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-700 dark:text-gray-300">{entry.action}</span>
                                    <span className="whitespace-nowrap text-xs text-gray-600">{entry.changes.length} змін</span>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                                {entry.changes.map((change, index) => (
                                    <div key={`${change.label}-${index}`} className={`flex items-start gap-2 px-3 py-1.5 text-sm ${ROW_BG[change.type]}`}>
                                        <span className="w-4 shrink-0 pt-0.5 text-center">
                                            <i className={`${ROW_ICON[change.type]} text-xs`} />
                                        </span>
                                        <span className="mr-2 shrink-0 pt-0.5 text-xs text-gray-600 dark:text-gray-400">{change.label}</span>
                                        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                            {change.from !== null && <span className="break-words text-red-500 opacity-80 dark:text-red-400">{change.from}</span>}
                                            {change.type === "changed" && <i className="fa-solid fa-arrow-right shrink-0 text-xs text-gray-500" />}
                                            {change.to !== null && <span className="break-words text-green-700 dark:text-green-400">{change.to}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default observer(CardChangesTab);
