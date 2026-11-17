import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { DossierOptionsViewModel } from "../../viewmodel/DossierViewModels.js";

import {sourceType} from "../../shared/config/sourceTypes.js";
import {criteriaChipClasses, criteriaLabel, criteriaList} from "../../entities/dossierConnection/model.js";

const MODEL_CLASS_PROJECT = 1;

// "Стопка карток" для Реєстру звʼязків: те саме джерело (model_class+model_id) збіглося
// одразу за кількома критеріями — замість N майже однакових рядків показуємо один,
// з бейджем кількості й обʼєднаними чипами критеріїв (по ДРС, по ІПН тощо). Клік відкриває
// "віртуальну картку" (ConnectionCardGroup) із розбивкою на реальні звʼязки й діями по кожному.
const ConnectionListItemGroup = ({connections, isActive, onClick}) => {
    const primary = connections[0];
    const source = sourceType(primary.model_class);
    const summary = primary.summary_data;

    const options = useViewModel((deps) => new DossierOptionsViewModel(deps)).options;
    const projectState = primary.model_class === MODEL_CLASS_PROJECT && summary?.state_id != null
        ? options?.projectState?.find((item) => item.id === summary.state_id)
        : null;

    const combinedCriteria = [...new Set(connections.flatMap((c) => criteriaList(c.matched_criteria)))];
    const anyNeedsReview = connections.some((c) => c.needs_review);
    const anyConflict = connections.some((c) => c.needs_review && c.review_reason === "conflict");

    return (
        <div data-i-doc="component:sanction-profiles-connection-list-item-group" className="relative">
            <div
                aria-hidden="true"
                className="absolute inset-x-2 top-1.5 h-full rounded-lg border bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700"
            />
            <div
                aria-hidden="true"
                className="absolute inset-x-1 top-[3px] h-full rounded-lg border bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700"
            />
            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                    isActive
                        ? "bg-blue-50 border-blue-300 dark:bg-blue-900/25 dark:border-blue-700"
                        : "bg-white border-gray-200 hover:bg-slate-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
            >
                <span className={`flex-none inline-flex items-center justify-center w-7 h-7 rounded-md text-[12px] ${source.badgeClasses}`}>
                    <i className={source.icon}></i>
                </span>
                <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {summary?.name ?? primary.source_caption ?? `#${primary.model_id}`}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {projectState && (
                            <div
                                className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${projectState.style ?? "text-gray-500 dark:text-gray-400"}`}
                                title="Стан проєкту"
                            >
                                <i className={`${projectState.icon ?? "fa-solid fa-rectangle"} text-[8px]`}></i>{projectState.caption}
                            </div>
                        )}
                        {combinedCriteria.map((key) => (
                            <span key={key} className={`text-[10px] font-semibold px-[7px] py-[2px] rounded-md ${criteriaChipClasses(key)}`}>
                                {criteriaLabel(key)}
                            </span>
                        ))}
                    </div>
                </div>
                <span
                    title="ID сутності звʼязку"
                    className="flex-none text-[10px] font-mono text-gray-300 dark:text-gray-500"
                >
                    #{primary.model_id}
                </span>
                <span
                    title={`Це джерело підтверджене ${connections.length} окремими звʼязками`}
                    className="flex-none inline-flex items-center gap-1 text-[10.5px] font-bold px-[7px] py-[3px] rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                >
                    <i className="fa-solid fa-layer-group text-[9px]"></i>×{connections.length}
                </span>
                {anyConflict && (
                    <span
                        title="Конфлікт: субʼєкт веде на кілька різних досьє"
                        className="flex-none inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 text-[8px] dark:bg-red-900/50 dark:text-red-300"
                    >
                        <i className="fa-solid fa-code-compare"></i>
                    </span>
                )}
                {anyNeedsReview && !anyConflict && (
                    <span className="flex-none inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[8px] dark:bg-orange-900/50 dark:text-orange-300">
                        <i className="fa-solid fa-flag"></i>
                    </span>
                )}
            </div>
        </div>
    );
};

export default observer(ConnectionListItemGroup);
