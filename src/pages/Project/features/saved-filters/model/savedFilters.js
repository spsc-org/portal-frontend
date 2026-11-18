import { FILTERS } from "../../filter-projects/model/filterConfig.js";

// Збережені набори фільтрів /project (макет «Проєкти v2 — фільтри зверху»).
// Живуть у localStorage на користувача: { sets: SavedSet[], activeId: string | null }.
// SavedSet: { id, name, values: {fKey: string | number[]}, isDefault, updatedAt }.
// Чисті функції — без React/MobX; бекенд-API для наборів поки немає.

export const savedFiltersKey = (userId) => `project-saved-filters:${userId ?? "guest"}`;

const EMPTY = { sets: [], activeId: null };

const CAPTIONS = Object.fromEntries(FILTERS.map((f) => [f.key, f.caption]));
const ORDER = FILTERS.map((f) => f.key);

const isActiveValue = (value) => (Array.isArray(value) ? value.length > 0 : String(value ?? "").trim() !== "");

/** Лише відомі ключі з правильним типом (старий/зіпсований запис не ламає сторінку). */
export const normalizeValues = (values, defaults) => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
        const value = values?.[key];
        if (Array.isArray(defaults[key])) {
            if (Array.isArray(value)) result[key] = value.filter((v) => v !== null && v !== undefined);
        } else if (typeof value === "string") {
            result[key] = value;
        }
    }
    return result;
};

/** Лише активні значення, типи збережено (id лишаються числами) — так набір зберігається. */
export const compactValues = (values) => {
    const result = {};
    for (const key of ORDER) {
        const value = values?.[key];
        if (!isActiveValue(value)) continue;
        result[key] = Array.isArray(value) ? [...value] : String(value).trim();
    }
    return result;
};

/** Канонічна форма для порівняння: порядок id і тип (1 / "1") неважливі. */
const canonical = (values) => {
    const compact = compactValues(values);
    return JSON.stringify(
        Object.fromEntries(Object.entries(compact).map(([key, value]) => [key, Array.isArray(value) ? value.map(String).sort() : value]))
    );
};

export const sameValues = (a, b) => canonical(a) === canonical(b);

/** «3 фільтри · Тип особи, Стан, Виконавець» */
export const describeValues = (values) => {
    const keys = Object.keys(compactValues(values));
    return { count: keys.length, captions: keys.map((key) => CAPTIONS[key] ?? key) };
};

export const pluralFilters = (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} фільтр`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} фільтри`;
    return `${n} фільтрів`;
};

export const readSavedFilters = (storage, userId, defaults) => {
    try {
        const raw = JSON.parse(storage?.getItem(savedFiltersKey(userId)) ?? "null");
        if (!raw || !Array.isArray(raw.sets)) return EMPTY;
        const sets = raw.sets
            .filter((set) => set && typeof set.id === "string" && typeof set.name === "string" && set.name.trim())
            .map((set) => ({
                id: set.id,
                name: set.name.trim(),
                values: compactValues(normalizeValues(set.values, defaults)),
                isDefault: Boolean(set.isDefault),
                updatedAt: typeof set.updatedAt === "string" ? set.updatedAt : null,
            }));
        // за замовчуванням — не більше одного
        let seenDefault = false;
        for (const set of sets) {
            if (set.isDefault && seenDefault) set.isDefault = false;
            if (set.isDefault) seenDefault = true;
        }
        const activeId = sets.some((set) => set.id === raw.activeId) ? raw.activeId : null;
        return { sets, activeId };
    } catch {
        return EMPTY; // зіпсований JSON
    }
};

export const writeSavedFilters = (storage, userId, state) => {
    try {
        storage.setItem(savedFiltersKey(userId), JSON.stringify({ sets: state.sets, activeId: state.activeId }));
    } catch {
        // приватний режим / переповнений storage — набори просто не запамʼятаються
    }
};

export const newSetId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Валідація назви: непорожня, до 60 символів, унікальна (без урахування регістру). */
export const validateSetName = (name, sets, exceptId = null) => {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return "Вкажіть назву набору";
    if (trimmed.length > 60) return "Назва — до 60 символів";
    const lower = trimmed.toLocaleLowerCase("uk");
    if (sets.some((set) => set.id !== exceptId && set.name.toLocaleLowerCase("uk") === lower)) {
        return "Набір з такою назвою вже є";
    }
    return null;
};

/** Позначає набір за замовчуванням (лише один); id = null — зняти з усіх. */
export const withDefault = (sets, id) => sets.map((set) => ({ ...set, isDefault: id !== null && set.id === id }));

export const findDefault = (sets) => sets.find((set) => set.isDefault) ?? null;
