/* eslint-disable react-refresh/only-export-components -- спільні стилі/хелпери рендеру задач (функції + дрібні компоненти) */
import {Tooltip} from "@material-tailwind/react";

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

// ---------------------------------------------------------------------------
// Portal UI kit — бейджі задач (макет «Portal — Login» › Welcome › «Мої задачі»):
// прямокутний тонований бейдж radius-sm, 12px medium, px-2 py-0.5.
//   Нова — primary-tint / primary-on-tint, В роботі — surface-muted / ink,
//   Виконано — green, Повернуто — red (danger), Закрито — обведений, приглушений.
// ---------------------------------------------------------------------------

export const BADGE = "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium leading-4";

const BADGE_TONE = {
    blue: "bg-blue-50 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300",
    gray: "bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-200",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    outline: "border border-gray-200 bg-white text-gray-600 dark:border-neutral-600 dark:bg-transparent dark:text-gray-400",
};

const STATUS_TONE = {
    "Нова": "blue",
    "В роботі": "gray",
    "Виконано": "green",
    "Повернуто": "red",
    "Закрито": "outline",
};

// Крапка стану (заголовки груп, пункти меню) — той самий тон, що й бейдж.
const STATUS_DOT = {
    "Нова": "bg-blue-500",
    "В роботі": "bg-gray-500",
    "Виконано": "bg-green-500",
    "Повернуто": "bg-red-500",
    "Закрито": "border border-gray-500 bg-transparent",
};

export const statusDotClassName = (status) =>
    `h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status] || "bg-gray-400 dark:bg-neutral-500"}`;

export const Badge = ({tone = "gray", className = "", children, ...rest}) => (
    <span className={`${BADGE} ${BADGE_TONE[tone] || BADGE_TONE.gray} ${className}`} {...rest}>
        {children}
    </span>
);

export const StatusBadge = ({status}) => {
    if (!status) return null;
    return <Badge tone={STATUS_TONE[status] || "gray"}>{status}</Badge>;
};

/** Сумісність зі старими викликами: бейдж стану або null. */
export const getStatusStyle = (status) => (status ? <StatusBadge status={status}/> : null);

// Пріоритет — кольорова іконка + підпис (без тонованої плашки: сигнальні кольори лише
// для іконки, текст лишається ink). Іконки не світліші за 3:1 на surface-card.
export const PRIORITY_ICON = {
    "Терміновий": {icon: "fa-solid fa-angles-up", color: "text-red-600 dark:text-red-400"},
    "Високий": {icon: "fa-solid fa-angle-up", color: "text-amber-600 dark:text-amber-400"},
    "Середній": {icon: "fa-solid fa-grip-lines", color: "text-cyan-700 dark:text-cyan-400"},
    "Низький": {icon: "fa-solid fa-angle-down", color: "text-indigo-500 dark:text-indigo-300"},
};

export const PriorityLabel = ({priority}) => {
    if (!priority) return null;
    const config = PRIORITY_ICON[priority];
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            {config && <i className={`${config.icon} ${config.color} w-3.5 text-center text-xs`} aria-hidden="true"></i>}
            {priority}
        </span>
    );
};

export const getPriorityStyle = (priority) => (priority ? <PriorityLabel priority={priority}/> : null);

const TYPE_ICON = {
    "Баг": {icon: "fa-solid fa-bug", color: "text-red-600 dark:text-red-400"},
    "Новий функціонал": {icon: "fa-solid fa-wrench", color: "text-blue-600 dark:text-blue-400"},
    "Впровадження": {icon: "fa-solid fa-lightbulb-on", color: "text-amber-600 dark:text-amber-400"},
    "Беклог": {icon: "fa-solid fa-timeline", color: "text-cyan-700 dark:text-cyan-400"},
};

/** Іконка типу задачі в квадратній плашці surface-muted (назва — у тултіпі). */
export const getTypeStyle = (type = "") => {
    const config = TYPE_ICON[type] || {icon: "fa-solid fa-check", color: "text-gray-600 dark:text-gray-400"};
    return (
        <Tooltip content={type || "Без типу"}>
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-neutral-700"
                  aria-label={type || "Без типу"}>
                <i className={`${config.icon} ${config.color} text-[10px]`} aria-hidden="true"></i>
            </span>
        </Tooltip>
    );
};

const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/);
    const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
    return initials || "?";
};

// Аватар без фото — нейтральні ініціали (як у макеті: gray-200 / ink), не кольорові.
const AVATAR = "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold dark:border-neutral-800";

// Стек круглих аватарок (учасники задачі): фото користувача, якщо
// завантажене, інакше ініціали
export const UserAvatars = ({users = [], max = 4}) => {
    if (!users.length) return null;
    const visible = users.slice(0, max);
    const rest = users.length - visible.length;
    return (
        <div className="flex items-center -space-x-1.5">
            {visible.map(user => (
                <Tooltip key={user.id} content={user.name}>
                    {/* Фото поверх ініціалів: якщо файл не віддається — лишаються ініціали (як у сайдбарі). */}
                    <div className={`${AVATAR} relative overflow-hidden bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-gray-200`}>
                        {getInitials(user.name)}
                        {user.avatar &&
                            <img key={user.avatar} src={`/files?path=${user.avatar}`} alt={user.name}
                                 onError={(e) => (e.currentTarget.hidden = true)}
                                 className="absolute inset-0 h-full w-full rounded-full object-cover"/>
                        }
                    </div>
                </Tooltip>
            ))}
            {rest > 0 &&
                <div className={`${AVATAR} bg-gray-100 text-gray-600 dark:bg-neutral-600 dark:text-gray-200`}>
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
// тонований фон + крапка + опційний хрестик видалення.
// (Inline-колір — виняток із правила «без hex»: колір тега задає користувач у БД.)
export const TagPill = ({tag, onRemove}) => {
    const color = isHexColor(tag.color) ? tag.color : tagPalette[tag.id % tagPalette.length];
    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-4"
              style={{backgroundColor: `${color}1f`, color: color, border: `1px solid ${color}40`}}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{backgroundColor: color}}/>
            {tag.name}
            {Boolean(onRemove) &&
                <button type="button" onClick={onRemove} title="Зняти тег" aria-label={`Зняти тег ${tag.name}`}
                        className="ml-0.5 opacity-60 transition hover:opacity-100">
                    <i className="fa-solid fa-xmark text-[9px]"></i>
                </button>
            }
        </span>
    );
};

/** Пілюля людини (учасник): нейтральна surface-muted + опційний хрестик. */
export const PersonPill = ({name, onRemove}) => (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium leading-4 text-gray-700 dark:bg-neutral-700 dark:text-gray-200">
        {name}
        {Boolean(onRemove) &&
            <button type="button" onClick={onRemove} title="Прибрати учасника" aria-label={`Прибрати ${name}`}
                    className="ml-0.5 text-gray-500 transition hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                <i className="fa-solid fa-xmark text-[9px]"></i>
            </button>
        }
    </span>
);

// Поле вводу kit (surface-field + border-input, фокус primary) — для сирих textarea/input сторінки.
export const FIELD =
    "w-full rounded-md border border-gray-200 bg-white text-gray-800 placeholder:text-gray-500 transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200 dark:placeholder:text-gray-400 dark:hover:border-neutral-500 dark:focus:border-blue-400";

// Підпис розділу в картці/модалці (caption, uppercase) — ink-muted.
export const SECTION_LABEL = "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400";

// Сегментований перемикач (макет: «Період», «Фільтр задач»): контейнер surface-muted,
// активний сегмент — primary.
export const SEGMENTED = "flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-neutral-700 dark:bg-neutral-900";
export const segmentClassName = (active) =>
    `inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium transition ${active
        ? "bg-blue-600 text-white"
        : "text-gray-600 hover:bg-white hover:text-gray-800 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-200"}`;
