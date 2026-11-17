import axios from "axios";

// Model-шар інтеграцій (глобальний axios з src/lib/http.js: XSRF/credentials).

export const INTEGRATION_KEYS = {
    datasets: ["searchOptions"],
    importLogs: ["importLogs"],
    datasetLogs: ["datasetImportLogs"],
    logDetails: (id) => ["importLogDetails", id],
    exportFiles: ["exportFiles"],
    vesselLists: ["vessel-imo-lists"],
    vesselLogs: ["vessel-imo-logs"],
    vesselDetails: ["vessel-imo-details"],
};

// ---- Датасети (консолідовані дані) ----

export const fetchDatasets = async () => {
    const response = await axios.get("/api/consolidated-data/import/datasets");
    return { searchMethods: [], datasets: response.data.datasets ?? [] };
};

export const fetchImportLogs = async ({ page, limit, search }) => {
    const { data } = await axios.get("/api/consolidated-data/import/logs", { params: { page, per_page: limit, search } });
    return data;
};

export const fetchDatasetLogs = async ({ datasetId, page, limit }) => {
    if (!datasetId) return { data: [], pagination: {} };
    const { data } = await axios.get(`/api/consolidated-data/import/logs/dataset/${datasetId}`, { params: { page, per_page: limit } });
    return data;
};

export const fetchImportLogDetails = async (logId) => {
    if (!logId) return null;
    const { data } = await axios.get(`/api/consolidated-data/import/logs/${logId}`);
    return data.data;
};

/** Web-маршрут (сесія + XSRF через proxy). → тіло відповіді { success, ... }. */
export const importDataset = async ({ datasetId, file }) => {
    const formData = new FormData();
    formData.append("type", datasetId);
    if (file) formData.append("userfile", file);
    const response = await axios.post("/consolidated-data/import", formData, {
        headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
    });
    return response.data;
};

// ---- Експорт legacy-даних ----

export const fetchExportFiles = async () => (await axios.get("/api/export-legacy-data/list")).data;
export const runLegacyExport = async () => (await axios.get("/api/export-legacy-data")).data;
export const deleteExportFile = (filename) => axios.delete("/api/export-legacy-data", { params: { filename } });

// ---- Судна під санкціями (IMO) ----

export const fetchVesselImoLists = async () => (await axios.get("/api/vessel-imo/lists")).data.data;
export const fetchVesselImoLogs = async ({ page = 1, limit = 15 } = {}) => (await axios.get("/api/vessel-imo/logs", { params: { page, limit } })).data;
export const fetchVesselImoDetails = async ({ page = 1, limit = 50, search } = {}) =>
    (await axios.get("/api/vessel-imo/details", { params: { page, limit, q: search || undefined } })).data;

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
