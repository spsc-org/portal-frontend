import { observer } from 'mobx-react-lite';
import { Link } from 'react-router';
import { useSession } from '../../stores/storeHooks.js';
import NotificationBell from '../notifications/NotificationBell.jsx';

/** Блок "Мій користувач" у сайдбарі (аватар, імʼя, налаштування, дзвіночок). */
function SidebarUserMenu({ collapsed = false }) {
    const { me } = useSession();
    const initials = me?.initials || '?';
    const name = me?.name || '';

    return (
        <>
            {/* /profile — поки Blade-сторінка бекенду (поза SPA), тому звичайне посилання. */}
            <a
                href="/profile"
                className="group flex min-w-0 items-center rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Редагувати профіль користувача"
                title={name}
            >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                    {me?.avatar_url ? (
                        <img src={me.avatar_url} alt={initials} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        initials
                    )}
                </span>
                {!collapsed && (
                    <span className="mx-2 min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">{name}</span>
                )}
            </a>
            {!collapsed && (
                <div className="flex shrink-0 items-center gap-1">
                    <Link
                        to="/settings"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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
