// Стан завантаження списку для UI:
// - isLoading (скелет замість рядків): ще немає даних, легасі-хост не готовий (немає словників),
//   або показуються дані ПОПЕРЕДНЬОГО запиту (інша сторінка/фільтри — keepPreviousData);
// - isRefreshing (рядки лишаються, лише приглушені): фонове перезавантаження ТОГО Ж запиту,
//   напр. після збереження в легасі-модалці — скелет тут дав би мерехтіння на кожне збереження.
export const listLoadState = ({ ready, isPending, isPlaceholderData, isFetching }) => {
    const isLoading = !ready || isPending || isPlaceholderData;
    return { isLoading, isRefreshing: isFetching && !isLoading };
};

// Скільки скелет-рядків малювати: стільки ж, скільки було (таблиця не змінює висоту), у межах 5–15
export const skeletonRowCount = (previousCount) => Math.min(15, Math.max(5, previousCount || 10));
