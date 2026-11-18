// Portal UI kit — записи аудиту змін у модалках (Inventory, Досьє, Телефони, Задачі, Ідентифікатори).
//   картка запису: surface-card + border-default, radius-lg; шапка-кнопка — gray-50 / neutral-900/40
//   diff-таблиця «Поле / Було / Стало»: kit-підписи, межі border-default, Було — danger, Стало — success-strong
export const AUDIT_CARD =
    "mb-2 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800";
export const AUDIT_HEAD =
    "flex w-full items-center justify-between gap-3 bg-gray-50 px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:bg-neutral-900/40 dark:hover:bg-neutral-700/60";
export const AUDIT_BODY = "border-t border-gray-200 px-3 py-2 text-xs text-gray-700 dark:border-neutral-700 dark:text-gray-300";
export const AUDIT_META = "text-xs text-gray-600 dark:text-gray-400";
export const AUDIT_USER = "text-xs text-gray-800 dark:text-gray-200";
export const AUDIT_EMPTY = "text-xs italic text-gray-600 dark:text-gray-400";

export const DIFF_TABLE = "w-full border-collapse text-xs";
export const DIFF_HEAD_ROW = "text-left text-gray-600 dark:text-gray-400";
export const DIFF_TH = "border-b border-gray-200 py-1 pr-2 text-left font-semibold dark:border-neutral-700";
export const DIFF_TR = "border-t border-gray-200 first:border-t-0 dark:border-neutral-700";
export const DIFF_FIELD = "py-1 pr-2 align-top font-medium text-gray-800 dark:text-gray-200";
export const DIFF_FROM = "py-1 pr-2 align-top text-red-700 dark:text-red-400";
export const DIFF_TO = "py-1 pr-2 align-top text-green-700 dark:text-green-400";
