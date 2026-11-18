const NOTIFICATION_TYPES = {
    task: { buildUrl: (payload) => `/task?view=${payload.entity_id}` },
    dossier: { buildUrl: (payload) => `/dossier?view=${payload.entity_id}` },
    announcement: { buildUrl: (payload) => `/announcement?view=${payload.entity_id}` },
    developer_post: { buildUrl: (payload) => `/developer-posts?view=${payload.entity_id}` },
    // Реальна бізнес-логіка ще не диспетчеризує ці типи (стаб-класи нотифікацій),
    // але реєстр має вміти відрендерити їх, якщо/коли вони з'являться.
    project_ticket: { buildUrl: (payload) => `/project?view=${payload.entity_id}` },
    inventory: { buildUrl: (payload) => `/inventory?view=${payload.entity_id}` },
};

export function notificationUrl(notification) {
    return NOTIFICATION_TYPES[notification.type]?.buildUrl(notification.payload ?? {}) ?? null;
}

export function notificationTitle(notification) {
    return notification.payload?.title ?? notification.payload?.message ?? notification.type;
}

export function notificationBody(notification) {
    return notification.payload?.body ?? null;
}

/**
 * Мапа notification.type (App\Enums\NotificationType) -> ключ категорії
 * (App\Enums\Notification\InAppNotificationCategory). Рядки НЕ завжди
 * збігаються один в один: тип `dossier` належить до категорії `dossier_ticket`.
 * `system.message` не має категорії — системні повідомлення не гейтяться
 * жодним користувацьким тумблером у налаштуваннях.
 */
const NOTIFICATION_TYPE_TO_CATEGORY = {
    task: 'task',
    dossier: 'dossier_ticket',
    project_ticket: 'project_ticket',
    inventory: 'inventory',
    announcement: 'announcement',
    developer_post: 'developer_post',
};

/**
 * Кольори категорій для дзвіночка нотифікацій: акцент на рядку (ліва межа)
 * та на заголовку групи (крапка). Червоний навмисно не використовується —
 * він зарезервований під лічильник непрочитаних на самому дзвінику.
 */
export const NOTIFICATION_CATEGORIES = {
    task: {
        label: 'Задачі',
        dotClass: 'bg-blue-500 dark:bg-blue-400',
        borderClass: 'border-l-blue-500 dark:border-l-blue-400',
    },
    project_ticket: {
        label: 'Тікети проєктів',
        dotClass: 'bg-violet-500 dark:bg-violet-400',
        borderClass: 'border-l-violet-500 dark:border-l-violet-400',
    },
    dossier_ticket: {
        label: 'Тікети досьє',
        dotClass: 'bg-amber-500 dark:bg-amber-400',
        borderClass: 'border-l-amber-500 dark:border-l-amber-400',
    },
    inventory: {
        label: 'Інвентарний облік',
        dotClass: 'bg-teal-500 dark:bg-teal-400',
        borderClass: 'border-l-teal-500 dark:border-l-teal-400',
    },
    announcement: {
        label: 'Оголошення',
        dotClass: 'bg-pink-500 dark:bg-pink-400',
        borderClass: 'border-l-pink-500 dark:border-l-pink-400',
    },
    developer_post: {
        label: 'Оновлення',
        dotClass: 'bg-purple-500 dark:bg-purple-400',
        borderClass: 'border-l-purple-500 dark:border-l-purple-400',
    },
};

/** Нейтральне трактування для сповіщень без категорії (системні повідомлення). */
const SYSTEM_CATEGORY = {
    key: 'system',
    label: 'Системні',
    dotClass: 'bg-gray-400 dark:bg-neutral-400',
    borderClass: 'border-l-gray-300 dark:border-l-gray-600',
};

export function notificationCategory(notification) {
    const key = NOTIFICATION_TYPE_TO_CATEGORY[notification.type];
    const category = key ? NOTIFICATION_CATEGORIES[key] : null;
    return category ? { key, ...category } : SYSTEM_CATEGORY;
}

/**
 * "Загальна" нотифікація (без розділу сайдбару, App\Enums\NotificationType::sidebarSection()
 * === null на бекенді) — саме такі й лише такі показує дзвіник; предметні типи
 * (тут-таки типи з категорією) тепер живуть у бейджах сайдбару.
 */
export function isGeneralNotification(type) {
    return !(type in NOTIFICATION_TYPE_TO_CATEGORY);
}

/**
 * Групує сповіщення за категорією для панелі дзвіника. Групи впорядковані за
 * часом найновішого елемента всередині групи (найсвіжіша активність — першою),
 * а не за фіксованим алфавітним/enum-порядком: це панель «що нового», тож
 * категорія з найактуальнішою подією має привертати увагу найпершою.
 */
export function groupNotificationsByCategory(items) {
    const groups = new Map();

    items.forEach((item) => {
        const category = notificationCategory(item);
        if (!groups.has(category.key)) {
            groups.set(category.key, { ...category, items: [] });
        }
        groups.get(category.key).items.push(item);
    });

    const latestTimestamp = (group) => group.items.reduce((max, n) => {
        const time = n.created_at ? new Date(n.created_at).getTime() : 0;
        return Number.isFinite(time) ? Math.max(max, time) : max;
    }, 0);

    return Array.from(groups.values()).sort((a, b) => latestTimestamp(b) - latestTimestamp(a));
}
