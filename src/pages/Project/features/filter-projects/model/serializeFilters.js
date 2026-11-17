// Значення фільтрів React-панелі → `filters` для GET /api/project/v2/list.
// Повторює FilterManager.getFilterValues(): вимкнені в Settings фільтри не йдуть у запит.
// Порожні значення пропускаємо (бекенд і так їх ігнорує — ProjectListService::listFilter).
//
// values            — {fKey: string | number[]}
// visibility        — {fKey: boolean} (з легасі "project-settings"; відсутній ключ = увімкнено)
// proposalExtended  — {enabled, val} з легасі-модалки "Фільтр за поданням"
export const serializeFilters = (values, visibility = {}, proposalExtended = null) => {
    const result = {};

    for (const [key, value] of Object.entries(values)) {
        if (visibility[key] === false) continue;

        if (Array.isArray(value)) {
            if (value.length > 0) result[key] = value;
        } else if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed !== "") result[key] = trimmed;
        }
    }

    if (proposalExtended?.enabled && Array.isArray(proposalExtended.val) && proposalExtended.val.length > 0) {
        result.fProposalExtended = proposalExtended.val;
    }

    return result;
};

// Кількість активних фільтрів (для бейджа на кнопці розширених фільтрів)
export const countActive = (values, keys) =>
    keys.filter((key) => {
        const value = values[key];
        return Array.isArray(value) ? value.length > 0 : String(value ?? "").trim() !== "";
    }).length;
