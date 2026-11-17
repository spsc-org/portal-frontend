// Presence-список → хто який проєкт зараз редагує (без поточного користувача),
// як UserActivityManager._renderProjectEditBadges(): editing_project_id з presence.
// Бейдж суто інформаційний — нічого не блокує (оптимістичне редагування, PROJECT_CONCURRENCY_SPEC.md).
// Повертає Map<projectId:number, Array<{id, name}>>.
export const groupEditorsByProject = (users, currentUserId) => {
    const result = new Map();
    const me = Number(currentUserId);

    for (const user of Array.isArray(users) ? users : []) {
        const projectId = user?.editing_project_id;
        if (projectId === null || projectId === undefined || Number(user.id) === me) continue;

        const key = Number(projectId);
        const editors = result.get(key) ?? [];
        if (!editors.some((editor) => editor.id === user.id)) editors.push({ id: user.id, name: user.name ?? "" });
        result.set(key, editors);
    }

    return result;
};
