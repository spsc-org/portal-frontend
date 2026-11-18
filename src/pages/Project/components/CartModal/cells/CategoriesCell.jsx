import React from "react";

// Порт TableManager.js:#renderCellCategories().
const CATEG_CLASS = {
    1: "text-orange-500",
    2: "text-blue-500",
    3: "text-green-500",
};

const CategoriesCell = ({ precomputedData }) => {
    const categories = precomputedData?.categories;
    if (!Array.isArray(categories) || categories.length === 0) {
        return <span className="italic text-gray-600">Немає категорій</span>;
    }

    return categories.map(({ typeId, caption }, i) => (
        <React.Fragment key={i}>
            <i className={`fa-solid fa-tag ${CATEG_CLASS[typeId] || ""}`} /> {caption};
            {i < categories.length - 1 && <br />}
        </React.Fragment>
    ));
};

export default CategoriesCell;
