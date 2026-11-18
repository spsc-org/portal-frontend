// Portal UI kit — CTA сортування в заголовку таблиці: увесь підпис — кнопка,
// іконка ↕ (сіра, яскравіша при наведенні) / ↑ ↓ (primary) показує стан.
// direction: false | "asc" | "desc"; next — наступний стан (для підказки).
const SORT_TITLES = { asc: "Сортувати за зростанням", desc: "Сортувати за спаданням" };

const SortButton = ({ label, direction = false, next, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        title={next ? SORT_TITLES[next] : direction ? "Скинути сортування" : SORT_TITLES.asc}
        className="group/sort -mx-1 inline-flex max-w-full items-center gap-1 rounded px-1 py-0.5 text-left font-semibold hover:bg-gray-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:hover:bg-neutral-700"
    >
        <span className="min-w-0 break-words">{label}</span>
        <i
            aria-hidden="true"
            className={`shrink-0 text-[10px] ${
                direction === "asc"
                    ? "fa-solid fa-arrow-up text-blue-600 dark:text-blue-400"
                    : direction === "desc"
                        ? "fa-solid fa-arrow-down text-blue-600 dark:text-blue-400"
                        : "fa-solid fa-arrow-down-arrow-up text-gray-500 opacity-60 group-hover/sort:opacity-100 dark:text-gray-400"
            }`}
        />
    </button>
);

export default SortButton;
