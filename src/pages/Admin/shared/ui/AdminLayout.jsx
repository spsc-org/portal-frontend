import {observer} from "mobx-react-lite";
import SecondaryNavLayout from "../../../../components/SecondaryNav/SecondaryNavLayout.jsx";
import {filterAccessibleNavItems} from "../../../../components/SecondaryNav/filterAccessibleNavItems.js";
import {ADMIN_NAVIGATION} from "../config/navigation.js";
import {useSession} from "../../../../stores/storeHooks.js";

// Тонка обгортка над спільним SecondaryNavLayout — той самий принцип, що й
// HandbookLayout.jsx/StaffLayout.jsx. Користувачі/Групи/Нотифікації —
// незалежні сторінки (свій роут/право), сайдбар веде лише на першу доступну
// (config/sidebar.php, expandable:false) — перемикання між ними тут. Пункти
// без доступу до сторінки (item.page) просто не рендеряться
// (filterAccessibleNavItems проти me.access.pages — сам бере /api/me, сторінці-
// споживачу нічого прокидувати не треба) — якщо після фільтрації лишається
// ≤1 пункт, SecondaryNavLayout сам ховає панель повністю.
const AdminLayout = ({active, children, "data-i-doc": dataIDoc}) => {
    const {me} = useSession();
    const accessiblePages = me?.access?.pages ?? [];

    return (
        <SecondaryNavLayout data-i-doc={dataIDoc} title="Адміністрування" items={filterAccessibleNavItems(ADMIN_NAVIGATION, accessiblePages)} active={active}>
            {children}
        </SecondaryNavLayout>
    );
};

export default observer(AdminLayout);
