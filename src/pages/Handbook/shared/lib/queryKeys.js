export const birthdayKeys = {
    list: (filters) => ["birthdays", filters],
    detail: (id) => ["birthday", id],
    options: () => ["birthday-options"],
};

export const phoneKeys = {
    list: (filters) => ["phones", filters],
    detail: (id) => ["phone", id],
    options: () => ["phone-options"],
    comments: (entryId) => ["phone-comments", entryId],
};
