import {useEffect, useMemo, useState} from "react";
import { Chip, Menu, MenuHandler, MenuItem, MenuList, Spinner, Tooltip } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import {differenceInCalendarDays, format, isPast, isToday} from "date-fns";
import {uk} from "date-fns/locale";
import {allowedStatusIds, TagPill, UserAvatars} from "../utils.jsx";
import {canDeleteRow, canRestore, canUpdateRow} from "../utils.js";

// Компактна іконка пріоритету (без тексту — назва в тултіпі)
const priorityIconMap = {
    "Терміновий": {icon: "fa-solid fa-angles-up", color: "text-red-500"},
    "Високий": {icon: "fa-solid fa-angle-up", color: "text-amber-500"},
    "Середній": {icon: "fa-solid fa-grip-lines", color: "text-cyan-600"},
    "Низький": {icon: "fa-solid fa-angle-down", color: "text-indigo-400"},
};

const statusDotColorMap = {
    "Нова": "bg-cyan-400",
    "В роботі": "bg-blue-500",
    "Виконано": "bg-green-500",
    "Повернуто": "bg-red-500",
    "Закрито": "bg-gray-400",
};

// Групи цих статусів згорнуті за замовчуванням — фокус на активній роботі
const COLLAPSED_BY_DEFAULT = ["Виконано", "Закрито"];

const UNGROUPED_KEY = "__all__";
// Видалені задачі завжди виносяться в окрему групу (незалежно від groupBy)
// — ключ фіксований, а не "<groupBy>:<назва>", щоб згорнутий стан не
// скидався при перемиканні групування
const DELETED_GROUP_KEY = "__deleted__";

const PriorityIcon = ({caption}) => {
    const config = priorityIconMap[caption];
    if (!config) return <span className="w-4"/>;
    return (
        <Tooltip content={caption}>
            <i className={`${config.icon} ${config.color} w-4 text-center text-xs`}></i>
        </Tooltip>
    );
};

const StatusDot = ({status}) => (
    <Tooltip content={status || "Без стану"}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotColorMap[status] || "bg-gray-300"}`}/>
    </Tooltip>
);

// Скільки днів задача вже незакрита (від дати створення) — щоб помітити
// задачі, що зависли. Для закритих — показуємо тьмяно, без акценту.
const AgeBadge = ({createdAt, statusName}) => {
    if (!createdAt) return null;
    const days = differenceInCalendarDays(new Date(), new Date(createdAt));
    const isClosed = statusName === "Закрито";
    const isStale = !isClosed && days >= 7;
    return (
        <Tooltip content={isClosed ? `Була відкрита ${days} дн.` : `Не закрита вже ${days} дн.`}>
            <span className={`hidden shrink-0 items-center gap-1 whitespace-nowrap text-[11px] md:inline-flex ${isStale
                ? "font-semibold text-amber-500"
                : "text-gray-600 dark:text-gray-500"}`}>
                <i className="fa-regular fa-hourglass-half"></i>{days}д
            </span>
        </Tooltip>
    );
};

const DueDate = ({dueDate, deleted}) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const overdue = !deleted && isPast(date) && !isToday(date);
    return (
        <span className={`shrink-0 whitespace-nowrap text-[11px] ${overdue
            ? "font-semibold text-red-500"
            : "text-gray-600 dark:text-gray-400"}`}>
            {overdue && <i className="fa-regular fa-alarm-exclamation mr-1"></i>}
            {format(date, "d MMM", {locale: uk})}
        </span>
    );
};

// Сучасне подання списку задач (Linear-style): групування зі згортанням,
// рядок однією лінією (пріоритет / #id / назва / теги / термін / учасники),
// дії при ховері. Заміна спредшит-таблиці на /task (стара Table збережена
// за прапорцем USE_LEGACY_TABLE у TaskPage).
const TaskList = ({
                      tasks = [],
                      loading = false,
                      groupBy = "status",
                      statuses = [],
                      priorities = [],
                      selectedId,
                      onSelect,
                      onDelete,
                      onRestore,
                      onChangeStatus,
                      onMergeRequest,
                      onToggleFavorite,
                      onCloneRequest,
                      auth,
                  }) => {
    // Злиття перетягуванням: рядок, над яким зараз тримають перетягувану
    // задачу (підсвітка цілі скидання)
    const [dragOverId, setDragOverId] = useState(null);

    // Згорнуті групи: ключі виду "<groupBy>:<назва групи>", персистяться
    const [collapsed, setCollapsed] = useState(() => {
        try {
            const stored = localStorage.getItem(`${location.pathname}-collapsed-groups`);
            const parsed = stored ? JSON.parse(stored) : null;
            return Array.isArray(parsed)
                ? parsed
                : [...COLLAPSED_BY_DEFAULT.map(name => `status:${name}`), DELETED_GROUP_KEY];
        } catch {
            return [...COLLAPSED_BY_DEFAULT.map(name => `status:${name}`), DELETED_GROUP_KEY];
        }
    });

    useEffect(() => {
        localStorage.setItem(`${location.pathname}-collapsed-groups`, JSON.stringify(collapsed));
    }, [collapsed]);

    const toggleGroup = (key) => {
        setCollapsed(prev => prev.includes(key)
            ? prev.filter(item => item !== key)
            : [...prev, key]);
    };

    // Групування завантажених задач; порядок груп — за словником
    // (статуси/пріоритети) або за алфавітом (проєкти). Видалені задачі не
    // потрапляють у звичайне групування — вони завжди йдуть окремою групою
    // в кінці (незалежно від groupBy), щоб не змішуватись із діючими.
    const groups = useMemo(() => {
        const activeTasks = tasks.filter(task => !task.deleted_at);
        const deletedTasks = tasks.filter(task => task.deleted_at);

        let activeGroups;
        if (groupBy === "none") {
            activeGroups = activeTasks.length ? [{name: UNGROUPED_KEY, tasks: activeTasks}] : [];
        } else {
            const byName = new Map();
            activeTasks.forEach(task => {
                const name = groupBy === "project"
                    ? (task.project || "Без проєкту")
                    : groupBy === "priority"
                        ? (task.priority || "Без пріоритету")
                        : (task.status || "Без стану");
                if (!byName.has(name)) byName.set(name, []);
                byName.get(name).push(task);
            });

            let orderedNames;
            if (groupBy === "status") {
                orderedNames = statuses.map(s => s.name).filter(name => byName.has(name));
            } else if (groupBy === "priority") {
                orderedNames = priorities.map(p => p.caption).filter(name => byName.has(name));
            } else {
                orderedNames = [...byName.keys()].sort((a, b) => a.localeCompare(b, 'uk'));
            }
            // Групи поза словником (напр. "Без стану") — в кінець
            [...byName.keys()].forEach(name => {
                if (!orderedNames.includes(name)) orderedNames.push(name);
            });

            activeGroups = orderedNames.map(name => ({name, tasks: byName.get(name)}));
        }

        if (deletedTasks.length > 0) {
            activeGroups = [...activeGroups, {name: "Видалено", key: DELETED_GROUP_KEY, tasks: deletedTasks}];
        }

        return activeGroups;
    }, [tasks, groupBy, statuses, priorities]);

    if (loading && !tasks.length) {
        return (
            <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-neutral-700 dark:bg-neutral-800">
                <Spinner className="h-8 w-8"/>
            </div>
        );
    }

    if (!tasks.length) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white py-16 text-gray-600 dark:border-neutral-700 dark:bg-neutral-800">
                <i className="fa-regular fa-clipboard-check text-2xl"></i>
                <span className="text-sm">Задач не знайдено</span>
            </div>
        );
    }

    return (
        <div data-i-doc="view:task-list" className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
            {groups.map(group => {
                const isDeletedGroup = group.key === DELETED_GROUP_KEY;
                const groupKey = group.key || `${groupBy}:${group.name}`;
                const isCollapsed = group.name !== UNGROUPED_KEY && collapsed.includes(groupKey);
                return (
                    <div key={groupKey}>
                        {group.name !== UNGROUPED_KEY &&
                            <button type="button"
                                    onClick={() => toggleGroup(groupKey)}
                                    className="flex w-full items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-1.5 text-left transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-700/60 dark:hover:bg-neutral-700">
                                <i className={`fa-solid fa-chevron-right text-[9px] text-gray-500 transition-transform ${isCollapsed ? "" : "rotate-90"}`}></i>
                                {isDeletedGroup && <i className="fa-regular fa-trash-can w-2 text-center text-[10px] text-gray-500"></i>}
                                {!isDeletedGroup && groupBy === "status" && <StatusDot status={group.name}/>}
                                {!isDeletedGroup && groupBy === "priority" && <PriorityIcon caption={group.name}/>}
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{group.name}</span>
                                <span className="text-[11px] text-gray-600">{group.tasks.length}</span>
                            </button>
                        }
                        {!isCollapsed && group.tasks.map(task => {
                            const isSelected = task.id === selectedId;
                            const isDeleted = Boolean(task.deleted_at);
                            return (
                                <div key={task.id}
                                     onClick={() => onSelect(task.id)}
                                     draggable={!isDeleted && Boolean(onMergeRequest)}
                                     onDragStart={(e) => {
                                         e.dataTransfer.setData('text/plain', String(task.id));
                                         e.dataTransfer.effectAllowed = 'move';
                                     }}
                                     onDragOver={(e) => {
                                         if (isDeleted || !onMergeRequest) return;
                                         e.preventDefault();
                                         e.dataTransfer.dropEffect = 'move';
                                     }}
                                     onDragEnter={(e) => {
                                         if (isDeleted || !onMergeRequest) return;
                                         e.preventDefault();
                                         setDragOverId(task.id);
                                     }}
                                     onDragLeave={() => setDragOverId(prev => prev === task.id ? null : prev)}
                                     onDrop={(e) => {
                                         if (isDeleted || !onMergeRequest) return;
                                         e.preventDefault();
                                         e.stopPropagation();
                                         setDragOverId(null);
                                         const donorId = Number(e.dataTransfer.getData('text/plain'));
                                         if (!donorId || donorId === task.id) return;
                                         onMergeRequest(donorId, task.id);
                                     }}
                                     title={onMergeRequest && !isDeleted ? "Перетягніть на іншу задачу, щоб злити" : undefined}
                                     className={`group flex cursor-pointer items-center gap-2.5 border-b border-gray-100 px-3 py-2 transition dark:border-neutral-700 ${isSelected
                                         ? "bg-blue-50 dark:bg-blue-900/25"
                                         : "hover:bg-gray-50 dark:hover:bg-neutral-700/50"} ${isDeleted ? "opacity-60" : ""} ${dragOverId === task.id ? "ring-2 ring-inset ring-blue-400" : ""}`}>
                                    {Boolean(onToggleFavorite) &&
                                        <button type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleFavorite(task.id);
                                                }}
                                                title={task.isFavorite ? "Прибрати з обраного" : "Додати в обране"}
                                                className={`shrink-0 transition ${task.isFavorite
                                                    ? "text-amber-400"
                                                    : "text-gray-300 opacity-0 hover:text-amber-400 group-hover:opacity-100 dark:text-gray-600"}`}>
                                            <i className={`${task.isFavorite ? "fa-solid" : "fa-regular"} fa-star text-xs`}></i>
                                        </button>
                                    }
                                    <PriorityIcon caption={task.priority}/>
                                    {groupBy !== "status" && <StatusDot status={task.status}/>}
                                    <span className="shrink-0 font-mono text-[11px] text-gray-600">#{task.id}</span>
                                    {task.project &&
                                        <Tooltip content={`Проєкт: ${task.project}`}>
                                            <span className="hidden shrink-0 max-w-[8rem] items-center gap-1 truncate text-[11px] text-gray-600 dark:text-gray-500 sm:inline-flex">
                                                <i className="fa-regular fa-folder"></i>
                                                <span className="truncate">{task.project}</span>
                                            </span>
                                        </Tooltip>
                                    }
                                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-200">
                                        {task.title}
                                    </span>
                                    {isDeleted &&
                                        <Chip size="sm" color="blue" variant="ghost" className="shrink-0 py-0.5 text-[9px]" value="Видалено"/>
                                    }
                                    {task.tags?.length > 0 &&
                                        <span className="hidden shrink-0 items-center gap-1 lg:flex">
                                            {task.tags.slice(0, 3).map(tag => (
                                                <TagPill key={tag.id} tag={tag}/>
                                            ))}
                                            {task.tags.length > 3 &&
                                                <span className="text-[10px] text-gray-600">+{task.tags.length - 3}</span>
                                            }
                                        </span>
                                    }
                                    {task.linkedProjectsCount > 0 &&
                                        <Tooltip content={`Проєктів у наборі: ${task.linkedProjectsCount}`}>
                                            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-gray-600 dark:text-gray-500">
                                                <i className="fa-regular fa-folder-tree"></i>{task.linkedProjectsCount}
                                            </span>
                                        </Tooltip>
                                    }
                                    {task.commentsCount > 0 &&
                                        <Tooltip content={`Коментарів: ${task.commentsCount}`}>
                                            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-gray-600 dark:text-gray-500">
                                                <i className="fa-regular fa-message"></i>{task.commentsCount}
                                            </span>
                                        </Tooltip>
                                    }
                                    {task.attachmentsCount > 0 &&
                                        <Tooltip content={`Вкладень: ${task.attachmentsCount}`}>
                                            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-gray-600 dark:text-gray-500">
                                                <i className="fa-regular fa-paperclip"></i>{task.attachmentsCount}
                                            </span>
                                        </Tooltip>
                                    }
                                    {task.createdUser &&
                                        <Tooltip content={`Автор: ${task.createdUser}`}>
                                            <span className="hidden shrink-0 text-[10px] text-gray-600 dark:text-gray-500 xl:inline">
                                                {task.createdUser}
                                            </span>
                                        </Tooltip>
                                    }
                                    <AgeBadge createdAt={task.created_at} statusName={task.status}/>
                                    <DueDate dueDate={task.dueDate} deleted={isDeleted}/>
                                    <span className="w-20 shrink-0">
                                        <UserAvatars users={task.assignedUsers || []} max={3}/>
                                    </span>
                                    {/* Дії — з'являються при ховері */}
                                    <span className="flex shrink-0 justify-end opacity-0 transition group-hover:opacity-100">
                                        {Boolean(onChangeStatus) && canUpdateRow({original: task}, auth)
                                            && allowedStatusIds(task, auth).length > 0 &&
                                            <Menu placement="bottom-end">
                                                <MenuHandler>
                                                    <Button size="sm" variant="text" color="blue-gray" className="px-2 py-1"
                                                            title="Змінити стан"
                                                            onClick={(e) => e.stopPropagation()}>
                                                        <i className="fa-regular fa-circle-half-stroke"></i>
                                                    </Button>
                                                </MenuHandler>
                                                <MenuList className="min-w-[9rem] p-1 dark:border-neutral-700 dark:bg-neutral-700">
                                                    {/* Лише переходи, дозволені життєвим циклом для цього користувача */}
                                                    {statuses
                                                        .filter(status => allowedStatusIds(task, auth).includes(status.id))
                                                        .map(status => (
                                                            <MenuItem key={status.id}
                                                                      onClick={(e) => {
                                                                          e.stopPropagation();
                                                                          onChangeStatus(task.id, status.id);
                                                                      }}
                                                                      className="text-xs dark:text-gray-300 dark:hover:bg-neutral-600 dark:hover:text-gray-100 dark:focus:bg-neutral-600">
                                                                <span className="flex items-center gap-2">
                                                                    <StatusDot status={status.name}/>{status.name}
                                                                </span>
                                                            </MenuItem>
                                                        ))}
                                                </MenuList>
                                            </Menu>
                                        }
                                        {Boolean(onCloneRequest) &&
                                            <Tooltip content="Створити нову задачу на основі цієї">
                                                <Button size="sm" variant="text" color="blue-gray" className="px-2 py-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCloneRequest(task.id);
                                                        }}>
                                                    <i className="fa-regular fa-clone"></i>
                                                </Button>
                                            </Tooltip>
                                        }
                                        {canDeleteRow({original: task}, auth) &&
                                            <Tooltip content="Видалити (можна відновити)">
                                                <Button size="sm" variant="text" color="red" className="px-2 py-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(task.id);
                                                        }}>
                                                    <i className="fa-regular fa-trash-can"></i>
                                                </Button>
                                            </Tooltip>
                                        }
                                        {canRestore({original: task}, auth) &&
                                            <Tooltip content="Відновити">
                                                <Button size="sm" variant="text" color="blue" className="px-2 py-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRestore(task.id);
                                                        }}>
                                                    <i className="fa-solid fa-trash-arrow-up"></i>
                                                </Button>
                                            </Tooltip>
                                        }
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default TaskList;
