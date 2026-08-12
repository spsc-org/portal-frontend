import React, {useEffect, useState} from "react";
import {usePage} from "@inertiajs/react";

const TEST_TYPES = [
    {
        type: "system.message",
        title: "Системне повідомлення",
        hint: "Без entity_id — лишається в дзвінику",
    },
    {
        type: "task",
        entityId: "397",
        title: "Задача #397",
        hint: 'Бейдж розділу "task" · веде на /task?view=397',
    },
    {
        type: "dossier",
        entityId: "48043",
        title: "Досьє #48043",
        hint: 'Бейдж розділу "dossier" · веде на /dossier?view=48043',
    },
    {
        type: "project_ticket",
        entityId: "1",
        title: "Тікет проєкту #1",
        hint: 'Бейдж розділу "project" · веде на /project?view=1',
    },
    {
        type: "inventory",
        entityId: "1",
        title: "Інвентарна одиниця #1",
        hint: 'Бейдж розділу "inventory" · веде на /inventory?view=1',
    },
    {
        type: "announcement",
        entityId: "1",
        title: "Оголошення #1",
        hint: 'Бейдж розділу "announcement" · веде на /announcement?view=1',
    },
];
// Чистий React-порт розробницької сторінки /develop/notifications (раніше
// resources/views/develop/notifications.blade.php, плейн Blade + vanilla JS) — 2026-08-06,
// за проханням користувача, з посиланням із /developer-debug (за аналогією з /develop/dossier).
// Функціональність НЕ змінена: генерація тестової нотифікації обраному юзеру (actor = поточний
// юзер) через POST /api/notifications/generate-test, і блок "Поточний стан" — свій стан
// (сесія поточного юзера), що читає GET /api/notifications/sections + /api/notifications/unread-count.
const Notifications = ({users}) => {
    const {auth} = usePage().props;
    const currentUserId = auth?.user?.id;
    const [targetUserId, setTargetUserId] = useState(currentUserId ?? (users[0]?.id ?? ""));
    const [state, setState] = useState(null);
    const [sendingType, setSendingType] = useState(null);

    const refreshState = async () => {
        try {
            const [sectionsRes, unreadRes] = await Promise.all([
                axios.get("/api/notifications/sections"),
                axios.get("/api/notifications/unread-count"),
            ]);
            setState({
                sections: sectionsRes.data?.data ?? {},
                bell_unread_count: unreadRes.data?.data?.count ?? null,
            });
        } catch {
            // ігноруємо — блок стану лишиться на попередньому значенні
        }
    };

    useEffect(() => {
        refreshState();
    }, []);

    const sendTest = async ({type, entityId}) => {
        setSendingType(type);
        try {
            const body = {type};
            if (entityId) body.entity_id = entityId;
            if (targetUserId) body.user_id = targetUserId;
            await axios.post("/api/notifications/generate-test", body);
            await refreshState();
        } catch {
            alert("Помилка створення нотифікації");
        } finally {
            setSendingType(null);
        }
    };

    return (
        <div data-i-doc="page:develop-notifications" className="p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications — тестові повідомлення</h1>
                <a href="/develop" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center">
                    <i className="fas fa-arrow-left mr-2"></i> Назад
                </a>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                    Генерує тестову нотифікацію обраному юзеру (actor = ви, хто натиснув кнопку).
                    Payload мінімальний — посилання будує фронтенд за <code>type</code> + <code>entity_id</code>.
                    Типи з <code>entity_id</code> (усі, крім "Системне повідомлення") тепер ідуть у
                    БЕЙДЖ відповідного розділу сайдбару, а не в дзвіник — перевірте сайдбар після кліку.
                </p>

                <div>
                    <label htmlFor="notif-target-user" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Кому надіслати
                    </label>
                    <select id="notif-target-user" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-3 py-2">
                        {users.map((targetUser) => (
                            <option key={targetUser.id} value={targetUser.id}>
                                {targetUser.name}{targetUser.id === currentUserId ? " (ви)" : ""}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        Блок "Поточний стан" нижче завжди показує СВІЙ стан (сесія, у якій ви зараз) —
                        якщо оберете іншого юзера, перевірте його бейджі/дзвіник у нього самого.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {TEST_TYPES.map((item) => (
                        <button key={item.type} type="button" onClick={() => sendTest(item)}
                                disabled={sendingType === item.type}
                                className="text-left border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                            <div className="font-semibold text-sm">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.hint}</div>
                        </button>
                    ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Поточний стан</h2>
                        <button type="button" onClick={refreshState} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                            Оновити
                        </button>
                    </div>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto text-gray-700 dark:text-gray-300">
                        {state ? JSON.stringify(state, null, 2) : "—"}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
