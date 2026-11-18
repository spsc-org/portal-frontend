// Сторінки Інтеграцій (Датасети / Судна під санкціями (IMO) / Експорт) перемикаються
// підменю пункту «Інтеграції» в сайдбарі (entities/menu/menuCache.js, SPA_EXPANDABLE_KEYS),
// тож другого меню на сторінці немає. Без права — заглушка замість сторінки.
const NoAccess = () => (
    <div className="flex min-h-[50vh] items-center justify-center text-gray-600 dark:text-gray-400">
        <i className="fa-solid fa-lock mr-2"></i>Немає доступу до цього розділу.
    </div>
);

const IntegrationsLayout = ({ canRead = true, children, "data-i-doc": dataIDoc }) => (
    <div data-i-doc={canRead ? dataIDoc : undefined} className="px-3 pb-6 pt-3 sm:px-4">
        {canRead ? children : <NoAccess/>}
    </div>
);

export default IntegrationsLayout;
