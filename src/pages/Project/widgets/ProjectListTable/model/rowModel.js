import { getRowAbilities } from "../../../features/project-row-actions/model/abilities.js";

// precomputedData з v2/list уже обʼєкт; рядок — на випадок легасі-формату
export const parsePrecomputed = (raw) => {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

// Рядок API → модель рядка таблиці (усе, що View інакше обчислював би сам)
export const toRowModel = (row, { permissions, terms }) => {
    const isDisabled = row.isDisabled === 1 || row.isDisabled === true;
    return {
        id: row.id,
        row,
        precomputedData: parsePrecomputed(row.precomputedData),
        isDisabled,
        abilities: getRowAbilities(permissions, isDisabled),
        termCaption: terms?.[row.termId] ?? "",
    };
};
