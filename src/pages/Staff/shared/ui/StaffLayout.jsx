import React from "react";
import SecondaryNavLayout from "../../../../Components/SecondaryNav/SecondaryNavLayout.jsx";
import {STAFF_NAVIGATION} from "../config/navigation.js";
import {useStaffOptions} from "../lib/queries.js";

// Тонка обгортка над спільним SecondaryNavLayout — Staff-специфічне тут лише
// список пунктів меню (STAFF_NAVIGATION) і довантаження спільних довідників
// розділу (useStaffOptions(), той самий queryKey, що й у StaffAttendance/Index.jsx
// — React Query бере з одного кешу, повторного запиту немає).
const StaffLayout = ({active, children, "data-i-doc": dataIDoc}) => {
    useStaffOptions();

    return (
        <SecondaryNavLayout data-i-doc={dataIDoc} title="Персонал" items={STAFF_NAVIGATION} active={active}>
            {children}
        </SecondaryNavLayout>
    );
};

export default StaffLayout;
