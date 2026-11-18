import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { DossierOptionsViewModel, SourceDetailsViewModel } from "../../viewmodel/DossierViewModels.js";
import { useStores } from "../../../../stores/storeHooks.js";
import {useState} from "react";
import ReferenceChip from "../../shared/ui/ReferenceChip.jsx";
import ModeratorBlock from "../../shared/ui/ModeratorBlock.jsx";
import TicketsBlock from "../../shared/ui/TicketsBlock.jsx";
import TicketsButton from "../TicketsModal/TicketsButton.jsx";
import {ENTITY_ORPHAN} from "../../entities/dossierTicket/model.js";
import ProjectDetails from "../ProfileDetailPane/sourceDetails/ProjectDetails.jsx";
import {fetchProjectDetails} from "../../entities/dossierConnection/api.js";

const MODEL_CLASS_PROJECT = 1;

const projectTitle = (project) => project.nameUk?.trim() || project.nameRu?.trim() || project.nameEn?.trim() || `Проєкт #${project.id}`;

// Рядок проєкту-сироти: дані для впізнавання + акордеон з повною карткою проєкту
// (ProjectDetails — той самий шаблон, що й у Картці звʼязку, ledger:project) +
// дві дії — привʼязати до вручну введеного id досьє (знайденого зліва в Реєстрі досьє
// через пошук) або створити нове досьє з нуля на основі цього проєкту, якщо
// підходящого досьє немає. Деталі фетчаться лише при розгортанні (enabled: expanded).
const OrphanRow = ({project, canManage, onLink, onCreate, isLinking, isCreating}) => {
    const [profileId, setProfileId] = useState("");
    const userId = useStores().session.userId;
    const options = useViewModel((deps) => new DossierOptionsViewModel(deps)).options;
    // Деталі проєкту — лише після розгортання рядка.
    const vm = useViewModel((deps) => new SourceDetailsViewModel({
        ...deps, modelClass: MODEL_CLASS_PROJECT, modelId: project.id,
        fetcher: (id) => fetchProjectDetails(id, userId), enabled: false,
    }));
    const expanded = vm.enabled;
    const setExpanded = (value) => vm.setEnabled(typeof value === "function" ? value(vm.enabled) : value);
    const { data: details, isPending, isError } = vm.query;

    const canLink = profileId !== "" && Number(profileId) > 0;

    return (
        <div className="flex flex-col gap-2 px-3.5 py-3 rounded-lg border border-gray-200 bg-white dark:bg-neutral-800 dark:border-neutral-700">
            <div className="flex items-start justify-between gap-2">
                <div className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {projectTitle(project)}
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    title={expanded ? "Згорнути картку проєкту" : "Розгорнути картку проєкту"}
                    className="flex-none w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-neutral-700"
                >
                    <i className={`fa-solid ${expanded ? "fa-chevron-up" : "fa-chevron-down"} text-[11px]`}></i>
                </button>
            </div>
            <div className="flex flex-wrap gap-[6px]">
                <ReferenceChip icon="fa-solid fa-database" label="Проєкт" value={`#${project.id}`}/>
                {project.drsId != null && <ReferenceChip icon="fa-solid fa-landmark" label="ДРС" value={`#${project.drsId}`}/>}
                {project.subjectId != null && <ReferenceChip icon="fa-solid fa-fingerprint" label="subject" value={`#${project.subjectId}`}/>}
            </div>

            {expanded && (
                <div className="mt-1 pt-2.5 border-t border-gray-100 dark:border-neutral-700">
                    {isPending && (
                        <div className="animate-pulse flex flex-col gap-2" aria-hidden="true">
                            <div className="h-9 w-full rounded-md bg-gray-100 dark:bg-neutral-700"/>
                            <div className="h-9 w-4/5 rounded-md bg-gray-100 dark:bg-neutral-700"/>
                        </div>
                    )}
                    {isError && (
                        <div className="text-[11px] text-red-600 dark:text-red-400 py-1">Не вдалося завантажити деталі проєкту</div>
                    )}
                    {details && <ProjectDetails data={details} {...options}/>}
                </div>
            )}

            <div className="flex flex-wrap items-start gap-3 mt-1">
                <TicketsBlock className="flex-auto min-w-[160px]">
                    <TicketsButton
                        entityType={ENTITY_ORPHAN}
                        entityId={project.id}
                        entityLabel={`Сирота — ${projectTitle(project)}`}
                        canManage={canManage}
                    />
                </TicketsBlock>

                <ModeratorBlock canManage={canManage} label="Дії із сиротою" className="flex-auto min-w-[200px]">
                    <input
                        type="number"
                        min="1"
                        value={profileId}
                        onChange={(e) => setProfileId(e.target.value)}
                        placeholder="id досьє"
                        className="w-24 h-8 px-2 text-xs font-mono rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-600 dark:text-gray-100"
                    />
                    <button
                        type="button"
                        disabled={!canLink || isLinking}
                        onClick={() => onLink(Number(profileId))}
                        title="Привʼязати до вказаного досьє"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white cursor-pointer transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i className={`fa-solid ${isLinking ? "fa-spinner fa-spin" : "fa-link"} text-[12px]`}></i>
                    </button>
                    <button
                        type="button"
                        disabled={isCreating}
                        onClick={onCreate}
                        title="Створити нове досьє на основі цього проєкту"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-emerald-200 bg-white text-emerald-700 cursor-pointer transition hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-700 dark:border-emerald-800 dark:text-emerald-400"
                    >
                        <i className={`fa-solid ${isCreating ? "fa-spinner fa-spin" : "fa-folder-plus"} text-[12px]`}></i>
                    </button>
                </ModeratorBlock>
            </div>
        </div>
    );
};

export default observer(OrphanRow);
