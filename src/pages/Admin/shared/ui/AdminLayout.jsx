// Сторінки Адміністрування (Користувачі / Групи користувачів / Нотифікації) перемикаються
// підменю пункту «Адміністрування» в сайдбарі (entities/menu/menuCache.js, SPA_EXPANDABLE_KEYS),
// тож другого меню на сторінці немає.
const AdminLayout = ({ children, "data-i-doc": dataIDoc }) => (
    <div data-i-doc={dataIDoc} className="px-3 pb-6 pt-3 sm:px-4">
        {children}
    </div>
);

export default AdminLayout;
