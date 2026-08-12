// Масові дії над відібраними проєктами (bulkTab1..12 у легасі-модалці) —
// усі під /api/project/*, той самий легасі-захист ExtractUserPermissions
// (заголовок userId, не сесія). Кожна функція повторює РІВНО той самий
// payload, що й cartManager.js:prepareRequestBody(), щоб бекенд (жодних
// змін там) сприймав запит однаково незалежно від того, з легасі-форми він
// прийшов чи з цього React-острівця.

const post = (url, body, userId) => axios.post(url, body, { headers: { userId } });

export const linkProjectsToProposals = async (projectIdList, proposalIdList, reason, userId) => {
    const { data } = await post("/api/project/bulkLinkProjectsWithProposal", { projectIdList, proposalIdList, reason }, userId);
    return data;
};

export const addRestrictions = async (projectIdList, restrictionIdList, reason, userId) => {
    const { data } = await post("/api/project/bulkAddRestrictions", { projectIdList, restrictionIdList, reason }, userId);
    return data;
};

export const rewriteRestrictions = async (projectIdList, restrictionIdList, reason, userId) => {
    const { data } = await post("/api/project/bulkRewriteRestrictions", { projectIdList, restrictionIdList, reason }, userId);
    return data;
};

export const rewriteRestriction25 = async (projectIdList, text, reason, userId) => {
    const { data } = await post("/api/project/bulkRewriteRestriction25", { projectIdList, text, reason }, userId);
    return data;
};

export const rewriteTerm = async (projectIdList, termId, reason, userId) => {
    const { data } = await post("/api/project/bulkRewriteTerm", { projectIdList, termId, reason }, userId);
    return data;
};

export const replaceReasoningText = async (projectIdList, search, replace, reason, userId) => {
    const { data } = await post("/api/project/bulkReplaceText", { projectIdList, search, replace, reason }, userId);
    return data;
};

// Пошук підрозділу за реєстраційним номером документа (bulkTab7, поле
// "Номер") — GET /api/helper/validateNumber, публічний ендпоінт без
// ExtractUserPermissions (звір. з core.js:lookupUnitByRegnum), тому без
// заголовка userId.
export const lookupUnitByRegnum = async (text) => {
    const response = await axios.get("/api/helper/validateNumber", { params: { text } });
    return response.data;
};

export const addDocument = async (projectIdList, docFields, userId) => {
    // formCartActionDocument — єдина форма БЕЗ reason (легасі теж його не шле, див.
    // cartManager.js:prepareRequestBody: `if (formId !== 'formCartActionDocument')`).
    const { data } = await post("/api/project/bulkAddDocument", { projectIdList, ...docFields }, userId);
    return data;
};

export const setPerformer = async (projectIdList, performerId, reason, userId) => {
    const { data } = await post("/api/project/bulkSetPerformer", { projectIdList, performerId, reason }, userId);
    return data;
};

export const setValidator = async (projectIdList, validatorId, reason, userId) => {
    const { data } = await post("/api/project/bulkSetValidator", { projectIdList, validatorId, reason }, userId);
    return data;
};

export const setState = async (projectIdList, stateId, reason, userId) => {
    const { data } = await post("/api/project/bulkSetState", { projectIdList, stateId, reason }, userId);
    return data;
};

export const generateDossiers = async (projectIdList, dossierOptions, reason, userId) => {
    const { data } = await post("/api/project/bulkGenerateDossiers", { projectIdList, ...dossierOptions, reason }, userId);
    return data;
};

// Створити задачу з набором проєктів — на відміну від інших 11 дій, це НЕ
// один bulk-ендпоінт, а два послідовні виклики (створити задачу → прив'язати
// до неї весь набір), точнісінько як у cartManager.js:handleCreateTask().
export const createTaskWithProjects = async (projectIdList, taskFields, userId) => {
    const createBody = {
        title: taskFields.title,
        description: taskFields.description || undefined,
        priorityId: taskFields.priorityId ? Number(taskFields.priorityId) : undefined,
        assignedUserId: taskFields.assignedUserId ? Number(taskFields.assignedUserId) : undefined,
        projectId: taskFields.projectId ? Number(taskFields.projectId) : undefined,
        dueDate: taskFields.dueDate || undefined,
    };
    const created = await axios.post("/api/task", createBody, { headers: { userId } });
    if (!created.data?.success || !created.data?.data?.id) {
        throw new Error(created.data?.message ?? "Не вдалося створити задачу");
    }
    const taskId = created.data.data.id;
    const linked = await axios.patch(`/api/task/${taskId}/projects`, { projectIds: projectIdList.map(Number) }, { headers: { userId } });
    if (!linked.data?.success) {
        throw new Error("Задачу створено, але набір не прив'язано: " + (linked.data?.message ?? ""));
    }
    // `message` — свій, а не з envelope /api/task/{id}/projects (там його
    // зазвичай немає): CartModal.jsx:handleActionDone показує envelope.message
    // тостом для ВСІХ 12 дій, і без цього тут вискочив би нейтральний
    // "Операцію виконано" замість конкретики (як у легасі handleCreateTask()).
    return {
        taskId,
        ...linked.data,
        message: `Задачу #${taskId} створено (проєктів у наборі: ${projectIdList.length})`,
    };
};

// Журнал масових операцій (tab-3) — новий, спеціально виділений під корзину
// ендпоінт (ProjectCartController::getLog, той самий SQL, що й легасі
// ProjectsController::retreiveBulcOperationsLog, лишений як є для legacy-форми).
export const fetchBulkOperationsLog = async (userId) => {
    const response = await axios.get("/api/project/cart/log", { headers: { userId } });
    return response.data?.data ?? [];
};

// Дані відібраних проєктів (tab-1) — POST /api/project/cart/collection,
// повертає "сирі" колонки проєкту (не HTML-розмітку, як легасі renderCartTableRows,
// що будує рядки через методи Page-класу). React-таблиця свідомо не відтворює
// 1-в-1 усі колонки й стилі легасі — лише мінімум для перевірки набору й bulk-дій.
export const fetchCartCollection = async (projectIds, userId) => {
    if (projectIds.length === 0) return [];
    const response = await axios.post("/api/project/cart/collection", { ids: projectIds }, { headers: { userId } });
    return response.data?.data ?? [];
};

// Словники ТІЛЬКИ для форми "Створити задачу" (bulkTab12) — пріоритети й
// проєкти з домену Task, не з entities/project/. Легасі теж бере їх окремим
// запитом (GET /api/task/options), а не через project-словники.
export const fetchTaskOptionsForCart = async (userId) => {
    const response = await axios.get("/api/task/options", { headers: { userId } });
    return response.data?.data ?? {};
};
