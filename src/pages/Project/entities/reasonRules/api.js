// Глобальні (системні) правила обґрунтування — /api/reason-rules/admin
// (user_id IS NULL; персональні правила користувачів тут не показуються).
export const fetchReasonRules = async () => {
    const response = await axios.get("/api/reason-rules/admin");
    return response.data.data;
};

export const createReasonRule = async (payload) => {
    const response = await axios.post("/api/reason-rules/admin", payload);
    return response.data.data;
};

export const updateReasonRule = async (id, payload) => {
    const response = await axios.put(`/api/reason-rules/admin/${id}`, payload);
    return response.data.data;
};

export const deleteReasonRule = async (id) => {
    await axios.delete(`/api/reason-rules/admin/${id}`);
};

// Власний options-ендпоінт цієї сторінки (як і в кожної React-сторінки проєкту) —
// єдиний словник, потрібний тут, це країни для поля "Країна" правила.
export const fetchCountryOptions = async () => {
    const response = await axios.get("/api/reason-rules/options");
    return response.data.data?.country ?? [];
};
