import axios from "axios";

// Коротка інфа про судна (назва/тип/прапор/статус/власник) + належність до санкційних
// списків за списком IMO — не вся інформація з vessel_imo_details, лише ключові поля.
export const fetchImoLookup = async (imos) => {
    const response = await axios.post("/api/report/imo-lookup", {imos});
    return response.data.data;
};

const CHUNK_SIZE = 300;

// Список може бути великий — б'ємо на частини, щоб не перевантажувати один запит,
// і прогресивно віддаємо накопичений результат через onProgress по мірі надходження частин.
export const fetchImoLookupChunked = async (imos, onProgress) => {
    const chunks = [];
    for (let i = 0; i < imos.length; i += CHUNK_SIZE) {
        chunks.push(imos.slice(i, i + CHUNK_SIZE));
    }

    let details = [];
    let sanctions = {};
    let lists = [];

    for (const chunk of chunks) {
        const result = await fetchImoLookup(chunk);
        details = details.concat(result.details);
        sanctions = {...sanctions, ...result.sanctions};
        lists = result.lists;
        onProgress?.({details, sanctions, lists});
    }

    return {details, sanctions, lists};
};
