import React from "react";

// Порт TableManager.js:#renderCellSubjectType() — той самий набір іконок.
const ICONS = {
    1: { icon: "fa-user", title: "Особа", duo: false },
    2: { icon: "fa-industry", title: "Організація", duo: false },
    3: { icon: "fa-user-tie-hair", title: "Індивідуальний підприємець", duo: true },
    5: { icon: "fa-ship", title: "Судно", duo: true },
    6: { icon: "fa-plane", title: "Повітряне судно", duo: true },
};

const SubjectTypeIcon = ({ typeId }) => {
    const item = ICONS[typeId];
    if (!item) return null;
    return <i className={`${item.duo ? "fa-duotone" : "fa-solid"} ${item.icon}`} title={item.title} />;
};

export default SubjectTypeIcon;
