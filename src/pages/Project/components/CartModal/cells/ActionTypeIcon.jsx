import React from "react";

// Порт TableManager.js:#renderCellActionType() у чистий React — той самий
// набір кодів/кольорів/підписів, без залежності від легасі myApp.
const ICONS = {
    1: { icon: "fa-right-to-bracket", color: "text-green-500", title: "Застосування" },
    2: { icon: "fa-right-left", color: "text-blue-500", title: "Зміна" },
    3: { icon: "fa-right-from-bracket", color: "text-red-800", title: "Скасування" },
};

const ActionTypeIcon = ({ actionType }) => {
    const item = ICONS[actionType];
    if (!item) return <>{actionType}</>;
    return <i className={`fa-solid ${item.icon} ${item.color}`} title={item.title} />;
};

export default ActionTypeIcon;
