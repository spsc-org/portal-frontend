import {
    fetchProjectDetails,
    fetchConsolidatedSourceDetails,
} from "../../entities/dossierConnection/api.js";
import ProjectDetails from "../../widgets/ProfileDetailPane/sourceDetails/ProjectDetails.jsx";
import ActionPersonDetails from "../../widgets/ProfileDetailPane/sourceDetails/ActionPersonDetails.jsx";
import ActionLegalDetails from "../../widgets/ProfileDetailPane/sourceDetails/ActionLegalDetails.jsx";
import ActionVesselDetails from "../../widgets/ProfileDetailPane/sourceDetails/ActionVesselDetails.jsx";

// Дзеркало App\Models\DossierConnection::MODEL_MAP (коди 1/20/21/22) + фабрика
// шаблонів подання: detailsFetcher (як забрати сирі дані джерела) і detailsFields
// (як їх намалювати — окремий компонент на кожну таблицю-джерело, бо в кожної свій
// набір даних; ConnectionSourceDetails.jsx лише резолвить за кодом і рендерить).
export const SOURCE_TYPES = {
    1: {
        label: "project",
        table: "register.project",
        icon: "fa-solid fa-database",
        badgeClasses: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
        detailsFetcher: fetchProjectDetails,
        detailsFields: ProjectDetails,
        cardUrl: (modelId) => `/project?card=${modelId}`,
    },
    20: {
        label: "РНБО · дія (особа)",
        table: "ds_uk_nsdc_action_p",
        icon: "fa-solid fa-landmark",
        badgeClasses: "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
        detailsFetcher: (modelId, userId) => fetchConsolidatedSourceDetails(20, modelId, userId),
        detailsFields: ActionPersonDetails,
    },
    21: {
        label: "РНБО · дія (юр.особа)",
        table: "ds_uk_nsdc_action_l",
        icon: "fa-solid fa-landmark",
        badgeClasses: "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
        detailsFetcher: (modelId, userId) => fetchConsolidatedSourceDetails(21, modelId, userId),
        detailsFields: ActionLegalDetails,
    },
    22: {
        label: "РНБО · дія (судно)",
        table: "ds_uk_nsdc_action_vessel",
        icon: "fa-solid fa-landmark",
        badgeClasses: "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
        detailsFetcher: (modelId, userId) => fetchConsolidatedSourceDetails(22, modelId, userId),
        detailsFields: ActionVesselDetails,
    },
};

export const sourceType = (modelClass) =>
    SOURCE_TYPES[modelClass] ?? {
        label: `Код ${modelClass}`,
        table: `model_class ${modelClass}`,
        icon: "fa-solid fa-database",
        badgeClasses: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    };

// Опції для форми пошуку дублікатів (тип джерела-драфта) і для мультивибору "Джерело"
// у фільтрах панелі /dossier.
export const MODEL_CLASS_OPTIONS = Object.entries(SOURCE_TYPES).map(([id, meta]) => ({
    id: Number(id),
    caption: `${meta.label} (${meta.table})`,
}));
