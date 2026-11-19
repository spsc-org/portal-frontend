import {useEffect, useRef, useState} from "react";
import {Link, useParams} from "react-router";
import {Tooltip} from "@material-tailwind/react";
import Page from "../../components/Page.jsx";
import {DictionaryProvider} from "../Dictionary/DictionaryContext.jsx";
import AdvancedSelectWithDefaults from "../../components/fields/AdvancedSelectWithDefaults.jsx";
import LoadingButton from "../../components/Buttons/LoadingButton.jsx";
import {massSearchJobExportUrl} from "./entities/job/api.js";
import {useMassSearchJobQuery, useRetryMassSearchJobItemMutation, useRunMassSearchJobSearchMutation} from "./entities/job/queries.js";
import {useMassSearchOptionsQuery} from "./entities/options/queries.js";

const STATUS_LABELS = {
    draft: {label: "Не запускався", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"},
    queued: {label: "У черзі", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"},
    running: {label: "Виконується", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"},
    completed: {label: "Завершено", color: "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"},
    completed_with_errors: {label: "Завершено з помилками", color: "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"},
    failed: {label: "Помилка", color: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300"},
};

const ITEM_STATUS_ICON = {
    pending: <i className="fa-regular fa-clock text-slate-400" title="Очікує"></i>,
    done: <i className="fa-solid fa-circle-check text-green-600" title="Готово"></i>,
    failed: <i className="fa-solid fa-triangle-exclamation text-red-500" title="Помилка"></i>,
};

const StatusBadge = ({status}) => {
    const meta = STATUS_LABELS[status] || {label: status, color: "bg-slate-100 text-slate-600"};
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
            {meta.label}
        </span>
    );
};

const RESULT_COLUMNS = [
    {key: "dataset_name", label: "Датасет"},
    {key: "captions", label: "Назва"},
    {key: "identifiers", label: "Ідентифікатори"},
    {key: "matched_field", label: "Збіг за полем"},
    {key: "matched_term", label: "Збіг за значенням"},
    {key: "weight", label: "Вага"},
];

const ItemResultsTable = ({results}) => {
    if (!results.length) {
        return <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">Нічого не знайдено.</p>;
    }
    return (
        <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900">
                <tr>
                    {RESULT_COLUMNS.map((col) => (
                        <th key={col.key} className="whitespace-nowrap px-2 py-1 text-slate-500 dark:text-slate-400">{col.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {results.map((r, index) => (
                    <tr key={`${r.datasetId}-${r.id}-${index}`} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="whitespace-nowrap px-2 py-1">{r.dataset_name}</td>
                        <td className="px-2 py-1">{r.captions || "—"}</td>
                        <td className="px-2 py-1">{r.identifiers || "—"}</td>
                        <td className="whitespace-nowrap px-2 py-1 text-slate-500 dark:text-slate-400">{r.matched_field || "—"}</td>
                        <td className="whitespace-nowrap px-2 py-1 text-slate-500 dark:text-slate-400">{r.matched_term || "—"}</td>
                        <td className="px-2 py-1">{r.weight}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const ItemRow = ({item, expanded, onToggle, onRetry, isRetrying, retryDisabled, isProcessing}) => {
    const resultsCount = item.results?.length || 0;
    return (
        <>
            <tr className={`border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isProcessing ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}>
                <td className="px-3 py-2 text-slate-400">
                    {item.row}
                    {isProcessing && <i className="fa-solid fa-spinner ml-1.5 animate-spin text-amber-500" title="Опрацьовується"></i>}
                </td>
                <td className="px-3 py-2">{item.entity_type || "—"}</td>
                <td className="px-3 py-2">{item.name_ukrainian || item.name_russian || item.name_latin || "—"}</td>
                <td className="px-3 py-2">{ITEM_STATUS_ICON[item.status] || item.status}</td>
                <td className="px-3 py-2">
                    {item.status === "done" &&
                        <button type="button" onClick={() => onToggle(item.id)}
                                className="font-medium text-blue-600 transition hover:underline dark:text-blue-400">
                            {resultsCount} {expanded ? <i className="fa-solid fa-chevron-up ml-1"></i> : <i className="fa-solid fa-chevron-down ml-1"></i>}
                        </button>
                    }
                    {item.status === "failed" &&
                        <span className="text-red-500" title={item.error}>{item.error || "помилка"}</span>
                    }
                    {item.status === "pending" && <span className="text-slate-300 dark:text-slate-600">—</span>}
                </td>
                <td className="px-3 py-2">
                    {(item.status === "done" || item.status === "failed") &&
                        <Tooltip content="Перезапустити пошук для цього рядка">
                            <button type="button" onClick={() => onRetry(item.id)} disabled={retryDisabled || isRetrying}
                                    className="text-slate-400 transition hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-400 dark:hover:text-blue-400">
                                <i className={`fa-solid fa-rotate-right ${isRetrying ? "animate-spin" : ""}`}></i>
                            </button>
                        </Tooltip>
                    }
                </td>
            </tr>
            {expanded && item.status === "done" &&
                <tr>
                    <td colSpan={6} className="bg-slate-50 p-0 dark:bg-slate-900/50">
                        <div className="overflow-x-auto">
                            <ItemResultsTable results={item.results || []}/>
                        </div>
                    </td>
                </tr>
            }
        </>
    );
};

const MassSearchJobShow = () => {
    const {jobId} = useParams();
    const {data: job, isLoading} = useMassSearchJobQuery(jobId);
    const {data: searchOptions} = useMassSearchOptionsQuery();
    const runSearchMutation = useRunMassSearchJobSearchMutation();
    const retryItemMutation = useRetryMassSearchJobItemMutation();
    const [expandedIds, setExpandedIds] = useState(() => new Set());
    const [retryingItemId, setRetryingItemId] = useState(null);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedMethods, setSelectedMethods] = useState([]);

    // Підставляємо фільтри, з якими завдання запускалось минулого разу —
    // лише ОДИН раз при першому завантаженні даних (job/groups/searchMethods),
    // інакше кожен поллінг під час "running" скидав би вибір користувача.
    // Якщо завдання ще не запускалось (немає збережених search_method_ids) —
    // за замовчуванням обираємо метод "Basic".
    const didInitFilters = useRef(false);
    useEffect(() => {
        if (didInitFilters.current || !job || !searchOptions) return;
        didInitFilters.current = true;
        setSelectedGroups((searchOptions.groups || []).filter((g) => (job.group_ids || []).includes(g.id)));
        const methods = searchOptions.searchMethods || [];
        const storedMethods = methods.filter((m) => (job.search_method_ids || []).includes(m.id));
        setSelectedMethods(storedMethods.length > 0 ? storedMethods : methods.filter((m) => m.caption === "Basic"));
    }, [job, searchOptions]);

    const toggleExpanded = (id) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleRetryItem = (itemId) => {
        setRetryingItemId(itemId);
        retryItemMutation.mutate({jobId, itemId}, {onSettled: () => setRetryingItemId(null)});
    };

    const handleRunSearch = () => {
        runSearchMutation.mutate({
            jobId: job.id,
            groupIds: selectedGroups.map((g) => g.id),
            searchMethodIds: selectedMethods.map((m) => m.id),
        });
    };

    const isRunning = job?.status === "queued" || job?.status === "running";
    const hasRunOnce = job && job.status !== "draft";
    const progressPct = job?.items_count ? Math.round((job.processed_items_count / job.items_count) * 100) : 0;

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:mass-search-job-show" className="mt-2 mx-2">
                    {isLoading &&
                        <div className="flex items-center justify-center py-12">
                            <i className="fa-solid fa-spinner animate-spin text-2xl text-blue-500"></i>
                        </div>
                    }

                    {!isLoading && job &&
                        <>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <Link to="/mass-search" className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:underline dark:text-slate-400">
                                        <i className="fa-solid fa-arrow-left"></i> Усі завдання
                                    </Link>
                                    <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-slate-200">
                                        {job.file_name || `Завдання #${job.id}`}
                                        <StatusBadge status={job.status}/>
                                    </h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasRunOnce &&
                                        (isRunning ?
                                            <Tooltip content="Дочекайтесь завершення пошуку — під час виконання експорт може містити суміш старих і нових результатів">
                                                <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-600">
                                                    <i className="fa-regular fa-file-excel"></i>
                                                    Експортувати
                                                </span>
                                            </Tooltip>
                                            :
                                            <a href={massSearchJobExportUrl(job.id)}
                                               className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                                                <i className="fa-regular fa-file-excel"></i>
                                                Експортувати
                                            </a>
                                        )
                                    }
                                    <LoadingButton
                                        color="blue"
                                        isLoading={runSearchMutation.isPending}
                                        disabled={isRunning}
                                        onClick={handleRunSearch}
                                    >
                                        <i className="fa-solid fa-magnifying-glass mr-1.5"></i>
                                        {job.status === "draft" ? "Запустити пошук" : "Перезапустити пошук"}
                                    </LoadingButton>
                                </div>
                            </div>

                            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <AdvancedSelectWithDefaults
                                    size="xs"
                                    isMulti
                                    isDisabled={isRunning}
                                    options={searchOptions?.searchMethods || []}
                                    label="Методи пошуку (усі не обрано = лише базовий)"
                                    id="searchMethods"
                                    selectedOptions={selectedMethods}
                                    onChange={setSelectedMethods}
                                />
                                <AdvancedSelectWithDefaults
                                    size="xs"
                                    isMulti
                                    isDisabled={isRunning}
                                    options={searchOptions?.groups || []}
                                    label="Бази даних (нічого не обрано = усі)"
                                    id="groups"
                                    selectedOptions={selectedGroups}
                                    onChange={setSelectedGroups}
                                />
                            </div>

                            {(isRunning || job.status === "completed" || job.status === "completed_with_errors") &&
                                <div className="mb-4">
                                    <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <span>
                                            Опрацьовано {job.processed_items_count} з {job.items_count}
                                            {isRunning && job.current_row_number != null &&
                                                <> · опрацьовується рядок №{job.current_row_number}</>
                                            }
                                        </span>
                                        <span>{progressPct}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div className={`h-full rounded-full transition-all ${isRunning ? "bg-blue-500" : "bg-green-500"}`} style={{width: `${progressPct}%`}}/>
                                    </div>
                                </div>
                            }

                            <div className="max-w-full overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-800">
                                <table className="w-full table-auto text-left text-sm text-gray-500 dark:text-gray-400">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                                            <th className="px-3 py-2 font-normal">Рядок</th>
                                            <th className="px-3 py-2 font-normal">Фіз./Юр.</th>
                                            <th className="px-3 py-2 font-normal">Назва</th>
                                            <th className="px-3 py-2 font-normal">Статус</th>
                                            <th className="px-3 py-2 font-normal">Знайдено</th>
                                            <th className="px-3 py-2 font-normal">Дії</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(job.items || []).map((item) => (
                                            <ItemRow
                                                key={item.id}
                                                item={item}
                                                expanded={expandedIds.has(item.id)}
                                                onToggle={toggleExpanded}
                                                onRetry={handleRetryItem}
                                                isRetrying={retryingItemId === item.id}
                                                retryDisabled={isRunning}
                                                isProcessing={isRunning && job.current_row_number === item.row}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    }
                </div>
            </Page>
        </DictionaryProvider>
    );
};

export default MassSearchJobShow;
