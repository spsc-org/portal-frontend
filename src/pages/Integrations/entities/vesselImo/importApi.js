import axios from "axios";

const buildFormData = (file) => {
    const formData = new FormData();
    formData.append("userfile", file);
    return formData;
};

// Аналіз книги БЕЗ запису в БД — кількості (додано/видалено/без змін) по кожному списку.
export const previewVesselImoImport = async (file) => {
    const response = await axios.post("/api/vessel-imo/preview", buildFormData(file), {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return response.data.data;
};

export const commitVesselImoImport = async (file) => {
    const response = await axios.post("/api/vessel-imo/import", buildFormData(file), {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return response.data.data;
};

// Деталі суден (Equasis та подібні джерела) — окрема загальна таблиця, ключ IMO,
// повна заміна на кожен імпорт. Той самий превʼю-принцип: аналіз без запису → підтвердження.
export const previewVesselImoDetailsImport = async (file) => {
    const response = await axios.post("/api/vessel-imo/details/preview", buildFormData(file), {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return response.data.data;
};

export const commitVesselImoDetailsImport = async (file) => {
    const response = await axios.post("/api/vessel-imo/details/import", buildFormData(file), {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return response.data.data;
};
