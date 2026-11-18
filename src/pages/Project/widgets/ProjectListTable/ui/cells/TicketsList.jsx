import { avatarInitials } from "../../../../../../lib/avatarInitials.js";


// Порт TicketManager.renderCellTickets(): компактний чіп + попап з діями на hover.
// commands — команди ViewModel (useProjectRowCommands): легасі TicketManager, після дії він сам кличе getItems() → refetch.
const STATE = {
    [-1]: { dot: "Очікує", accent: "border-l-amber-400 dark:border-l-amber-300", chip: "bg-amber-50 dark:bg-amber-900/50", popup: "bg-amber-50 dark:bg-amber-900" },
    default: { accent: "border-l-gray-300 dark:border-l-gray-600", chip: "bg-white dark:bg-neutral-800", popup: "bg-white dark:bg-neutral-800" },
};

const Avatar = ({ user, size = "h-5 w-5 text-[10px]", className = "" }) =>
    user ? (
        <span
            className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 font-semibold text-gray-700 dark:bg-neutral-600 dark:text-gray-200 ${size} ${className}`}
            title={user.caption}
        >
            {avatarInitials(user.initials, user.caption)}
        </span>
    ) : null;

const TicketAction = ({ title, icon, onClick }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className="rounded-full bg-white p-1 text-xs transition-colors hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
    >
        <i className={`${icon} pointer-events-none`} />
    </button>
);

const TicketsList = ({ projectId, tickets, users, commands }) => {
    if (!Array.isArray(tickets) || tickets.length === 0) return null;
    const findUser = (id) => users.find((u) => u.id == id) ?? null;  

    return (
        <div className="mt-1">
            {tickets.map(({ id, stateId, text, createdUserId, resolvedUserId = null, isAttachment }) => {
                const style = stateId === -1 ? STATE[-1] : STATE.default;
                const createdUser = findUser(createdUserId);
                const resolvedUser = findUser(resolvedUserId);

                return (
                    <div key={id} className="group/ticket relative mb-1 last:mb-0">
                        <div
                            className={`flex max-w-[200px] cursor-default select-none items-center gap-1.5 rounded border border-l-[3px] border-gray-200 px-2 py-1 text-xs dark:border-neutral-600 ${style.chip} ${style.accent}`}
                        >
                            <Avatar user={createdUser} />
                            <span className="truncate leading-none text-gray-700 dark:text-gray-300">{text}</span>
                            {Boolean(isAttachment) && <i className="fa-solid fa-paperclip flex-shrink-0 text-[10px] text-gray-500" />}
                        </div>

                        <div
                            className={`pointer-events-none absolute left-full top-0 z-[200] w-64 rounded-lg border border-l-4 border-gray-200 p-2.5 text-xs opacity-0 shadow-xl transition-opacity duration-150 group-hover/ticket:pointer-events-auto group-hover/ticket:opacity-100 dark:border-neutral-600 ${style.popup} ${style.accent}`}
                        >
                            <div className="mb-2 flex items-start gap-2">
                                <div className="flex flex-shrink-0 flex-col items-center">
                                    <Avatar user={createdUser} size="h-6 w-6 text-[11px]" />
                                    <Avatar user={resolvedUser} size="h-6 w-6 text-[11px]" className="-mt-1 ring-2 ring-white dark:ring-neutral-900" />
                                </div>
                                <span className="break-words leading-snug text-gray-900 dark:text-gray-100">{text}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-500">ticket#{id}</span>
                                {commands.canAct && (
                                    <div className="flex gap-0.5">
                                        {stateId === -1 ? (
                                            <>
                                                <TicketAction title="Позначити реалізованим" icon="fa-solid fa-check text-gray-600" onClick={() => commands.onSetTicketState(id, 0)} />
                                                <TicketAction
                                                    title="Позначити реалізованим та корисним"
                                                    icon="fa-solid fa-check-double text-green-500"
                                                    onClick={() => commands.onSetTicketState(id, 1)}
                                                />
                                                <TicketAction title="Редагувати тікет" icon="fa-solid fa-pen text-blue-500" onClick={() => commands.onEditTicket(projectId, id)} />
                                                <TicketAction title="Видалити тікет" icon="fa-solid fa-trash text-red-500" onClick={() => commands.onDeleteTicket(id)} />
                                            </>
                                        ) : (
                                            <TicketAction
                                                title="Відмінити позначку"
                                                icon="fa-solid fa-arrow-rotate-left text-gray-600"
                                                onClick={() => commands.onSetTicketState(id, -1)}
                                            />
                                        )}
                                        {Boolean(isAttachment) && (
                                            <a
                                                href={`/api/ticket/${id}/attachment`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Переглянути вкладення"
                                                className="rounded-full bg-white p-1 text-xs hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                            >
                                                <i className="fa-solid fa-paperclip pointer-events-none text-gray-600" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TicketsList;
