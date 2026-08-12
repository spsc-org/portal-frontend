
export const SUBJECT_ITEM_TYPE_COLUMN_INDEX = {
    1: [
        {
            column: "nameUk",
            index: 5
        },
        {
            column: "nameRu",
            index: 6
        },
        {
            column: "nameEn",
            index: 7
        },
        {
            column: "tax",
            index: 10
        },
        {
            column: "reg",
            index: 11
        },
        {
            column: "doc",
            index: 12
        },
        {
            column: "drsId",
            index: 50
        }
    ], // особа
    2: [
        {
            column: "nameUk",
            index: 5
        },
        {
            column: "nameRu",
            index: 6
        },
        {
            column: "nameEn",
            index: 7
        },
        {
            column: "tax",
            index: 9
        },
        {
            column: "reg",
            index: 10
        },
        {
            column: "doc",
            index: 11
        },
        {
            column: "drsId",
            index: 52
        }
    ], // орг
    5: [
        {
            column: "nameEn",
            index: 5
        },
        {
            column: "imo",
            index: 7
        },
        {
            column: "mmsi",
            index: 8
        },

        {
            column: "drsId",
            index: 50
        },

    ], // судно
}


export const IDENT_ICONS = {tax: "fa-regular fa-wallet", reg: "fa-light fa-credit-card-front", doc: "fa-regular fa-passport"};
export const CATEG_CLASS = {1: "text-orange-500", 2: "text-blue-500", 3: "text-green-500"};
export const PROPOSAL_CLASS = {
    1: "text-gray-700",
    2: "text-gray-700",
    3: "text-blue-500",
    4: "text-blue-500",
    5: "text-green-500",
    6: "text-gray-700",
    7: "text-gray-700"
};
export const safeParsePrecomputed = (value) => {
    if (!value || typeof value !== "string") return null;
    try {
        return JSON.parse(value);
    } catch (e) {
        return null;
    }
};
