import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { DossierOptionsViewModel } from "../../viewmodel/DossierViewModels.js";

import {sourceType} from "../../shared/config/sourceTypes.js";
import {connectionStatus, isSanctionExpired} from "../../entities/dossierConnection/model.js";

const MODEL_CLASS_PROJECT = 1;

// Компактний рядок звʼязку для лівої колонки вкладки "Звʼязки" (каскадний перегляд:
// клік вибирає звʼязок — повна картка відкривається у правій колонці, ConnectionCard).
// Кастомізація за типом джерела: якщо summary_data заповнено (звʼязки-дії ДРС, коди 20/21/22) —
// назва сутності головним рядком, тип дії + указ обовʼязково видимі рядком нижче (без
// потреби відкривати картку); інші джерела (напр. Project) — звичайний source_caption.
const ConnectionListItem = ({connection, isActive, onClick}) => {
    const source = sourceType(connection.model_class);
    const status = connectionStatus(connection);
    const summary = connection.summary_data;
    const summaryLine = summary && [summary.action_type, summary.decree ? `Указ ${summary.decree}` : null]
        .filter(Boolean)
        .join(" · ");
    const expired = isSanctionExpired(summary?.sanctions_end_date);

    // Стан проєкту (project.stateId, лише для звʼязків-проєктів) — важливо бачити одразу
    // в Реєстрі звʼязків, без відкриття Картки звʼязку: "Готово"/"Недоцільно"/"Ні" тощо
    // прямо впливають на те, чи варто довіряти цьому звʼязку.
    const options = useViewModel((deps) => new DossierOptionsViewModel(deps)).options;
    const projectState = connection.model_class === MODEL_CLASS_PROJECT && summary?.state_id != null
        ? options?.projectState?.find((item) => item.id === summary.state_id)
        : null;

    return (
        <div data-i-doc="component:sanction-profiles-connection-list-item"
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                isActive
                    ? "bg-blue-50 border-blue-300 dark:bg-blue-900/25 dark:border-blue-700"
                    : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
            }`}
        >
            <span className={`flex-none inline-flex items-center justify-center w-7 h-7 rounded-md text-[12px] ${source.badgeClasses}`}>
                <i className={source.icon}></i>
            </span>
            <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {summary?.name ?? connection.source_caption ?? `#${connection.model_id}`}
                </div>
                {summaryLine && (
                    <div className="text-[11px] font-mono text-gray-600 truncate">
                        {summaryLine}
                    </div>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {projectState && (
                        <div
                            className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${projectState.style ?? "text-gray-600 dark:text-gray-400"}`}
                            title="Стан проєкту"
                        >
                            <i className={`${projectState.icon ?? "fa-solid fa-rectangle"} text-[8px]`}></i>{projectState.caption}
                        </div>
                    )}
                    <div className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${status.classes}`}>
                        <i className={`${status.icon} text-[9px]`}></i>{status.label}
                    </div>
                    {expired && (
                        <div
                            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-600 dark:text-gray-500"
                            title={`Санкції закінчились ${summary.sanctions_end_date}`}
                        >
                            <i className="fa-solid fa-hourglass-end text-[9px]"></i>дія не чинна
                        </div>
                    )}
                </div>
            </div>
            <span
                title="ID сутності звʼязку"
                className="flex-none text-[10px] font-mono text-gray-300 dark:text-gray-500"
            >
                #{connection.model_id}
            </span>
            {connection.needs_review && connection.review_reason === "conflict" && (
                <span
                    title={
                        connection.conflicts_with?.length
                            ? `Конфлікт з: ${connection.conflicts_with.map((o) => o.profile_caption ?? `Досьє #${o.profile_id}`).join(", ")}`
                            : "Конфлікт: субʼєкт веде на кілька різних досьє"
                    }
                    className="flex-none inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 text-[8px] dark:bg-red-900/50 dark:text-red-300"
                >
                    <i className="fa-solid fa-code-compare"></i>
                </span>
            )}
            {connection.needs_review && connection.review_reason !== "conflict" && (
                <span className="flex-none inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[8px] dark:bg-orange-900/50 dark:text-orange-300">
                    <i className="fa-solid fa-flag"></i>
                </span>
            )}
        </div>
    );
};

export default observer(ConnectionListItem);
