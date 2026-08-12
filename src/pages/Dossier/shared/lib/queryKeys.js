export const sanctionProfileKeys = {
    list: (filters) => ['sanction-profiles', filters],
    detail: (profileId) => ['sanction-profile', profileId],
    connections: (profileId) => ['sanction-profile', profileId, 'connections'],
    options: () => ['dossier-options'],
};

export const sanctionConnectionKeys = {
    sourceDetails: (modelClass, modelId) => ['sanction-source-details', modelClass, modelId],
    sourceSearch: (modelClass, q) => ['sanction-source-search', modelClass, q],
};

export const orphanProjectKeys = {
    list: (filters) => ['orphan-projects', filters],
};

export const dossierTicketKeys = {
    list: (entityType, entityId) => ['dossier-tickets', entityType, entityId],
};