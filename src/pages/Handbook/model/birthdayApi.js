import axios from "axios";

// Словники сторінки (scopes для фільтра) — стабільні в межах сесії, той
// самий принцип, що й /api/announcement/options.
export const fetchBirthdayOptions = async () => {
    const response = await axios.get("/api/birthday/options");
    return response.data.data;
};

export const fetchBirthdays = async ({page = 0, limit = 50, q, month, scope} = {}) => {
    const response = await axios.get("/api/birthday", {
        params: {
            page: page + 1,
            per_page: limit,
            q: q || undefined,
            month: month || undefined,
            scope: scope || undefined,
        },
    });
    return response.data;
};

export const fetchBirthday = async (id) => {
    const response = await axios.get(`/api/birthday/${id}`);
    return response.data.data;
};

export const createBirthday = async ({name, dateOfBirth, note, isDefault = false}) => {
    const response = await axios.post("/api/birthday", {
        name,
        date_of_birth: dateOfBirth,
        note: note || undefined,
        is_default: isDefault ? 1 : 0,
    });
    return response.data.data;
};

export const updateBirthday = async (id, {name, dateOfBirth, note} = {}) => {
    const payload = {name, date_of_birth: dateOfBirth, note};
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const response = await axios.patch(`/api/birthday/${id}`, payload);
    return response.data.data;
};

export const deleteBirthday = async (id) => {
    await axios.delete(`/api/birthday/${id}`);
};

// Повна заміна списку розшарювання (груп, sync) — лише для власного запису.
export const shareBirthday = async (id, groupIds = []) => {
    const response = await axios.post(`/api/birthday/${id}/share`, {group_ids: groupIds});
    return response.data.data;
};


export const birthdayImportTemplateUrl = "/api/birthday/import/template";

export const previewBirthdayImport = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post("/api/birthday/import/preview", formData);
    return response.data.data;
};

export const commitBirthdayImport = async ({rows}) => {
    const response = await axios.post("/api/birthday/import/commit", {
        rows: rows.map(({name, date_of_birth, note}) => ({name, date_of_birth, note})),
    });
    return response.data.data;
};
