import { observer } from "mobx-react-lite";

/** "Показати ще" для InfiniteQuery зі списку. */
const LoadMore = ({ query }) => (query.hasNextPage ? (
    <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            {query.isFetchingNextPage ? "Завантаження…" : "Показати ще"}
        </button>
    </div>
) : null);

export default observer(LoadMore);
