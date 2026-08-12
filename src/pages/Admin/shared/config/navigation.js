// Єдине джерело правди для внутрішнього підменю Адміністрування — нову
// підсторінку додають сюди once, і вона одразу з'являється в SecondaryNavPanel.
// Користувачі й Групи — незалежні сторінки (свій URL/право), href тут —
// просто плоскі роути, не вкладені один в одного.
// `page` — за ним AdminLayout (filterAccessibleNavItems) сам гейтить пункт
// меню проти me.access.pages (/api/me) — того самого списку, що й головний
// Sidebar.jsx, без здогадок про конкретний підключ права.
export const ADMIN_NAVIGATION = [
    {key: "users", label: "Користувачі", icon: "fa-solid fa-user-shield", href: "/admin-users", page: "admin-users"},
    {key: "groups", label: "Групи користувачів", icon: "fa-solid fa-people-group", href: "/admin-groups", page: "admin-groups"},
    {key: "notifications", label: "Нотифікації", icon: "fa-solid fa-bell", href: "/admin-notifications", page: "admin-notifications"},
];
