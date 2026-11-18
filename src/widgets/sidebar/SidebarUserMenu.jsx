import { observer } from 'mobx-react-lite';
import { Link } from 'react-router';
import { useSession } from '../../stores/storeHooks.js';
import NotificationBell from '../notifications/NotificationBell.jsx';
import { avatarInitials } from '../../lib/avatarInitials.js';

const ICON_BTN =
    'inline-flex shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-white';

function Avatar({ me, initials, size }) {
    return (
        <span
            className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 font-bold text-white ${size}`}
        >
            {initials}
            {me?.avatar_url && (
                // Поверх ініціалів: якщо файл не віддається (404) — лишаються ініціали.
                <img
                    key={me.avatar_url}
                    src={me.avatar_url}
                    alt={initials}
                    onError={(e) => (e.currentTarget.hidden = true)}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                />
            )}
        </span>
    );
}

/** Картка "Мій користувач" унизу сайдбару (аватар, імʼя, налаштування, дзвіночок, вихід). */
function SidebarUserMenu({ collapsed = false }) {
    const session = useSession();
    const { me } = session;
    const initials = avatarInitials(me?.initials, me?.name);
    const name = me?.name || '';
    // /api/me не містить email — він є в /api/spa/auth.
    const email = session.auth.user?.email;

    const logoutButton = (
        <button
            type="button"
            onClick={() => session.logout()}
            className={`${ICON_BTN} ${collapsed ? 'h-11 w-11' : 'h-8 w-8'}`}
            title="Вийти"
            aria-label="Вийти"
        >
            <i className="fa-solid fa-arrow-right-from-bracket text-sm" aria-hidden="true" />
        </button>
    );

    if (collapsed) {
        return (
            <div className="flex flex-col items-center gap-2">
                <NotificationBell className={`${ICON_BTN} relative h-11 w-11`} />
                <Link to="/profile" className="rounded-full" aria-label={`Профіль: ${name}`} title={name}>
                    <Avatar me={me} initials={initials} size="h-11 w-11 text-[13px]" />
                </Link>
                {logoutButton}
            </div>
        );
    }

    return (
        <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-gray-100 p-2 dark:bg-neutral-800">
            <Link
                to="/profile"
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg"
                aria-label="Редагувати профіль користувача"
                title={name}
            >
                <Avatar me={me} initials={initials} size="h-9 w-9 text-[13px]" />
                <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{name}</span>
                    {email && <span className="truncate text-xs text-gray-600 dark:text-gray-400">{email}</span>}
                </span>
            </Link>
            <div className="flex shrink-0 items-center gap-0.5">
                <Link to="/settings" className={`${ICON_BTN} h-8 w-8`} title="Налаштування" aria-label="Налаштування">
                    <i className="fa-solid fa-gear text-sm" aria-hidden="true" />
                </Link>
                <NotificationBell className={`${ICON_BTN} relative h-8 w-8`} />
                {logoutButton}
            </div>
        </div>
    );
}

export default observer(SidebarUserMenu);
