// Єдине джерело правди для підменю простору /staff — нову підсторінку
// додають сюди once, і вона одразу з'являється в StaffSubNav.jsx.
// `key` збігається з сегментом шляху (крім attendance — вона на корені /staff).
export const STAFF_NAVIGATION = [
    {key: "attendance", label: "Відвідуваність", icon: "fa-solid fa-calendar-check", href: "/staff"},
    {key: "contracts", label: "Контракти", icon: "fa-solid fa-file-contract", href: "/staff/contracts"},
    {key: "responsible", label: "Відповідальні", icon: "fa-solid fa-user-shield", href: "/staff/responsible"},
];
