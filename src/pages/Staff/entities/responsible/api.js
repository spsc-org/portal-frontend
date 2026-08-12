import axios from "axios";

export const fetchResponsibleOptions = async () => {
    const response = await axios.get("/api/staff/responsible/options");
    return response.data.data;
};

export const fetchResponsibleFunctions = async () => {
    const response = await axios.get("/api/staff/responsible/functions");
    return response.data.data;
};

export const fetchResponsibleAssignments = async () => {
    const response = await axios.get("/api/staff/responsible/assignments");
    return response.data.data;
};

export const fetchMyResponsibleAssignments = async () => {
    const response = await axios.get("/api/staff/responsible/my");
    return response.data.data;
};

export const fetchUsersWithoutResponsibility = async () => {
    const response = await axios.get("/api/staff/responsible/unassigned-users");
    return response.data.data;
};

export const createResponsibleFunction = async ({name, description}) => {
    const response = await axios.post("/api/staff/responsible/functions", {name, description});
    return response.data.data;
};

export const updateResponsibleFunction = async (functionId, {name, description}) => {
    const response = await axios.patch(`/api/staff/responsible/functions/${functionId}`, {name, description});
    return response.data.data;
};

export const deleteResponsibleFunction = async (functionId) => {
    await axios.delete(`/api/staff/responsible/functions/${functionId}`);
};

export const assignResponsible = async ({functionId, userIds, startedAt, reason}) => {
    const response = await axios.post("/api/staff/responsible/assignments", {
        function_id: functionId,
        user_ids: userIds,
        started_at: startedAt,
        reason: reason || undefined,
    });
    return response.data.data;
};

export const updateResponsibleAssignment = async (assignmentId, {functionId, userIds, reason, startedAt, endedAt}) => {
    const payload = {
        function_id: functionId,
        user_ids: userIds,
        reason,
        started_at: startedAt,
        ended_at: endedAt,
    };
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const response = await axios.patch(`/api/staff/responsible/assignments/${assignmentId}`, payload);
    return response.data.data;
};

export const endResponsibleAssignment = async (assignmentId, endedAt) => {
    const response = await axios.patch(`/api/staff/responsible/assignments/${assignmentId}/end`, {
        ended_at: endedAt || undefined,
    });
    return response.data.data;
};
