export const showDocuments = (data = [], dictionary = {units: [], users: [], types: []}) => {
    if (data && data.length > 0) {
        return data.map(row => {
            return {...row,
                typeId: dictionary.types.find(item => item.id === row.typeId),
                unitId: dictionary.units.find(item => item.id === row.unitId)?.caption,
                createdUserId: dictionary.users.find(item => item.id === row.createdUserId)?.name,
                updatedUserId: dictionary.users.find(item => item.id === row.updatedUserId)?.name,
                performerId: dictionary.users.find(item => item.id === row.performerId)?.name,
            }
        });
    }
    return data;
}
