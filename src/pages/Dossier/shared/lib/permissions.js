export const canViewProfiles = (auth) => Boolean(auth?.user?.permissions?.pages?.dossier?.profileView);

export const canChangeLink = (auth) => Boolean(auth?.user?.permissions?.pages?.dossier?.changeLink);

export const canDeleteProfile = (auth) => Boolean(auth?.user?.permissions?.pages?.dossier?.deleteProfile);

export const canReadAudit = (auth) => Boolean(auth?.user?.permissions?.pages?.dossier?.readAudit);
