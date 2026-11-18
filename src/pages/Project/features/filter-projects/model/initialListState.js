import { DEFAULT_PAGE_SIZE, normalizePageSize } from "./pageSize.js";

export const STORAGE_KEY = "project-v2-list";

const toIdList = (value) =>
    (value ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);

const readSaved = (storage) => {
    try {
        return JSON.parse(storage?.getItem(STORAGE_KEY) ?? "null");
    } catch {
        return null; // зіпсований JSON — стартуємо з дефолтів
    }
};

// Початковий стан списку: localStorage, але deep-link з задачі (?fId=1,2) чи з Указів
// (?fDecree=12&fAction=1) дає чистий набір фільтрів — як pages/project.js:init().
// Розмір сторінки (limit) — налаштування користувача, тож зберігається і при deep-link.
// defaults — emptyFilterValues() (передається ззовні, щоб функція лишалась чистою).
// source: "url" (deep-link) | "saved" (останній стан) | "defaults" (перше відкриття —
// тоді сторінка застосовує збережений набір фільтрів за замовчуванням, якщо він є).
export const readInitialListState = (search, storage, defaults) => {
    const params = new URLSearchParams(search);
    const urlFId = params.get("fId");
    const urlFDecree = toIdList(params.get("fDecree"));
    const saved = readSaved(storage);
    const limit = saved?.limit === undefined ? DEFAULT_PAGE_SIZE : normalizePageSize(saved.limit);

    if (urlFId || urlFDecree.length > 0) {
        return {
            source: "url",
            page: 1,
            limit,
            values: {
                ...defaults,
                fId: urlFId ?? "",
                fDecree: urlFDecree,
                fAction: urlFDecree.length > 0 ? toIdList(params.get("fAction")) : [],
            },
        };
    }

    if (saved?.values) {
        // Лише відомі ключі з правильним типом — старий/зіпсований запис не ламає сторінку
        const values = { ...defaults };
        for (const key of Object.keys(defaults)) {
            const value = saved.values[key];
            if (Array.isArray(defaults[key]) ? Array.isArray(value) : typeof value === "string") {
                values[key] = value;
            }
        }
        return { source: "saved", page: Number.isInteger(saved.page) && saved.page > 0 ? saved.page : 1, limit, values };
    }

    return { source: "defaults", page: 1, limit, values: defaults };
};

export const saveListState = (storage, state) => {
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // приватний режим / переповнений storage — стан просто не запамʼятається
    }
};
