import React from "react";
import SecondaryNavLayout from "../../../../Components/SecondaryNav/SecondaryNavLayout.jsx";
import { filterAccessibleNavItems } from "../../../../Components/SecondaryNav/filterAccessibleNavItems.js";
import { INTEGRATIONS_NAVIGATION } from "../config/navigation.js";
import { useMe } from "../../../../hooks/useMe.js";
const IntegrationsLayout = ({ active, children, "data-i-doc": dataIDoc }) => {
    const me = useMe();
    const accessiblePages = me.data?.access?.pages ?? [];

    return (
        <SecondaryNavLayout data-i-doc={dataIDoc} title="Інтеграції" items={filterAccessibleNavItems(INTEGRATIONS_NAVIGATION, accessiblePages)} active={active}>
            {children}
        </SecondaryNavLayout>
    );
};

export default IntegrationsLayout;
