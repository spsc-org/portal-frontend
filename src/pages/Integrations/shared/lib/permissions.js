// Датасети/Судна під санкціями (IMO)/Експорт — незалежні сторінки/права
// (integrations-datasets, integrations-vessel-imo, integrations-export);
// "Інтеграції" в сайдбарі — суто інтерфейсна група.
export const canReadIntegrationsDatasets = (auth) => Boolean(auth?.user?.permissions?.pages?.["integrations-datasets"]?.read);

export const canReadIntegrationsVesselImo = (auth) => Boolean(auth?.user?.permissions?.pages?.["integrations-vessel-imo"]?.read);

export const canReadIntegrationsExport = (auth) => Boolean(auth?.user?.permissions?.pages?.["integrations-export"]?.read);
