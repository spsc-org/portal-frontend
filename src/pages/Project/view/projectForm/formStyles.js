// Класи полів модалки (modal-project-v2.blade.php: $inp/$ta/$sel/$lbl/$btn/$thr)
const FIELD = "appearance-none block w-full rounded-md px-3 py-2 border bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300 dark:focus:border-blue-400";
export const INPUT = `${FIELD} h-9`;
export const TEXTAREA = FIELD;
export const SELECT = `${FIELD} h-9 py-1`;
export const LABEL = "uppercase text-gray-600 dark:text-gray-400 font-bold text-xs tracking-wide";
export const TOOL_BUTTON = "inline-flex items-center gap-1 py-1 px-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:bg-neutral-700 dark:hover:text-blue-300 transition-colors";
export const TH = "p-1.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide";
export const CELL = "appearance-none w-full h-8 px-1 rounded border bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-blue-400 disabled:bg-gray-100 dark:disabled:bg-neutral-800";

/** Рамка поля за станом валідації: error → червона, warning → помаранчева. */
export const borderFor = (issue) =>
    issue?.level === "error"
        ? "border-red-500 dark:border-red-500"
        : issue?.level === "warning"
            ? "border-orange-400 dark:border-orange-400"
            : "border-gray-200 dark:border-neutral-600";
