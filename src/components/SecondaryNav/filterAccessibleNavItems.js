// Універсальний фільтр пунктів другого бокового меню (SecondaryNavPanel) за
// поточними правами користувача. Один спільний хелпер для БУДЬ-ЯКОГО домену
// (Handbook/Staff/Admin/Developer) — кожен Layout лише прокидує свій `items`
// (з `page`-ключем на кожному пункті) і `accessiblePages`.
//
// `accessiblePages` — той самий готовий, уже відфільтрований список
// (`me.access.pages` з /api/me), яким користується головний Sidebar.jsx —
// НЕ окрема перевірка `permissions.pages[page][конкретний ключ]` (раніше тут
// доводилось вгадувати/хардкодити, який саме підключ — `read` чи `manage` —
// гейтить конкретну сторінку; тепер це рахує AccessiblePagesResolver один
// раз на бекенді, тут лише перевірка належності списку).
export const filterAccessibleNavItems = (items, accessiblePages = []) =>
    items.filter((item) => !item.page || accessiblePages.includes(item.page));
