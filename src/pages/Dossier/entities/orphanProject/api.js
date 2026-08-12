import axios from "axios";

export const fetchOrphanProjects = async ({page = 0, limit = 50, q, subjectTypeIds, stateIds} = {}) => {
    const response = await axios.get("/api/dossier/orphans", {
        params: {
            page: page + 1,
            per_page: limit,
            q: q || undefined,
            subject_type_id: subjectTypeIds?.length ? subjectTypeIds : undefined,
            state_id: stateIds?.length ? stateIds : undefined,
        },
    });
    return response.data;
};

// Створює нове досьє з проєкту-сироти і одразу звʼязує цей самий проєкт із ним
// (OrphanProjectService::createFromProject) — повертає створений профіль.
export const createProfileFromOrphan = async (projectId) => {
    const response = await axios.post(`/api/dossier/orphans/${projectId}/profile`);
    return response.data.data;
};

// Пакетне створення досьє для кількох сиріт одним запитом (напр. усіх, завантажених
// на видиму сторінку) — OrphanProjectService::createManyFromProjects. Помилка на одному
// проєкті не зупиняє решту — відповідь містить і created, і errors.
export const bulkCreateProfilesFromOrphans = async (projectIds) => {
    const response = await axios.post("/api/dossier/orphans/bulk", {project_ids: projectIds});
    return response.data.data;
};
