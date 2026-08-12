export const fetchSearchData = async (params) => {
    const {
        search,
        groups = [],
        searchMethods = [],
        types = [],
        item_states = [],
        page,
        limit,
        userId,
        sort = "id",
        direction = "desc"
    } = params;

    // Підготовка параметрів для API
    const apiParams = {
        q: search,
        limit: limit,
        sort: sort,
        direction: direction,
        page: page,
        format: 'true',
    };

    // Методи пошуку - підтримка обох форматів {id, caption} і {value, label}
    const methodIds = searchMethods
        .filter(method => method && (method.id || method.value))
        .map(method => method.id || method.value);
    apiParams.search_methods = JSON.stringify(methodIds);

    // Групи датасетів — відправляємо string IDs груп ('nsdc', 'ofac', 'ds_14', ...)
    // Бекенд розкриє їх у конкретні dataset IDs
    const groupIds = groups
        .filter(group => group && (group.id !== undefined || group.value !== undefined))
        .map(group => group.id !== undefined ? group.id : group.value);
    apiParams.groups = JSON.stringify(groupIds);

    // Типи - підтримка обох форматів {id, caption} і {value, label}
    const typeIds = types
        .filter(type => type && (type.id || type.value))
        .map(type => type.id || type.value);
    apiParams.types = JSON.stringify(typeIds);

    // Стани - підтримка обох форматів {id, caption} і {value, label}
    const stateIds = item_states
        .filter(state => state && (state.id || state.value))
        .map(state => state.id || state.value);
    apiParams.item_states = JSON.stringify(stateIds);

    const response = await axios.get(`api/consolidated-data/search`, {
        params: apiParams,
        headers: {
            'Content-Type': 'application/json',
            'userId': userId
        },
    });

    return response?.data;
};
