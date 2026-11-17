import { observer } from "mobx-react-lite";

const NotificationToolsView = ({ vm }) => (
    <div data-i-doc="page:develop-notifications" className="p-6 max-w-2xl mx-auto">

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
                Генерує тестову нотифікацію обраному юзеру (actor = ви, хто натиснув кнопку).
                Payload мінімальний — посилання будує фронтенд за <code>type</code> + <code>entity_id</code>.
                Типи з <code>entity_id</code> (усі, крім «Системне повідомлення») ідуть у
                БЕЙДЖ відповідного розділу сайдбару, а не в дзвіник — перевірте сайдбар після кліку.
            </p>

            <div>
                <label htmlFor="notif-target-user" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Кому надіслати
                </label>
                <select id="notif-target-user" value={vm.targetUserId} onChange={(e) => vm.setTargetUser(e.target.value)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-3 py-2">
                    {vm.users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name}{user.id === vm.currentUserId ? " (ви)" : ""}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    Блок «Поточний стан» нижче завжди показує СВІЙ стан (сесія, у якій ви зараз) —
                    якщо оберете іншого юзера, перевірте його бейджі/дзвіник у нього самого.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {vm.types.map((item) => (
                    <button key={item.type} type="button" onClick={() => vm.send(item)}
                            disabled={vm.sendingType === item.type}
                            className="text-left border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                        <div className="font-semibold text-sm">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.hint}</div>
                    </button>
                ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Поточний стан</h2>
                    <button type="button" onClick={vm.refreshState} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                        Оновити
                    </button>
                </div>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto text-gray-700 dark:text-gray-300">
                    {vm.state ? JSON.stringify(vm.state, null, 2) : "—"}
                </pre>
            </div>
        </div>
    </div>
);

export default observer(NotificationToolsView);
