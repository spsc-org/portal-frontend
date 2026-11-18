const BASE = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition";
const IDLE = "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-700 dark:border-gray-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:border-neutral-500 dark:hover:text-gray-100";
const ACTIVE = {
    blue: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    amber: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    green: "border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/40 dark:text-green-300",
};

// Спільний className чип-кнопки (панелі фільтрів Task/Announcement/DeveloperPost) —
// використовується і в ChipToggle, і в кнопках, що не вписуються в нього 1:1 (з меню/іконкою праворуч).
export const chipToggleClassName = (active, color = "blue") => `${BASE} ${active ? ACTIVE[color] : IDLE}`;
