// Спільні класи головної (макет Welcome, Portal UI Kit): картка white / neutral-800, border gray-200 / neutral-700.
export const CARD = "rounded-xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800";

export const CARD_HEAD = "flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-neutral-700";

export const SECTION_TITLE = "m-0 text-base font-bold uppercase text-gray-800 dark:text-gray-100";

export const LINK = "text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300";

export const MUTED = "text-sm text-gray-600 dark:text-gray-400";

// Сегментований перемикач (період графіка, вкладки задач)
export const SEGMENTS = "flex gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-neutral-700 dark:bg-neutral-900";

export const segment = (active) =>
    `inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors ${
        active
            ? "bg-blue-600 text-white"
            : "bg-transparent text-gray-600 hover:bg-white hover:text-gray-800 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
    }`;

export const BADGE = "inline-flex shrink-0 items-center whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium";

export const BADGE_TONES = {
    blue: "bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    gray: "bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-200",
    red: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200",
    amber: "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
};
