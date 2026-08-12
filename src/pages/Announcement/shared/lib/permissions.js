export const canReadAnnouncements = (auth) => Boolean(auth?.user?.permissions?.pages?.announcement?.read);

export const canCreateAnnouncement = (auth) => Boolean(auth?.user?.permissions?.pages?.announcement?.create);

export const canManageAnnouncement = (auth, announcement) =>
    canCreateAnnouncement(auth) && Number(announcement?.author_id) === Number(auth?.user?.id);
