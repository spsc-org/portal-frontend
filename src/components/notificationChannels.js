// Фіксований порядок і повний набір колонок таблиці — незалежно від того, чи
// підтримує канал конкретна категорія (тоді клітинка — просто "—"), щоб рядки
// з різною кількістю каналів (Task/Announcement мають Mattermost, решта — ні)
// не "гуляли" по вертикалі.
export const NOTIFICATION_CHANNEL_COLUMNS = [
    { channel: 'in_app', label: 'В додатку' },
    { channel: 'mail', label: 'Пошта' },
    { channel: 'mattermost', label: 'Mattermost' },
];
