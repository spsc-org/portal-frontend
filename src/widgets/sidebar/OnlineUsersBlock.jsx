import { observer } from 'mobx-react-lite';
import { useViewModel } from '../../shared/mvvm/useViewModel.js';
import { OnlineUsersViewModel } from './OnlineUsersViewModel.js';
import { avatarInitials } from '../../lib/avatarInitials.js';

const AVATAR =
    'flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-[11px] font-bold leading-none text-gray-800 dark:bg-neutral-700 dark:text-white';

function StatusDot({ active, className = 'h-2 w-2' }) {
    return (
        <span
            className={`shrink-0 rounded-full ${className} ${active ? 'bg-green-500' : 'bg-amber-500'}`}
            title={active ? 'Активний' : 'Неактивний'}
        />
    );
}

function UserRow({ user }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className={AVATAR} title={user.name}>
                {avatarInitials(user.initials, user.name)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] leading-[18px] text-gray-800 dark:text-gray-300">{user.name}</span>
                {user.current_page && (
                    <span className="truncate text-xs text-gray-600 dark:text-gray-400">{user.current_page}</span>
                )}
            </div>
            <StatusDot active={Boolean(user.isActive)} />
        </div>
    );
}

/** Згорнутий сайдбар: стопка аватарів + лічильник (дизайн "Sidebar — згорнутий"). */
const CollapsedOnline = observer(function CollapsedOnline({ vm, ui }) {
    if (vm.total === 0) return null;
    const users = vm.displayedUsers.slice(0, 3);
    const names = vm.displayedUsers.map((user) => user.name).join(', ');

    return (
        <div
            role="group"
            aria-label={`${ui.onlineUsers}: ${vm.total}`}
            title={`${ui.onlineUsers}: ${names}`}
            className="flex flex-col items-center"
        >
            <span className="mx-auto mb-3 h-px w-8 bg-gray-200 dark:bg-neutral-700" />
            {users.map((user, index) => (
                <span
                    key={user.id}
                    className={`${AVATAR} border-2 border-white text-[10px] dark:border-neutral-900 ${index > 0 ? '-mt-2' : ''}`}
                >
                    {avatarInitials(user.initials, user.name)}
                </span>
            ))}
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {vm.total}
            </span>
        </div>
    );
});

/** VM живе весь час, поки змонтований сайдбар (ping не зупиняється при згортанні). */
function OnlineUsersBlock({ sidebarOpen, expanded, onToggleExpanded, ui }) {
    const vm = useViewModel((deps) => new OnlineUsersViewModel(deps));

    if (!sidebarOpen) return <CollapsedOnline vm={vm} ui={ui} />;

    return (
        <section className="flex shrink-0 flex-col gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
            <button
                type="button"
                onClick={onToggleExpanded}
                className="flex w-full items-center justify-between gap-2 text-left"
                title={expanded ? ui.collapse : ui.expand}
                aria-expanded={expanded}
            >
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-300">{ui.onlineUsers}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {vm.total}
                    <i
                        className={`fa-solid fa-chevron-down ml-1 text-[10px] text-gray-500 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
                        aria-hidden="true"
                    />
                </span>
            </button>

            {expanded && vm.displayedUsers.length > 0 && (
                <div className="flex flex-col gap-2.5">
                    {vm.displayedUsers.map((user) => (
                        <UserRow key={user.id} user={user} />
                    ))}
                </div>
            )}

            {expanded && vm.canToggleShowAll && (
                <button
                    type="button"
                    onClick={vm.toggleShowAll}
                    className="w-fit text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
                >
                    {vm.showAll ? 'Приховати' : 'Показати всіх'}
                </button>
            )}
        </section>
    );
}

export default observer(OnlineUsersBlock);
