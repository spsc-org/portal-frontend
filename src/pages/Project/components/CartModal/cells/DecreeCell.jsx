import React from "react";

// Порт TableManager.js:#renderCellDecree() + core.js:formatDateExpiredAt().
// Легасі-кошик (cartManager.js) фактично викликає цю функцію НЕПРАВИЛЬНО —
// передає termId замість precomputedData.decree (об'єкта декрету), тож
// у самому кошику ця клітинка завжди деградує до гілки decreeCode+expiredAt.
// Тут викликаємо коректно, з precomputedData.decree — дані для цього вже
// є в тому самому precomputedData, просто легасі їх туди не передавав.
const formatDateExpiredAt = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("uk-UA", { year: "2-digit", month: "2-digit", day: "2-digit" });
};

const DecreeCell = ({ decreeCode, expiredAt, decree }) => {
    const code = decree?.code ?? decreeCode;
    if (!code) {
        return (
            <>
                <span className="italic text-gray-400">Немає указу</span>
                <hr />
            </>
        );
    }

    const isActive = decree ? decree.isActive : true;

    let dateNode = null;
    if (decree?.date) {
        dateNode = <span className="text-xs text-gray-500">{decree.date.substring(0, 10)}</span>;
    } else if (expiredAt) {
        dateNode = (
            <span className="text-xs" title="Термін закінчення дії">
                {formatDateExpiredAt(expiredAt)}
            </span>
        );
    }

    return (
        <>
            <i className={`fa-solid fa-file-certificate ${isActive ? "text-red-500" : "text-gray-400"}`} /> {code} {dateNode}
            <hr />
        </>
    );
};

export default DecreeCell;
