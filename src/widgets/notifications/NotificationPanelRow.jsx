import { useNavigate } from 'react-router';
import { openUrl } from '../../shared/navigation/openUrl.js';
import { notificationBody, notificationTitle, notificationUrl } from '../../lib/notificationTypes';

/**
 * Рядок нотифікації у спливних панелях (дзвіночок, бейдж розділу).
 * Клік по заголовку — позначає прочитаним і веде на сутність;
 * галочка — лише позначає (рядок зникає, панель лишається).
 */
export default function NotificationPanelRow({ notification: n, onOpen, onMarkRead, isLast, accentClass = '' }) {
    const navigate = useNavigate();
    const url = notificationUrl(n);
    const actor = n.payload?.actor;
    const body = notificationBody(n);

    const handleOpen = (e) => {
        e.preventDefault();
        Promise.resolve(onOpen(n)).finally(() => openUrl(url, navigate));
    };

    return (
        <div
            className={`group relative flex gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700/60 ${accentClass} ${
                isLast ? '' : 'border-b border-gray-100 dark:border-neutral-700'
            }`}
        >
            {actor?.avatar_url ? (
                <img src={actor.avatar_url} alt={actor.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
            ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-500">
                    <i className="fa-solid fa-bell text-[11px]" />
                </span>
            )}
            <div className="min-w-0 flex-1 pr-6">
                {url ? (
                    <a
                        href={url}
                        className="block text-xs font-medium text-gray-800 hover:underline dark:text-gray-200"
                        onClick={handleOpen}
                    >
                        {notificationTitle(n)}
                    </a>
                ) : (
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{notificationTitle(n)}</p>
                )}
                {body && <p className="mt-0.5 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{body}</p>}
            </div>
            <button
                type="button"
                onClick={() => onMarkRead(n.id)}
                title="Позначити прочитаним"
                aria-label="Позначити прочитаним"
                className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-md text-gray-600 opacity-0 transition hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:bg-neutral-600 dark:hover:text-gray-300"
            >
                <i className="fa-regular fa-circle-check text-xs" />
            </button>
        </div>
    );
}

export function EmptyNotifications() {
    return (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <i className="fa-regular fa-bell-slash text-xl text-gray-300 dark:text-gray-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Немає непрочитаних сповіщень</p>
        </div>
    );
}
