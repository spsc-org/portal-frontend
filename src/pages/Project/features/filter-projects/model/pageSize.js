// Кількість рядків на сторінці списку /project/v2 (параметр `limit` GET /api/project/v2/list,
// бекенд приймає 1…ListProjectsRequest::MAX_LIMIT, дефолт — ListProjectsRequest::DEFAULT_LIMIT).
export const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200];
export const DEFAULT_PAGE_SIZE = 100;

// Збережене/передане значення поза списком варіантів — дефолт
export const normalizePageSize = (value) => {
    const size = Number(value);
    return PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE;
};
