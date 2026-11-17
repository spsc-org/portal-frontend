// Опції фільтрів зі словників /api/voc_project (myApp.globals.voc) — як FilterManager.initSelectFilter().
// Словник — масив або об'єкт {key: {id, caption, deletedAt?}}.
const toList = (voc) => (Array.isArray(voc) ? voc : Object.values(voc ?? {}));

export const buildSelectOptions = (voc) =>
    toList(voc).map((item) => {
        const label = item.deletedAt ? `${item.caption} (НЕ ВИКОРИСТОВУЄМО)` : item.caption;
        return { value: item.id, label, title: label };
    });

// Атрибути: кожен дає дві опції — "має" (id) і "без" (-id), як FilterManager.initAttributeFilter().
// icon — іконка типу суб'єкта; title — підказка з типом суб'єкта (subjectTypeId 0 → "всі").
export const buildAttributeOptions = (attributeVoc, subjectTypeVoc) => {
    const subjects = new Map(toList(subjectTypeVoc).map((s) => [s.id, s]));

    return toList(attributeVoc).flatMap((attr) => {
        const subject = subjects.get(attr.subjectTypeId) ?? {};
        const subjectCaption = attr.subjectTypeId === 0 ? "всі" : subject.caption ?? "";
        const common = { icon: subject.icon ?? "", title: `Тип суб'єкта: ${subjectCaption}` };

        return [
            { ...common, value: attr.id, label: attr.caption },
            { ...common, value: -attr.id, label: `БЕЗ: ${attr.caption}` },
        ];
    });
};
