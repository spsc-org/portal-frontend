import React from "react";
import SecondaryNavLayout from "../../../../Components/SecondaryNav/SecondaryNavLayout.jsx";
import {filterAccessibleNavItems} from "../../../../Components/SecondaryNav/filterAccessibleNavItems.js";
import {HANDBOOK_NAVIGATION} from "../config/navigation.js";
import {useMe} from "../../../../hooks/useMe.js";

// Тонка обгортка над спільним SecondaryNavLayout — той самий принцип, що й
// StaffLayout.jsx/AdminLayout.jsx. Пункти меню без доступу до сторінки
// (item.page) просто не рендеряться — filterAccessibleNavItems проти
// me.access.pages (сам бере /api/me, нічого прокидувати ззовні не треба),
// спільний для будь-якого домену; нову сторінку довідника додають лише в
// navigation.js.
const HandbookLayout = ({active, children, "data-i-doc": dataIDoc}) => {
    const me = useMe();
    const accessiblePages = me.data?.access?.pages ?? [];

    return (
        <SecondaryNavLayout data-i-doc={dataIDoc} title="Довідники" items={filterAccessibleNavItems(HANDBOOK_NAVIGATION, accessiblePages)} active={active}>
            {children}
        </SecondaryNavLayout>
    );
};

export default HandbookLayout;
