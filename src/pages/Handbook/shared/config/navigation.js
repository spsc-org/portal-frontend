// Єдине джерело правди для внутрішнього підменю Довідників — нову підсторінку
// додають сюди once, і вона одразу з'являється в SecondaryNavPanel. Телефони й
// Дні народження — незалежні сторінки (свій URL/право), href тут — просто
// плоскі роути, не вкладені один в одного. `page` — ключ сторінки в
// User.permissions.pages, ТОЙ САМИЙ, що й `page` у config/sidebar.php —
// за ним HandbookLayout сам, без хардкоду, гейтить пункт меню (item без
// доступу до сторінки — просто не рендериться).
export const HANDBOOK_NAVIGATION = [
    {key: "phones", label: "Телефони", icon: "fa-solid fa-phone", href: "/handbook-phones", page: "handbook-phones"},
    {key: "birthdays", label: "Дні народження", icon: "fa-solid fa-cake-candles", href: "/handbook-birthdays", page: "handbook-birthdays"},
];
