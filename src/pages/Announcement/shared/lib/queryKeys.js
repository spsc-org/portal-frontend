export const announcementKeys = {
    list: (filters) => ["announcements", filters],
    detail: (announcementId) => ["announcement", announcementId],
    options: () => ["announcement-options"],
};
