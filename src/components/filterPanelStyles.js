// Portal UI kit — картка панелі фільтрів (еталон: ProjectFilters на /project):
// surface-card (white / neutral-800), border-default (gray-200 / neutral-700), radius-xl, p-2.
export const FILTER_PANEL_CLASS =
    "rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800"

// Sticky-варіант (над таблицею/списком при скролі вікна; Header — 50px).
export const FILTER_PANEL_STICKY_CLASS = `sticky top-[50px] z-20 ${FILTER_PANEL_CLASS}`
