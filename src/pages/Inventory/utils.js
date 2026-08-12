export const fetchData = async (params) => {
    const filters = {
        ...params,
        fText: params?.fText,
        fBaileeUser: params?.fBaileeUser?.map(f => f.value),
        fResponsibleUser: params?.fResponsibleUser?.map(f => f.value),
        fType: params?.fType?.map(f => f.value),
        fLocation: params?.fLocation?.map(f => f.value),
        fNode: params?.fNode?.map(f => f.value),
    }

    const {
        fBaileeUser,
        fLocation,
        fResponsibleUser,
        fText,
        fType,
        fNode,
        page,
        limit,
        userId,
        sort = "id",
        direction = "desc",
        hideDeleted = false,
        hideNonInventory = false,
        from,
        to
    } = filters;
    const response = await axios.get(`api/inventory`, {
        params: {
            page,
            limit,
            sort,
            hideDeleted,
            hideNonInventory,
            direction,
            from,
            to,
            filters: JSON.stringify({
                fBaileeUser,
                fLocation,
                fResponsibleUser,
                fText,
                fType,
                fNode,
            }),
        },
        method: 'GET',
        headers: {'Content-Type': 'application/json', 'userId': userId},
    });
    return response?.data;
};
