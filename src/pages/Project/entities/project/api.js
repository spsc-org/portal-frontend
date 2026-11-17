import axios from "axios";
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

// Список проєктів сторінки /project/v2 — GET /api/project/v2/list
// (ProjectListController, контракт {success, data, meta:{total,page,limit,pages,highlightedWords}, time}).
// `page` з 1; `limit` — рядків на сторінці (1…1000, без нього бекенд бере 100);
// `filters` — JSON-рядок {fKey: val} (лише ключі з ProjectService::$allowedFilters).
// Повертаємо конверт без `success/time`: рядкам потрібен ще й meta (пагінація, підсвітка).
export const fetchProjectList = async ({ page, limit, filters }, userId) => {
    const response = await axios.get("/api/project/v2/list", {
        params: { page, limit, filters: JSON.stringify(filters) },
        headers: { userId },
    });
    return { rows: response.data?.data ?? [], meta: response.data?.meta ?? {} };
};

// Свіжі рядки конкретних проєктів (live-оновлення змінених рядків на сторінці) — той самий v2/list
// з фільтром fId, тож формат рядків ідентичний сторінковому. limit = кількість id — усі в одній відповіді.
export const fetchProjectsByIds = async (ids, userId) => {
    const { rows } = await fetchProjectList({ page: 1, limit: ids.length, filters: { fId: ids.join(",") } }, userId);
    return rows;
};
