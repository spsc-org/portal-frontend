export const profileTitle = (profile) => profile?.view_caption?.trim() || `Профіль #${profile?.id}`;

export const pluralConnections = (count) => {
    const abs = Math.abs(count) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return "зв'язків";
    if (last > 1 && last < 5) return "зв'язки";
    if (last === 1) return "зв'язок";
    return "зв'язків";
};

export const pluralDays = (count) => {
    const abs = Math.abs(count) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return "днів";
    if (last > 1 && last < 5) return "дні";
    if (last === 1) return "день";
    return "днів";
};

// Стан профілю в майстер-списку (за макетом): needs_review → лише якір → зв'язки.
export const profileState = (profile) => {
    if ((profile?.needs_review_connections_count ?? 0) > 0) {
        return {label: "необхідно підтвердити", classes: "text-orange-600 dark:text-orange-400"};
    }
    return {label: "зв'язки", classes: "text-blue-600 dark:text-blue-400"};
};
