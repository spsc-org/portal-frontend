import axios from "axios";

// Словники сторінки (subjectTypes/connectionTypes/projectActionType/projectState) —
// стабільні в межах сесії, кешуються з staleTime: Infinity (useDossierOptionsQuery).
export const fetchDossierOptions = async () => {
    const response = await axios.get("/api/dossier/options");
    return response.data.data;
};

export const fetchProfiles = async ({
    page = 0, limit = 50, subjectTypeIds, modelClassIds, needsReview, conflictOnly, uaSanctionsStatuses,
    uaSanctionsDaysRemainingMax, hasAvatar, connectionsCountMin, connectionsCountMax, matchedPasses, origins, ticketStatus, q, sort, direction,
} = {}) => {
    const response = await axios.get("/api/dossier/profiles", {
        params: {
            page: page + 1,
            per_page: limit,
            sort: sort || undefined,
            direction: direction || undefined,
            subject_type_id: subjectTypeIds?.length ? subjectTypeIds : undefined,
            model_class: modelClassIds?.length ? modelClassIds : undefined,
            ua_sanctions_status: uaSanctionsStatuses?.length ? uaSanctionsStatuses : undefined,
            // matched_pass — фільтр за способом звʼязування (App\Enums\Dossier\MatchedPass):
            // лише досьє, що мають хоча б один звʼязок, знайдений одним з обраних проходів.
            matched_pass: matchedPasses?.length ? matchedPasses : undefined,
            // origin — ручний/автоматичний звʼязок (DossierConnection::ORIGIN_*), окремий
            // вимір від matched_pass (той — ЯКИМ способом, цей — чи людина його підтвердила).
            origin: origins?.length ? origins : undefined,
            // ticketStatus — лише досьє, що мають хоча б один тікет у вказаному стані
            // (DossierTicket::STATE_*); null/undefined означає відсутність фільтра.
            ticket_status: ticketStatus || undefined,
            // Квапилка "потребують рішення щодо продовження найближчим часом" — окремо від
            // ua_sanctions_status (поріг, не категорія; NULL/не-active природно відсіюються на бекенді).
            ua_sanctions_days_remaining_max: uaSanctionsDaysRemainingMax ?? undefined,
            // needsReview — тумблер "лише ті, що потребують перегляду";
            // false/undefined означає відсутність фільтра, а не needs_review=false.
            needs_review: needsReview ? true : undefined,
            // conflictOnly — вужчий тумблер поверх needsReview: лише звʼязки review_reason=conflict
            // (той самий subject/project веде на кілька РІЗНИХ профілів, див. LinkProjectsToDossier::flagConflicts()).
            review_reason: conflictOnly ? ["conflict"] : undefined,
            // hasAvatar — undefined означає відсутність фільтра (не false).
            has_avatar: hasAvatar === undefined ? undefined : hasAvatar,
            // "" означає відсутність фільтра для відповідної межі.
            connections_count_min: connectionsCountMin === "" || connectionsCountMin === undefined ? undefined : connectionsCountMin,
            connections_count_max: connectionsCountMax === "" || connectionsCountMax === undefined ? undefined : connectionsCountMax,
            q: q || undefined,
        },
    });
    return response.data;
};

export const fetchProfile = async (profileId) => {
    const response = await axios.get(`/api/dossier/profiles/${profileId}`);
    return response.data.data;
};

export const findDuplicates = async ({modelClass, modelId}) => {
    const response = await axios.post("/api/dossier/profiles/duplicates", {
        model_class: modelClass,
        model_id: modelId,
    });
    return response.data.data;
};

export const deleteProfile = async (profileId) => {
    await axios.delete(`/api/dossier/profiles/${profileId}`);
};

// 200 з data (значення змінилось) або 204 без тіла (значення те саме, що вже було) —
// повертаємо data.data (може бути undefined для 204, обробляє викликач).
export const updateProfileCaption = async (profileId, viewCaption) => {
    const response = await axios.patch(`/api/dossier/profiles/${profileId}`, {
        view_caption: viewCaption,
    });
    return response.data?.data;
};

// Той самий контракт 200/204, що й updateProfileCaption вище.
export const updateProfileNote = async (profileId, note) => {
    const response = await axios.patch(`/api/dossier/profiles/${profileId}/note`, {note});
    return response.data?.data;
};

// axios сам виставляє Content-Type: multipart/form-data (з boundary) для FormData — вручну не задаємо.
export const uploadProfileAvatar = async (profileId, file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await axios.post(`/api/dossier/profiles/${profileId}/avatar`, formData);
    return response.data.data;
};

export const deleteProfileAvatar = async (profileId) => {
    await axios.delete(`/api/dossier/profiles/${profileId}/avatar`);
};

// Примусовий перерахунок ua_sanctions_status/ua_sanctions_days_remaining для ОДНОГО досьє
// (та сама логіка, що й щоденна dossier:refresh-status) — без очікування крону.
export const refreshProfileStatus = async (profileId) => {
    const response = await axios.post(`/api/dossier/profiles/${profileId}/refresh-status`);
    return response.data.data;
};

// Історія аудиту профілю (App\Enums\Audit\DossierAuditAction) — той самий контракт
// {data, meta:{total,page,limit,pages}}, що й пагіновані списки за CLAUDE.md.
export const fetchProfileAuditHistory = async (profileId, page = 1, limit = 50) => {
    const response = await axios.get(`/api/dossier/profiles/${profileId}/audit`, {
        params: {page, limit},
    });
    return response.data;
};
