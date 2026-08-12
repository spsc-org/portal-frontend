export const canDeleteRow = (row, auth) => {
    const permission = auth?.user?.permissions?.pages?.task?.delete;
    // Якщо запис видалений — кнопка не показується
    if (row?.original?.deleted_at) return false;
    // Якщо має загальний дозвіл на видалення
    if (permission === true) return true;
    // Якщо дозвіл "individual" — перевіряємо, чи id створювача збігається
    if (permission === 'individual') {
        return row.original.createdUserId === auth?.user?.id;
    }
    // Інакше не дозволено
    return false;
};

export const canUpdateRow = (row, auth) => {
    const permission = auth?.user?.permissions?.pages?.task?.update;
    // Видалені задачі не редагуються
    if (row?.original?.deleted_at) return false;
    if (permission === true) return true;
    // "individual" — власник АБО учасник (участь = запрошення працювати над задачею)
    if (permission === 'individual') {
        const userId = auth?.user?.id;
        return row.original.createdUserId === userId
            || (row.original.assignedUsers || []).some(user => user.id === userId);
    }
    return false;
};

export const canDeleteForceRow = (row, auth) => {
    const permission = auth?.user?.permissions?.pages?.task?.delete;
    // Якщо дозвіл "individual" — перевіряємо, чи id створювача збігається
    if (permission === 'individual') {
        return row.original.createdUserId === auth?.user?.id;
    }
    // Якщо має загальний дозвіл на видалення
    if (permission === true) return true;
    // Інакше не дозволено
    return false;
};

export const canRestore = (row, auth) => {
    const permission = auth?.user?.permissions?.pages?.task?.restore;
    const isDeleted = Boolean(row.original?.deleted_at);
    if (permission === 'individual' && isDeleted) {
        return row.original.createdUserId === auth?.user?.id;
    }
    return permission && isDeleted;
}
