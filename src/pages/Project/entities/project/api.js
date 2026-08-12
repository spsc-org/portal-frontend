// Спільні словники сторінки /project — GET /api/project/options?only=...
// (ProjectOptionsController, вже існує). Це НЕ кошик-специфічна сутність:
// будь-який майбутній React-острівець цієї сторінки (список, фільтри тощо)
// має підтягувати словники звідси, а не дублювати власний fetch.
//
// /api/project/* — легасі-захист ExtractUserPermissions (не auth:sanctum),
// читає заголовок userId (не сесію) — той самий патерн, що й
// ProjectsSetModal.jsx/AttachmentsGallery.jsx. userId передається явно,
// бо на цій сторінці немає Inertia-пропа `auth` (легасі Blade) — острівець
// отримує його зі свого мосту монтування (див. islands/CartModalIsland.jsx).
export const fetchProjectOptions = async (only, userId) => {
    const response = await axios.get("/api/project/options", {
        params: { only: only.join(",") },
        headers: { userId },
    });
    return response.data?.data ?? {};
};
