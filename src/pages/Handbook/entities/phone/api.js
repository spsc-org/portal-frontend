import axios from "axios";

export const fetchPhoneOptions = async () => {
    const response = await axios.get("/api/phone/options");
    return response.data.data;
};

export const fetchPhones = async ({page = 0, limit = 200, q, department, status, sort, direction, onlyFavorite, onlyConfirmed} = {}) => {
    const response = await axios.get("/api/phone", {
        params: {
            page: page + 1,
            per_page: limit,
            q: q || undefined,
            department: department?.length ? department : undefined,
            status: status || undefined,
            sort: sort || undefined,
            direction: direction || undefined,
            only_favorite: onlyFavorite ? 1 : undefined,
            only_confirmed: onlyConfirmed ? 1 : undefined,
        },
    });
    return response.data;
};

export const fetchPhone = async (id) => {
    const response = await axios.get(`/api/phone/${id}`);
    return response.data.data;
};

// phones: [{phone, note}, ...] — один суб'єкт може мати кілька номерів.
export const createPhone = async ({name, phones, department, note}) => {
    const response = await axios.post("/api/phone", {
        name,
        phones,
        department: department || undefined,
        note: note || undefined,
    });
    return response.data.data;
};

export const updatePhone = async (id, {name, phones, department, note} = {}) => {
    const payload = {name, phones, department, note};
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const response = await axios.patch(`/api/phone/${id}`, payload);
    return response.data.data;
};

export const deletePhone = async (id) => {
    await axios.delete(`/api/phone/${id}`);
};

// Дублює картку — копія стає ВЛАСНОЮ для того, хто дублює (owner_id = актор).
export const duplicatePhone = async (id) => {
    const response = await axios.post(`/api/phone/${id}/duplicate`);
    return response.data.data;
};

export const archivePhone = async (id) => {
    const response = await axios.post(`/api/phone/${id}/archive`);
    return response.data.data;
};

export const restorePhone = async (id) => {
    const response = await axios.post(`/api/phone/${id}/restore`);
    return response.data.data;
};

export const togglePhoneFavorite = async (id) => {
    const response = await axios.post(`/api/phone/${id}/favorite`);
    return response.data.data;
};

// "Підтвердити актуальність" номера — накопичується, доступно будь-якому
// користувачу з доступом до розділу (не лише власнику запису).
export const confirmPhoneNumber = async (numberId) => {
    const response = await axios.post(`/api/phone/numbers/${numberId}/confirm`);
    return response.data.data;
};

// Історія аудиту — окреме право (readAudit), доступна для будь-якого запису.
export const fetchPhoneAuditHistory = async (id, {page = 1, limit = 50} = {}) => {
    const response = await axios.get(`/api/phone/${id}/audit`, {params: {page, limit}});
    return response.data;
};

export const fetchPhoneComments = async (entryId) => {
    const response = await axios.get(`/api/phone/${entryId}/comments`);
    return response.data.data;
};

export const addPhoneComment = async (entryId, body) => {
    const response = await axios.post(`/api/phone/${entryId}/comments`, {body});
    return response.data.data;
};

export const updatePhoneComment = async (commentId, body) => {
    const response = await axios.patch(`/api/phone/comments/${commentId}`, {body});
    return response.data.data;
};

export const deletePhoneComment = async (commentId) => {
    await axios.delete(`/api/phone/comments/${commentId}`);
};
