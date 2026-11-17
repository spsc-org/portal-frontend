import { buildPageItems } from "../lib/pagination.js";

// Portal UI kit: primary (blue-600) — активна сторінка; решта — surface-card + border-input,
// radius-md, caption-text (12px). page — 1-based.
const BASE = "inline-flex h-7 min-w-[1.75rem] items-center justify-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300";
const IDLE = "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:bg-neutral-700";
const ACTIVE = "border-blue-600 bg-blue-600 text-white dark:border-blue-600";
const DISABLED = "cursor-not-allowed opacity-50";

const Pagination = ({ page, pages, onChange, disabled = false }) => {
    if (!pages || pages <= 1) return null;

    const go = (target) => {
        if (!disabled && target >= 1 && target <= pages && target !== page) onChange(target);
    };

    return (
        <nav className="flex flex-wrap items-center gap-1" aria-label="Пагінація">
            <button type="button" className={`${BASE} ${IDLE} ${page <= 1 ? DISABLED : ""}`} disabled={page <= 1} onClick={() => go(page - 1)}>
                <i className="fa-solid fa-arrow-left-long text-[10px]" />
                <span>Назад</span>
            </button>
            {buildPageItems(page, pages).map((item) =>
                item.type === "gap" ? (
                    <span key={item.key} className="px-1 text-xs text-gray-500 dark:text-gray-400">
                        …
                    </span>
                ) : (
                    <button
                        key={item.page}
                        type="button"
                        aria-current={item.page === page ? "page" : undefined}
                        className={`${BASE} ${item.page === page ? ACTIVE : IDLE}`}
                        onClick={() => go(item.page)}
                    >
                        {item.page}
                    </button>
                )
            )}
            <button type="button" className={`${BASE} ${IDLE} ${page >= pages ? DISABLED : ""}`} disabled={page >= pages} onClick={() => go(page + 1)}>
                <span>Далі</span>
                <i className="fa-solid fa-arrow-right-long text-[10px]" />
            </button>
        </nav>
    );
};

export default Pagination;
