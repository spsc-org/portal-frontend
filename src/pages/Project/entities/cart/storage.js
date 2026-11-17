// Той самий ключ і той самий формат (плаский JSON-масив числових ID), що й
// у легасі CartManager (resources/js/pages/project/cartManager.js, storageKey
// = "cartItems"). Це навмисно "спільний міст" між старою сторінкою й новим
// React-острівцем: обидва читають/пишуть один localStorage-ключ, тому кнопки
// "додати в кошик" на легасі-сторінці й ця React-модалка бачать той самий
// список без жодної додаткової синхронізації.
const STORAGE_KEY = "cartItems";

export const getCartIds = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === "undefined" || raw === "null") return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const setCartIds = (ids) => {
    const unique = [...new Set(ids)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    // Легасі-сторінка (лічильник кошика в хедері тощо) слухає саме цю подію
    // опосередковано через власний polling/виклики CartManager.update() —
    // ми не можемо гукнути її напряму, тож просто тримаємо localStorage
    // джерелом істини й покладаємось на те, що вона перечитує його при дії
    // користувача (відкриття модалки, клік по кошику). Кастомна подія — про
    // всяк випадок, якщо колись знадобиться реактивний міст в інший бік.
    window.dispatchEvent(new CustomEvent("project-cart-changed", { detail: unique }));
};

export const removeCartId = (id) => {
    const next = getCartIds().filter((existingId) => Number(existingId) !== Number(id));
    setCartIds(next);
    return next;
};

export const clearCartIds = () => {
    setCartIds([]);
};
