import { EXTENDED_FILTER_KEYS, FILTERS } from "./filterConfig.js";
import { buildAttributeOptions, buildSelectOptions } from "./filterOptions.js";
import { countActive } from "./serializeFilters.js";

// Опції всіх select/attribute-фільтрів зі словників легасі (рахується раз на словники)
export const buildFilterOptions = (voc) => {
    if (!voc) return {};
    return Object.fromEntries(
        FILTERS.filter((f) => f.type !== "text").map((f) => [
            f.key,
            f.type === "attribute" ? buildAttributeOptions(voc[f.vocName], voc.subjectType) : buildSelectOptions(voc[f.vocName]),
        ])
    );
};

// Поля панелі для View: лише увімкнені в Settings і (у compact-режимі) лише compact-фільтри.
// kind: "text" | "select" | "attribute".
export const buildFilterFields = ({ values, options, visibility, compact, optionsLoading }) =>
    FILTERS.filter((f) => visibility[f.key] !== false && (f.compact || !compact)).map((f) => ({
        key: f.key,
        id: `project-filter-${f.key}`,
        kind: f.type,
        label: f.caption,
        value: values[f.key],
        options: options[f.key] ?? [],
        isLoading: f.type !== "text" && optionsLoading,
    }));

// Скільки активних фільтрів сховано згорнутою панеллю (бейдж на кнопці)
export const countHiddenActive = (values, visibility, compact) =>
    compact ? countActive(values, EXTENDED_FILTER_KEYS.filter((key) => visibility[key] !== false)) : 0;
