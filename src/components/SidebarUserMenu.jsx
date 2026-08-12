import { useMe } from '../hooks/useMe';
import NotificationBell from './NotificationBell';

/**
 * Блок "Мій користувач" у сайдбарі (аватар, імʼя, налаштування, дзвіночок).
 * fallback* — SSR з boot до відповіді /api/me (без миготіння).
 * collapsed — лише аватар (+ дзвіночок ховається разом з підписами).
 */
export default function SidebarUserMenu({
    profileUrl,
    settingsUrl,
    fallbackInitials,
    fallbackName,
    collapsed = false,
}) {
    const { data } = useMe();
    const avatarUrl = data?.avatar_url ?? null;
    const initials = data?.initials || fallbackInitials || '?';
    const name = data?.name || fallbackName || '';

    return (
        <>
            <a
                href={profileUrl}
                className="group flex min-w-0 items-center rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Редагувати профіль користувача"
                title={name}
            >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={initials} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        initials
                    )}
                </span>
                {!collapsed && (
                    <span className="mx-2 min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">
                        {name}
                    </span>
                )}
            </a>
            {!collapsed && (
                <div className="flex shrink-0 items-center gap-1">
                    <a
                        href={settingsUrl}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Налаштування"
                        aria-label="Налаштування"
                    >
                        <i className="fa-solid fa-gear text-sm" />
                    </a>
                    <NotificationBell />
                </div>
            )}
        </>
    );
}
