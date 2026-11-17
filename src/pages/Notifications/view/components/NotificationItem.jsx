import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router';
import { useVM } from '../../../../shared/mvvm/viewModelHooks.js';
import { openUrl } from '../../../../shared/navigation/openUrl.js';
import {
    notificationBody,
    notificationCategory,
    notificationTitle,
    notificationUrl,
} from '../../../../lib/notificationTypes';

function NotificationItem({ notification: n, isLast }) {
    const vm = useVM();
    const navigate = useNavigate();

    const url = notificationUrl(n);
    const actor = n.payload?.actor;
    const category = notificationCategory(n);
    const isRead = Boolean(n.read_at);
    const body = notificationBody(n);
    const titleClass = isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100';

    const handleOpen = (e) => {
        e.preventDefault();
        vm.open(n).finally(() => openUrl(url, navigate));
    };

    return (
        <div
            className={`flex gap-3 border-l-4 px-4 py-3.5 ${category.borderClass} ${
                isLast ? '' : 'border-b border-slate-100 dark:border-slate-800'
            } ${isRead ? '' : 'bg-blue-50/50 dark:bg-slate-800'} hover:bg-slate-50 dark:hover:bg-slate-800`}
        >
            {actor?.avatar_url ? (
                <img
                    src={actor.avatar_url}
                    alt={actor.name || ''}
                    className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
            ) : (
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
                    <span className={`h-2 w-2 rounded-full ${category.dotClass}`} />
                </span>
            )}

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            {vm.typeLabel(n.type)}
                        </p>

                        {url ? (
                            <a
                                href={url}
                                className={`mt-0.5 block text-sm font-medium hover:underline ${titleClass}`}
                                onClick={handleOpen}
                            >
                                {notificationTitle(n)}
                            </a>
                        ) : (
                            <p className={`mt-0.5 text-sm font-medium ${titleClass}`}>{notificationTitle(n)}</p>
                        )}
                    </div>

                    {!isRead && (
                        <button
                            type="button"
                            className="shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            onClick={() => vm.markRead(n.id)}
                        >
                            Прочитано
                        </button>
                    )}
                </div>

                {body && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {body}
                    </p>
                )}

                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    {actor?.name ? `${actor.name} · ` : ''}{n.created_at}
                </p>
            </div>
        </div>
    );
}

export default observer(NotificationItem);
