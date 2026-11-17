import axios from "axios";

// Глобальна сутність (не Handbook-специфічна) — тимчасово живе тут, бо
// Довідники поки єдиний споживач; перенести в спільне місце, коли з'явиться
// другий (той самий принцип, що й генералізація SecondaryNav — узагальнюємо
// лише при реальному повторному використанні, не заздалегідь).
export const fetchUserGroupOptions = async () => {
    const response = await axios.get("/api/user-groups/options");
    return response.data.data;
};

export const fetchUserGroups = async () => {
    const response = await axios.get("/api/user-groups");
    return response.data.data;
};

export const createUserGroup = async ({name, memberIds = []}) => {
    const response = await axios.post("/api/user-groups", {name, member_ids: memberIds});
    return response.data.data;
};

export const updateUserGroup = async (id, name) => {
    const response = await axios.patch(`/api/user-groups/${id}`, {name});
    return response.data.data;
};

export const deleteUserGroup = async (id) => {
    await axios.delete(`/api/user-groups/${id}`);
};

export const syncUserGroupMembers = async (id, memberIds = []) => {
    const response = await axios.put(`/api/user-groups/${id}/members`, {member_ids: memberIds});
    return response.data.data;
};
