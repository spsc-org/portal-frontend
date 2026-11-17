/* eslint-disable react-refresh/only-export-components -- спільні стилі/хелпери рендеру задач (функції + дрібні компоненти) */
import {Chip, Tooltip} from "@material-tailwind/react";

const statusColorMap = {
    "Нова": "cyan",
    "В роботі": "blue",
    "Виконано": "green",
    "Повернуто": "red",
    "Закрито": "gray",
};

// Життєвий цикл задачі — дзеркало бекенду
// (App\Services\TaskManager\TaskLifecycle + App\Enums\TaskManager\TaskState).
// ТРИМАТИ СИНХРОННИМ з PHP-стороною!
export const TASK_STATE = {NOVA: 1, IN_PROGRESS: 2, DONE: 3, RETURNED: 5, CLOSED: 6};

const participantTransitions = {
    [TASK_STATE.NOVA]: [TASK_STATE.IN_PROGRESS],
    [TASK_STATE.IN_PROGRESS]: [TASK_STATE.DONE],
    [TASK_STATE.DONE]: [],                          // приймання — рішення власника
    [TASK_STATE.RETURNED]: [TASK_STATE.IN_PROGRESS],
    [TASK_STATE.CLOSED]: [],                        // реопен — право власника
};

// Дозволені цілі переходу стану для поточного користувача.
// task має містити statusId, createdUserId і assignedUsers/assigned_users.
export const allowedStatusIds = (task, auth) => {
    if (!task || task.deleted_at) return [];
    const permission = auth?.user?.permissions?.pages?.task?.update;
    const userId = auth?.user?.id;
    const isOwnerLike = permission === true || (permission && task.createdUserId === userId);
    if (isOwnerLike) {
        return Object.values(TASK_STATE).filter(id => id !== task.statusId);
    }
    if (permission !== 'individual') return [];
    const participants = task.assignedUsers || task.assigned_users || [];
    if (!participants.some(user => user.id === userId)) return [];
    return participantTransitions[task.statusId] || [];
};

const priorityColorMap = {
    "Низький": "indigo",
    "Середній": "cyan",
    "Високий": "amber",
    "Терміновий": "red",
};


const typeColorMap = {
    "Баг": "red",
    "Новий функціонал": "blue",
    "Впровадження": "amber",
    "Беклог": "cyan",
};

const typeIconMap = {
    "Баг": <i className="fa-solid fa-bug"></i>,
    "Новий функціонал": <i className="fa-solid fa-wrench"></i>,
    "Впровадження": <i className="fa-solid fa-lightbulb-on"></i>,
    "Беклог": <i className="fa-solid fa-timeline"></i>,
}


export const getStatusStyle = (status) => {
    if (!status) return null;
    const color = statusColorMap[status];
    return (
        <Chip
            size="sm"
            value={status}
            color={color}
            variant="ghost"
            className="w-fit dark:text-neutral-200"
        />
    );
};

export const getPriorityStyle = (priority) => {
    if (!priority) return null;
    const color = priorityColorMap[priority];
    return (
        <Chip
            size="sm"
            value={priority}
            color={color}
            variant="ghost"
            className="w-fit dark:text-neutral-200"
        />
    );
};

const avatarColors = [
    "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-cyan-600", "bg-orange-500", "bg-teal-500",
];

const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/);
    const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
    return initials || "?";
};

// Стек круглих аватарок (учасники задачі): фото користувача, якщо
// завантажене, інакше ініціали з детермінованим кольором від id
export const UserAvatars = ({users = [], max = 4}) => {
    if (!users.length) return null;
    const visible = users.slice(0, max);
    const rest = users.length - visible.length;
    return (
        <div className="flex items-center -space-x-1.5">
            {visible.map(user => (
                <Tooltip key={user.id} content={user.name}>
                    {user.avatar ? (
                        <img src={`/files?path=${user.avatar}`} alt={user.name}
                             className="h-6 w-6 shrink-0 rounded-full border-2 border-white object-cover dark:border-gray-900"/>
                    ) : (
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white dark:border-gray-900 ${avatarColors[user.id % avatarColors.length]}`}>
                            {getInitials(user.name)}
                        </div>
                    )}
                </Tooltip>
            ))}
            {rest > 0 &&
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-400 text-[9px] font-bold text-white dark:border-gray-900">
                    +{rest}
                </div>
            }
        </div>
    );
};

const tagPalette = [
    "#3b82f6", "#10b981", "#f59e0b", "#f43f5e",
    "#8b5cf6", "#0891b2", "#f97316", "#14b8a6",
];

const isHexColor = (value) => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

// Пілюля тега: колір з БД (tag.color) або детермінований від id;
// тонований фон + крапка + опційний хрестик видалення
export const TagPill = ({tag, onRemove}) => {
    const color = isHexColor(tag.color) ? tag.color : tagPalette[tag.id % tagPalette.length];
    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium leading-4"
              style={{backgroundColor: `${color}1f`, color: color, border: `1px solid ${color}40`}}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{backgroundColor: color}}/>
            {tag.name}
            {Boolean(onRemove) &&
                <button type="button" onClick={onRemove} title="Зняти тег"
                        className="ml-0.5 opacity-50 transition hover:opacity-100">
                    <i className="fa-solid fa-xmark text-[9px]"></i>
                </button>
            }
        </span>
    );
};

export const getTypeStyle = (type = "") => {
    const color = typeColorMap[type];
    return (
        <Tooltip content={type}>
            <Chip
                title={type}
                size="sm"
                value={typeIconMap[type] || <i className="fa-solid fa-check"></i>}
                color={color || "blue"}
                variant="ghost"
                className="w-fit dark:text-neutral-200"
            />
        </Tooltip>
    );
};


