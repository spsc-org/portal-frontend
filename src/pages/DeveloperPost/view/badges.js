// Кольори тегів/статусів поста — той самий принцип, що й чипи фільтрів
// (border+bg+text triplet), просто для бейджа замість кнопки.
export const TAG_BADGE = {
    feature: {label: "Нова функція", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"},
    fix: {label: "Виправлення", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"},
    improvement: {label: "Покращення", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"},
    announcement: {label: "Анонс", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"},
};

export const STATUS_BADGE = {
    draft: {label: "Чернетка", className: "bg-gray-200 text-gray-600 dark:bg-neutral-600 dark:text-gray-300"},
    scheduled: {label: "Заплановано", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"},
    published: {label: "Опубліковано", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"},
};

export const tagBadge = (tag) => {
    if (!tag) return null;
    return TAG_BADGE[tag] || {label: tag, className: "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-400"};
};

export const statusBadge = (status) => STATUS_BADGE[status] || {label: status, className: "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-400"};
