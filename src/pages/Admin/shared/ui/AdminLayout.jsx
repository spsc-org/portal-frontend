import React from "react";
import SecondaryNavLayout from "../../../../Components/SecondaryNav/SecondaryNavLayout.jsx";
import {filterAccessibleNavItems} from "../../../../Components/SecondaryNav/filterAccessibleNavItems.js";
import {ADMIN_NAVIGATION} from "../config/navigation.js";
import {useMe} from "../../../../hooks/useMe.js";

// Тонка обгортка над спільним SecondaryNavLayout — той самий принцип, що й
// HandbookLayout.jsx/StaffLayout.jsx. Користувачі/Групи/Нотифікації —
// незалежні сторінки (свій роут/право), сайдбар веде лише на першу доступну
// (config/sidebar.php, expandable:false) — перемикання між ними тут. Пункти
// без доступу до сторінки (item.page) просто не рендеряться
// (filterAccessibleNavItems проти me.access.pages — сам бере /api/me, сторінці-
// споживачу нічого прокидувати не треба) — якщо після фільтрації лишається
// ≤1 пункт, SecondaryNavLayout сам ховає панель повністю.
const AdminLayout = ({active, children, "data-i-doc": dataIDoc}) => {
    const me = useMe();
    const accessiblePages = me.data?.access?.pages ?? [];

    return (
        <SecondaryNavLayout data-i-doc={dataIDoc} title="Адміністрування" items={filterAccessibleNavItems(ADMIN_NAVIGATION, accessiblePages)} active={active}>
            {children}
        </SecondaryNavLayout>
    );
};

export default AdminLayout;
