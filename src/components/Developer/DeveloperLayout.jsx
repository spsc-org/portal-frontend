import React from "react";
import FullHeightSecondaryNavLayout from "../SecondaryNav/FullHeightSecondaryNavLayout.jsx";
import {DEVELOPER_NAVIGATION} from "./navigation.js";

// Тонка обгортка над спільним FullHeightSecondaryNavLayout — той самий принцип,
// що й StaffLayout.jsx/HandbookLayout.jsx над (звичайним) SecondaryNavLayout.jsx.
// Простір /developer-posts, /developer-debug — full-bleed master-detail
// (h-full, overflow-hidden, як Task/Announcement), тому secondary-nav тут
// full-height варіант, а не звичайний потік сторінки.
const DeveloperLayout = ({active, children, "data-i-doc": dataIDoc}) => (
    <FullHeightSecondaryNavLayout data-i-doc={dataIDoc} title="Розробка" items={DEVELOPER_NAVIGATION} active={active}>
        {children}
    </FullHeightSecondaryNavLayout>
);

export default DeveloperLayout;
