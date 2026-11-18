import { observer } from "mobx-react-lite";

/** "Показати ще" для InfiniteQuery зі списку. */
const LoadMore = ({ query }) => (query.hasNextPage ? (
    <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-white dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-700">
            {query.isFetchingNextPage ? "Завантаження…" : "Показати ще"}
        </button>
    </div>
) : null);

export default observer(LoadMore);
