// Елементи пагінації: перші/останні WINDOW сторінок + ±WINDOW навколо поточної,
// розриви — "gap". Та сама схема, що й у легасі Page.getItems() (pages/project.js).
// page — 1-based. Повертає масив: {type: "page", page} | {type: "gap", key}.
export const buildPageItems = (page, pages, window = 3) => {
    const items = [];
    let gapOpen = false;

    for (let p = 1; p <= pages; p++) {
        const visible = p <= window || p > pages - window || Math.abs(p - page) <= window;
        if (visible) {
            items.push({ type: "page", page: p });
            gapOpen = false;
        } else if (!gapOpen) {
            items.push({ type: "gap", key: `gap-${p}` });
            gapOpen = true;
        }
    }

    return items;
};
