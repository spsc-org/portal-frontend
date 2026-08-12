export const ENTITY_PROFILE = "profile";
export const ENTITY_CONNECTION = "connection";
export const ENTITY_ORPHAN = "orphan";

export const STATE_OPEN = "open";
export const STATE_RESOLVED = "resolved";

export const isOpen = (ticket) => ticket?.state === STATE_OPEN;

export const stateMeta = (state) =>
    state === STATE_RESOLVED
        ? {label: "вирішено", icon: "fa-solid fa-circle-check", classes: "text-green-600 dark:text-green-400"}
        : {label: "відкритий", icon: "fa-regular fa-circle-dot", classes: "text-orange-600 dark:text-orange-400"};

export const entityLabel = (type) => {
    if (type === ENTITY_PROFILE) return "Досьє";
    if (type === ENTITY_ORPHAN) return "Сирота";
    return "Звʼязок";
};

// Звʼязок не має власного deep-link (вибір звʼязку не синхронізований з URL) — веде
// на профіль-власника (link.profile_id, бек резолвить його одним batch-запитом).
// Сирота — це проєкт без досьє, тож замість /dossier веде напряму на картку проєкту
// (entity_id тут і є id проєкту — той самий id, що орфан-панель показує як "Проєкт #id").
export const entityUrl = (link) => {
    if (link.type === ENTITY_ORPHAN) return `/project?card=${link.id}`;
    return link.profile_id ? `/dossier?view=${link.profile_id}` : null;
};
