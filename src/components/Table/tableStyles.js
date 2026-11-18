// Portal UI kit — таблиця (еталон: таблиця /project, ProjectListTable).
//   обгортка: картка surface-card + border-default, radius-xl, горизонтальний скрол
//   заголовок: липкий, gray-100 / neutral-900, межа знизу border-default, 12px semibold ink-strong
//   рядок:    без «зебри», межа знизу border-default, hover gray-50 / neutral-700/60
//   клітинка: px-1.5 py-1, align-top, 12px ink (gray-700 / gray-300)
export const TABLE_WRAP =
    "overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800";

export const TABLE = "w-full border-collapse text-left text-xs text-gray-700 dark:text-gray-300";

export const TH =
    "sticky top-0 z-10 border-b border-gray-200 bg-gray-100 px-1.5 py-2 text-left align-middle text-xs font-semibold text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300";

export const TD = "border-b border-gray-200 px-1.5 py-1 align-top dark:border-neutral-700";

export const TR = "transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700/60";

/** Стани рядка: вибраний (master-detail), видалений/неактивний. */
export const TR_SELECTED = "bg-blue-50 dark:bg-blue-800/20";
export const TR_MUTED = "bg-gray-100 dark:bg-neutral-700";

export const TD_EMPTY = "px-3 py-8 text-center text-sm text-gray-600 dark:text-gray-400";

/** Панелі над/під таблицею (тулбар, пагінація) — та сама картка, без тіні (як ListBar /project). */
export const TABLE_BAR =
    "flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300";

/** aria-sort для th: false | "asc" | "desc" → none | ascending | descending. */
export const ariaSort = (direction) => (direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none");
