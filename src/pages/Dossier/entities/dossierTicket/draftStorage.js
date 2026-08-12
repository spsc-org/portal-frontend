// Чорновик нового тікета — привʼязаний до базової сутності модалки (entityType/entityId),
// не до тікета (тікета ще нема). Переживає закриття модалки/сторінки, доки не сабмітиться.
const draftKey = (entityType, entityId) => `dossier-ticket-draft-${entityType}-${entityId}`;

export const readDraft = (entityType, entityId) => {
    try {
        const raw = localStorage.getItem(draftKey(entityType, entityId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const writeDraft = (entityType, entityId, draft) => {
    try {
        localStorage.setItem(draftKey(entityType, entityId), JSON.stringify(draft));
    } catch {
        // localStorage може бути недоступним (приватний режим) — ігноруємо
    }
};

export const clearDraft = (entityType, entityId) => {
    try {
        localStorage.removeItem(draftKey(entityType, entityId));
    } catch {
        // ігноруємо
    }
};

export const hasDraft = (entityType, entityId) => {
    const draft = readDraft(entityType, entityId);

    return Boolean(draft && (draft.text?.trim() || draft.extraLinks?.length));
};
