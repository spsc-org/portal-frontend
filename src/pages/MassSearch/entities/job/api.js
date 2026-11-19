import {API_BASE_URL, http as axios} from "../../../../lib/api.js";
export const fetchMassSearchJobs = async () => {
    const response = await axios.get("api/mass-search/jobs");
    return response.data.data;
};

export const fetchMassSearchJob = async (jobId) => {
    const response = await axios.get(`api/mass-search/jobs/${jobId}`);
    return response.data.data;
};

export const deleteMassSearchJob = async (jobId) => {
    await axios.delete(`api/mass-search/jobs/${jobId}`);
};

// groupIds/searchMethodIds — масиви "сирих" ID (ключі груп, числові ID
// методів), той самий формат, що відправляє одиничний /search
// (resources/js/ReactPages/AdvancedSearch/utils/utils.js). Порожньо/не
// передано = дефолт на бекенді (усі датасети / лише 'basic').
export const runMassSearchJobSearch = async (jobId, {groupIds = [], searchMethodIds = []} = {}) => {
    const response = await axios.post(`api/mass-search/jobs/${jobId}/search`, {
        group_ids: groupIds,
        search_method_ids: searchMethodIds,
    });
    return response.data.data;
};

export const retryMassSearchJobItem = async ({jobId, itemId}) => {
    const response = await axios.post(`api/mass-search/jobs/${jobId}/items/${itemId}/search`);
    return response.data.data;
};

export const massSearchJobExportUrl = (jobId) => `${API_BASE_URL}/api/mass-search/jobs/${jobId}/export`;
