import SecondaryNavPanel from "./SecondaryNavPanel.jsx";

// Full-height варіант SecondaryNavLayout.jsx — для просторів, де сторінки самі
// є full-bleed master-detail (h-full, overflow-hidden, як Task/Announcement/
// DeveloperPost), а не звичайний потік сторінки з відступами. Той самий API
// (title/items/active/children), той самий SecondaryNavPanel — лише зовнішня
// обгортка займає всю висоту fullBleed-<main> (h-full; маршрут з handle.fullBleed).
// Дочірній контент повинен використовувати h-full, НЕ h-screen — висоту 100vh
// уже задає цей layout. Один пункт (чи менше) після фільтрації за правами —
// перемикати нема між чим, панель не рендериться (той самий принцип, що й
// SecondaryNavLayout.jsx).
const FullHeightSecondaryNavLayout = ({title, items, active, children, "data-i-doc": dataIDoc}) => {
    if ((items?.length ?? 0) <= 1) {
        return (
            <div className="h-full overflow-hidden bg-gray-100 p-3 dark:bg-gray-900">
                <div data-i-doc={dataIDoc} className="h-full overflow-hidden rounded-2xl">{children}</div>
            </div>
        );
    }

    return (
        <div className="flex h-full items-stretch gap-3 overflow-hidden bg-gray-100 p-3 dark:bg-gray-900">
            <div data-i-doc={dataIDoc} className="min-w-0 flex-1 overflow-hidden rounded-2xl">
                {children}
            </div>
            <div className="shrink-0 py-1">
                <SecondaryNavPanel title={title} items={items} active={active}/>
            </div>
        </div>
    );
};

export default FullHeightSecondaryNavLayout;
