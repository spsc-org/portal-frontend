// Чисті правила вибору проєктів у кошик (без React і storage).
// cartIds — вміст localStorage["cartItems"] (id можуть бути рядками — порівнюємо як числа).

export const isInCart = (cartIds, id) => cartIds.some((cartId) => Number(cartId) === id);

export const toggleId = (cartIds, id) =>
    isInCart(cartIds, id) ? cartIds.filter((cartId) => Number(cartId) !== id) : [...cartIds, id];

// Стан чекбокса "усі на сторінці": checked — усі вибрані, indeterminate — частина
export const pageSelectionState = (cartIds, pageIds) => {
    const cartSet = new Set(cartIds.map(Number));
    const selected = pageIds.filter((id) => cartSet.has(id)).length;
    const checked = pageIds.length > 0 && selected === pageIds.length;
    return { checked, indeterminate: selected > 0 && !checked, disabled: pageIds.length === 0 };
};

// Усі на сторінці вибрані → прибрати їх; інакше → додати
export const togglePage = (cartIds, pageIds) => {
    if (pageSelectionState(cartIds, pageIds).checked) {
        const pageSet = new Set(pageIds);
        return cartIds.filter((id) => !pageSet.has(Number(id)));
    }
    return [...cartIds, ...pageIds];
};
