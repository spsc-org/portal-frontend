import { observer } from 'mobx-react-lite';
import { Link } from 'react-router';
import { useSession } from '../../stores/storeHooks.js';
import NotificationBell from '../notifications/NotificationBell.jsx';
import { avatarInitials } from '../../lib/avatarInitials.js';

/** Блок "Мій користувач" у сайдбарі (аватар, імʼя, налаштування, дзвіночок). */
function SidebarUserMenu({ collapsed = false }) {
    const { me } = useSession();
    const initials = avatarInitials(me?.initials, me?.name);
    const name = me?.name || '';

    return (
        <>
            {/* /profile — поки Blade-сторінка бекенду (поза SPA), тому звичайне посилання. */}
            <a
                href="/profile"
                className="group flex min-w-0 items-center rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-neutral-700"
                aria-label="Редагувати профіль користувача"
                title={name}
            >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-xs font-semibold text-gray-800 dark:bg-neutral-600 dark:text-gray-100">
                    {me?.avatar_url ? (
                        <img src={me.avatar_url} alt={initials} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        initials
                    )}
                </span>
                {!collapsed && (
                    <span className="mx-2 min-w-0 truncate font-medium text-gray-800 dark:text-gray-200">{name}</span>
                )}
            </a>
            {!collapsed && (
                <div className="flex shrink-0 items-center gap-1">
                    <Link
                        to="/settings"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                        title="Налаштування"
                        aria-label="Налаштування"
                    >
                        <i className="fa-solid fa-gear text-sm" />
                    </Link>
                    <NotificationBell />
                </div>
            )}
        </>
    );
}

export default observer(SidebarUserMenu);
