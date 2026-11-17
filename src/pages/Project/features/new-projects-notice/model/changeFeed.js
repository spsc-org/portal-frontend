// Чисті правила live-оновлення списку з подій ProjectsChanged ({ids, actorId}).
//
// Новий проєкт — id > lastId (meta.lastId сторінки 1 на момент її завантаження; список
// відсортовано id DESC, тож нові завжди з'являються вгорі сторінки 1). Власні нові проєкти
// не рахуються: після збереження легасі-модалка й так перезавантажує список.
// Змінений проєкт — id <= lastId; цікавить лише той, що є на поточній сторінці (тихе оновлення рядка).

const toIds = (ids) => (Array.isArray(ids) ? ids.map(Number).filter((id) => Number.isInteger(id) && id > 0) : []);

export const classifyChange = ({ ids, actorId }, { currentUserId, lastId, pageIds }) => {
    const changed = toIds(ids);
    const isMine = actorId !== null && actorId !== undefined && Number(actorId) === Number(currentUserId);
    const onPage = new Set(pageIds);

    return {
        // lastId ще невідомий (сторінку 1 не завантажували) — класифікувати нові неможливо
        newIds: lastId === null || isMine ? [] : changed.filter((id) => id > lastId),
        updatedOnPage: changed.filter((id) => (lastId === null || id <= lastId) && onPage.has(id)),
    };
};

// Накопичені id нових проєктів (без дублікатів — повторні збереження того ж нового проєкту)
export const addNewIds = (pending, ids) => (ids.length === 0 ? pending : [...new Set([...pending, ...ids])]);

// Після свіжого завантаження сторінки 1 усе з id <= lastId уже в списку
export const pruneShown = (pending, lastId) => pending.filter((id) => id > lastId);
