import axios from "axios";

export const fetchVesselImoLists = async () => {
    const response = await axios.get("/api/vessel-imo/lists");
    return response.data.data;
};

export const fetchVesselImoLogs = async ({page = 1, limit = 15} = {}) => {
    const response = await axios.get("/api/vessel-imo/logs", {params: {page, limit}});
    return response.data;
};

export const fetchVesselImoDetails = async ({page = 1, limit = 50, q} = {}) => {
    const response = await axios.get("/api/vessel-imo/details", {params: {page, limit, q: q || undefined}});
    return response.data;
};
