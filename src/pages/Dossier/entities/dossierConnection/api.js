import axios from "axios";

export const linkConnection = async (profileId, {modelClass, modelId, matchedCriteria}) => {
    const response = await axios.post(`/api/dossier/profiles/${profileId}/connections`, {
        model_class: modelClass,
        model_id: modelId,
        matched_criteria: matchedCriteria ?? undefined,
    });
    return response.data.data;
};

export const confirmConnection = async (connectionId) => {
    const response = await axios.patch(`/api/dossier/connections/${connectionId}/confirm`);
    return response.data.data;
};

// Реверс confirmConnection — знімає підтвердження (тумблер, 2026-08-05).
export const unconfirmConnection = async (connectionId) => {
    const response = await axios.patch(`/api/dossier/connections/${connectionId}/unconfirm`);
    return response.data.data;
};

// @deprecated 2026-08-05 — кнопку перенесення прибрано з UI (див. ConnectionCard.jsx),
// модель модерації тепер void() + новий звʼязок замість move(). Ендпоінт лишено
// функціональним (isolate, don't delete), функцію не викликано з UI.
export const moveConnection = async (connectionId, {targetProfileId, reason}) => {
    const response = await axios.patch(`/api/dossier/connections/${connectionId}/move`, {
        target_profile_id: targetProfileId,
        reason: reason || undefined,
    });
    return response.data.data;
};

export const unlinkConnection = async (connectionId, {reason} = {}) => {
    await axios.delete(`/api/dossier/connections/${connectionId}`, {
        data: {reason: reason || undefined},
    });
};

// Позначити звʼязок нікчемним (void) — альтернатива unlink() для модератора, який не є
// творцем звʼязку: рядок лишається в реєстрі зі статусом "нікчемний".
export const voidConnection = async (connectionId, {reason} = {}) => {
    const response = await axios.patch(`/api/dossier/connections/${connectionId}/void`, {
        reason: reason || undefined,
    });
    return response.data.data;
};

// Примітка звʼязку — спільне поле, доступне на будь-якому звʼязку (не лише profile-relation).
export const updateConnectionNote = async (connectionId, note) => {
    const response = await axios.patch(`/api/dossier/connections/${connectionId}/note`, {note});
    return response.data.data;
};

export const fetchProjectDetails = async (modelId, userId) => {
    const response = await axios.get(`/api/project/${modelId}/dto`, {
        headers: {userId},
    });
    return response.data.data;
};

export const fetchConsolidatedSourceDetails = async (modelClass, modelId, userId) => {
    const response = await axios.get(`/api/dossier/sources/${modelClass}/${modelId}`, {
        headers: {userId},
    });
    return response.data.data;
};

// Пошук записів-джерел довільним текстом (AddConnectionModal.jsx) — {model_id, caption}[].
export const searchSources = async (modelClass, q) => {
    const response = await axios.get(`/api/dossier/sources/${modelClass}/search`, {
        params: {q},
    });
    return response.data.data;
};

export const linkProfileRelation = async (profileId, {relatedProfileId, connectionTypeId, note}) => {
    const response = await axios.post(`/api/dossier/profiles/${profileId}/relations`, {
        related_profile_id: relatedProfileId,
        connection_type_id: connectionTypeId,
        note: note || undefined,
    });
    return response.data.data;
};

export const unlinkProfileRelation = async (connectionId) => {
    await axios.delete(`/api/dossier/relations/${connectionId}`);
};