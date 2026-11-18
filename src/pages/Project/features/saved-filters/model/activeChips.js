import { FILTERS } from "../../filter-projects/model/filterConfig.js";

// Чипи рядка «Активні фільтри»: «Тип особи: Юридична особа», «Стан: Діє, Скасовано +2».
// options — buildFilterOptions(voc): {fKey: [{value, label}]}. Поки словник вантажиться — id.
const MAX_LABELS = 2;

export const buildActiveChips = (values, options) =>
    FILTERS.flatMap((filter) => {
        const value = values?.[filter.key];
        if (Array.isArray(value)) {
            if (value.length === 0) return [];
            const byValue = new Map((options?.[filter.key] ?? []).map((option) => [String(option.value), option.label]));
            const labels = value.map((id) => byValue.get(String(id)) ?? `#${id}`);
            const shown = labels.slice(0, MAX_LABELS).join(", ");
            const rest = labels.length - MAX_LABELS;
            return [{
                key: filter.key,
                caption: filter.caption,
                text: rest > 0 ? `${shown} +${rest}` : shown,
                title: `${filter.caption}: ${labels.join(", ")}`,
                empty: [],
            }];
        }
        const text = String(value ?? "").trim();
        if (!text) return [];
        return [{ key: filter.key, caption: filter.caption, text, title: `${filter.caption}: ${text}`, empty: "" }];
    });
