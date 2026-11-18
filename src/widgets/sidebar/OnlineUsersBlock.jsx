import { observer } from 'mobx-react-lite';
import { useViewModel } from '../../shared/mvvm/useViewModel.js';
import { OnlineUsersViewModel } from './OnlineUsersViewModel.js';
import { avatarInitials } from '../../lib/avatarInitials.js';

function UserRow({ user }) {
    const active = Boolean(user.isActive);

    return (
        <div className="flex items-center gap-2.5 rounded-lg border border-gray-200/80 bg-white/85 px-2 py-1.5 text-xs shadow-sm transition hover:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800/45">
            <div className="relative h-7 w-7 shrink-0">
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-neutral-600" title={user.name}>
                    <span className="text-[10px] font-semibold leading-none text-gray-700 dark:text-gray-100">
                        {avatarInitials(user.initials, user.name)}
                    </span>
                </div>
                <span
                    className={`absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-white dark:border-neutral-800 ${
                        active ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                />
            </div>
            <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{user.name}</div>
                <div className="truncate text-[11px] text-gray-600 dark:text-gray-400">{user.current_page}</div>
            </div>
            <span
                className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                }`}
            >
                {active ? 'Активний' : 'Неактивний'}
            </span>
        </div>
    );
}

/** VM живе весь час, поки змонтований сайдбар (ping не зупиняється при згортанні). */
function OnlineUsersBlock({ sidebarOpen, expanded, onToggleExpanded, ui }) {
    const vm = useViewModel((deps) => new OnlineUsersViewModel(deps));

    if (!sidebarOpen) return null;

    return (
        <div>
            <button
                type="button"
                onClick={onToggleExpanded}
                className="group flex w-full items-center justify-between gap-2 rounded-md px-0.5 py-0.5 text-left transition hover:bg-gray-100/80 dark:hover:bg-neutral-700/70"
                title={expanded ? ui.collapse : ui.expand}
                aria-expanded={expanded}
            >
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    {ui.onlineUsers}
                </h2>
                <i className={`fa-solid fa-chevron-down text-[10px] text-gray-500 transition-transform duration-200 dark:text-gray-500 ${expanded ? '' : 'rotate-180'}`} />
            </button>

            {expanded && (
                <div className="mt-2">
                    <div className="mb-2 inline-flex items-center rounded-md border border-gray-300/70 bg-white/80 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-gray-300">
                        Онлайн: {vm.total}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {vm.displayedUsers.map((user) => (
                            <UserRow key={user.id} user={user} />
                        ))}
                    </div>
                    {vm.canToggleShowAll && (
                        <button
                            type="button"
                            onClick={vm.toggleShowAll}
                            className="mt-2 inline-flex w-fit items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:border-neutral-700 dark:bg-neutral-700 dark:text-blue-300 dark:hover:bg-neutral-600"
                        >
                            {vm.showAll ? 'Приховати' : 'Показати всіх'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default observer(OnlineUsersBlock);
