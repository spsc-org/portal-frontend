import {http as axios} from "../../../../lib/api.js";
// Власний словник сторінки "Масовий пошук" (групи датасетів + методи
// пошуку) — НЕ /api/consolidated-data/options (той належить /search).
export const fetchMassSearchOptions = async () => {
    const response = await axios.get("api/mass-search/options");
    return response.data.data;
};
