// Єдине джерело правди для внутрішнього підменю простору "Розробка" — нову
// підсторінку додають сюди once, і вона одразу з'являється в SecondaryNavPanel.
// Порядок навмисний: Пости — перші (головний, часто відвідуваний розділ),
// Дебаг — другий (поступово наповнюваний інструментарій).
export const DEVELOPER_NAVIGATION = [
    {key: "posts", label: "Пости", icon: "fa-solid fa-code-branch", href: "/developer-posts"},
    {key: "debug", label: "Дебаг", icon: "fa-solid fa-bug", href: "/developer-debug"},
];
