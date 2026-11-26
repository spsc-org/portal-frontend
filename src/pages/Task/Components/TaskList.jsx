import {useEffect, useMemo, useState} from "react";
import { Menu, MenuHandler, MenuItem, MenuList, Spinner, Tooltip } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import {differenceInCalendarDays, format, isPast, isToday} from "date-fns";
import {uk} from "date-fns/locale";
import {allowedStatusIds, Badge, PRIORITY_ICON, StatusBadge, statusDotClassName, TagPill, UserAvatars} from "../utils.jsx";
import {canDeleteRow, canRestore, canUpdateRow} from "../utils.js";

// Групи цих статусів згорнуті за замовчуванням — фокус на активній роботі
const COLLAPSED_BY_DEFAULT = ["Виконано", "Закрито"];

const UNGROUPED_KEY = "__all__";
// Видалені задачі завжди виносяться в окрему групу (незалежно від groupBy)
// — ключ фіксований, а не "<groupBy>:<назва>", щоб згорнутий стан не
// скидався при перемиканні групування
const DELETED_GROUP_KEY = "__deleted__";

// Portal UI kit — картка списку (як «Мої задачі» у макеті Welcome / таблиця /project):
// surface-card + border-default, radius-xl, рядки з межею border-default.
const CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800";
const META = "inline-flex shrink-0 items-center gap-1 text-xs text-gray-600 dark:text-gray-400";
const ROW_ACTION = "text-gray-600 dark:text-gray-400";

// Компактна іконка пріоритету (без тексту — назва в тултіпі)
const PriorityIcon = ({caption}) => {
    const config = PRIORITY_ICON[caption];
    if (!config) return <span className="w-4 shrink-0"/>;
    return (
        <Tooltip content={`Пріоритет: ${caption}`}>
            <i className={`${config.icon} ${config.color} w-4 shrink-0 text-center text-xs`} aria-label={caption}></i>
        </Tooltip>
    );
};

const StatusDot = ({status}) => <span className={statusDotClassName(status)} aria-hidden="true"/>;

// Скільки днів задача вже незакрита (від дати створення) — щоб помітити
// задачі, що зависли. Для закритих — показуємо тьмяно, без акценту.
const AgeBadge = ({createdAt, statusName}) => {
    if (!createdAt) return null;
    const days = differenceInCalendarDays(new Date(), new Date(createdAt));
    const isClosed = statusName === "Закрито";
    const isStale = !isClosed && days >= 7;
    return (
        <Tooltip content={isClosed ? `Була відкрита ${days} дн.` : `Не закрита вже ${days} дн.`}>
            <span className={`hidden shrink-0 items-center gap-1 whitespace-nowrap text-xs md:inline-flex ${isStale
                ? "font-medium text-amber-700 dark:text-amber-400"
                : "text-gray-600 dark:text-gray-400"}`}>
                <i className="fa-regular fa-hourglass-half text-[11px]" aria-hidden="true"></i>{days} дн.
            </span>
        </Tooltip>
    );
};

// Термін — як у макеті: 12px ink-muted, прострочений — red-700 medium.
const DueDate = ({dueDate, deleted}) => {
    if (!dueDate) return <span className="hidden w-20 shrink-0 sm:block"/>;
    const date = new Date(dueDate);
    const overdue = !deleted && isPast(date) && !isToday(date);
    const today = !deleted && isToday(date);
    return (
        <span title={overdue ? "Термін минув" : "Термін"}
              className={`w-20 shrink-0 whitespace-nowrap text-right text-xs ${overdue
                  ? "font-medium text-red-700 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"}`}>
            {overdue && <i className="fa-regular fa-alarm-exclamation mr-1" aria-hidden="true"></i>}
            {today ? "сьогодні" : format(date, "d MMM", {locale: uk})}
        </span>
    );
};

const Dot = () => <span className="text-gray-500 dark:text-neutral-500" aria-hidden="true">·</span>;

// Сучасне подання списку задач: групування зі згортанням, рядок у дві лінії
// (стан / назва + мета: #id, проєкт, автор, теги, лічильники / термін / учасники),
// дії при ховері.
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
            <div className={`${CARD} flex items-center justify-center py-16`}>
                <Spinner className="h-8 w-8"/>
            </div>
        );
    }

    if (!tasks.length) {
        return (
            <div className={`${CARD} flex flex-col items-center gap-2 py-16 text-gray-600 dark:text-gray-400`}>
                <i className="fa-regular fa-clipboard-check text-2xl text-gray-500" aria-hidden="true"></i>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Задач не знайдено</span>
                <span className="text-xs">Змініть фільтри або створіть нову задачу</span>
            </div>
        );
    }

    return (
        <div data-i-doc="view:task-list" className={CARD}>
            {groups.map((group, groupIndex) => {
                const isDeletedGroup = group.key === DELETED_GROUP_KEY;
                const groupKey = group.key || `${groupBy}:${group.name}`;
                const isCollapsed = group.name !== UNGROUPED_KEY && collapsed.includes(groupKey);
                return (
                    <section key={groupKey} aria-label={group.name === UNGROUPED_KEY ? "Задачі" : group.name}>
                        {group.name !== UNGROUPED_KEY &&
                            <button type="button"
                                    onClick={() => toggleGroup(groupKey)}
                                    aria-expanded={!isCollapsed}
                                    className={`flex w-full items-center gap-2 bg-gray-50 px-4 py-2 text-left transition hover:bg-gray-100 dark:bg-neutral-900/60 dark:hover:bg-neutral-700/60 ${groupIndex > 0 ? "border-t border-gray-200 dark:border-neutral-700" : ""} ${isCollapsed ? "" : "border-b border-gray-200 dark:border-neutral-700"}`}>
                                <i className={`fa-solid fa-chevron-right w-2.5 text-[10px] text-gray-500 transition-transform ${isCollapsed ? "" : "rotate-90"}`} aria-hidden="true"></i>
                                {isDeletedGroup && <i className="fa-regular fa-trash-can w-3 text-center text-[11px] text-gray-500" aria-hidden="true"></i>}
                                {!isDeletedGroup && groupBy === "status" && <StatusDot status={group.name}/>}
                                {!isDeletedGroup && groupBy === "priority" && <PriorityIcon caption={group.name}/>}
                                {!isDeletedGroup && groupBy === "project" && <i className="fa-regular fa-folder w-3 text-center text-[11px] text-gray-500" aria-hidden="true"></i>}
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-300">{group.name}</span>
                                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-[11px] font-bold text-gray-700 dark:bg-neutral-700 dark:text-gray-300">
                                    {group.tasks.length}
                                </span>
                            </button>
                        }
                        {!isCollapsed &&
                            <ul className="m-0 list-none divide-y divide-gray-200 p-0 dark:divide-neutral-700">
                                {group.tasks.map(task => {
                                    const isSelected = task.id === selectedId;
                                    const isDeleted = Boolean(task.deleted_at);
                                    const canChangeStatus = Boolean(onChangeStatus) && canUpdateRow({original: task}, auth)
                                        && allowedStatusIds(task, auth).length > 0;
                                    return (
                                        <li key={task.id}
                                            onClick={() => onSelect(task.id)}
                                            onKeyDown={(e) => {
                                                if (e.target !== e.currentTarget) return;
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onSelect(task.id);
                                                }
                                            }}
                                            tabIndex={0}
                                            aria-current={isSelected ? "true" : undefined}
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
                                            className={`group relative flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 ${isSelected
                                                ? "bg-blue-50 dark:bg-blue-800/20"
                                                : "hover:bg-gray-50 dark:hover:bg-neutral-700/60"} ${isDeleted ? "opacity-60" : ""} ${dragOverId === task.id ? "ring-2 ring-inset ring-blue-500" : ""}`}>
                                            {/* Вибраний рядок — смужка primary зліва, як активний пункт меню */}
                                            {isSelected && <span className="absolute inset-y-0 left-0 w-0.5 bg-blue-600" aria-hidden="true"/>}

                                            {Boolean(onToggleFavorite) &&
                                                <button type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleFavorite(task.id);
                                                        }}
                                                        title={task.isFavorite ? "Прибрати з обраного" : "Додати в обране"}
                                                        aria-label={task.isFavorite ? "Прибрати з обраного" : "Додати в обране"}
                                                        aria-pressed={Boolean(task.isFavorite)}
                                                        className={`-mx-1 shrink-0 rounded p-1 transition focus-visible:opacity-100 ${task.isFavorite
                                                            ? "text-amber-500"
                                                            : "text-gray-500 opacity-0 hover:text-amber-500 group-hover:opacity-100 dark:text-gray-400"}`}>
                                                    <i className={`${task.isFavorite ? "fa-solid" : "fa-regular"} fa-star text-xs`}></i>
                                                </button>
                                            }
                                            <PriorityIcon caption={task.priority}/>
                                            {groupBy !== "status" && !isDeleted && <StatusBadge status={task.status}/>}
                                            {isDeleted && <Badge tone="outline">Видалено</Badge>}

                                            {/* Назва + мета-рядок */}
                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className="truncate text-sm font-medium leading-5 text-gray-800 dark:text-gray-200">
                                                    {task.title || "Без назви"}
                                                </span>
                                                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs leading-4 text-gray-600 dark:text-gray-400">
                                                    <span className="shrink-0 font-mono">#{task.id}</span>
                                                    {task.project && groupBy !== "project" &&
                                                        <>
                                                            <Dot/>
                                                            <span className="inline-flex min-w-0 max-w-[14rem] items-center gap-1" title={`Проєкт: ${task.project}`}>
                                                                <i className="fa-regular fa-folder text-[10px]" aria-hidden="true"></i>
                                                                <span className="truncate">{task.project}</span>
                                                            </span>
                                                        </>
                                                    }
                                                    {task.createdUser &&
                                                        <span className="hidden min-w-0 items-center gap-1.5 xl:inline-flex" title={`Автор: ${task.createdUser}`}>
                                                            <Dot/><span className="truncate">{task.createdUser}</span>
                                                        </span>
                                                    }
                                                    {task.linkedProjectsCount > 0 &&
                                                        <span className={META} title={`Проєктів у наборі: ${task.linkedProjectsCount}`}>
                                                            <Dot/><i className="fa-regular fa-folder-tree text-[10px]" aria-hidden="true"></i>{task.linkedProjectsCount}
                                                        </span>
                                                    }
                                                    {task.commentsCount > 0 &&
                                                        <span className={META} title={`Коментарів: ${task.commentsCount}`}>
                                                            <Dot/><i className="fa-regular fa-message text-[10px]" aria-hidden="true"></i>{task.commentsCount}
                                                        </span>
                                                    }
                                                    {task.attachmentsCount > 0 &&
                                                        <span className={META} title={`Вкладень: ${task.attachmentsCount}`}>
                                                            <Dot/><i className="fa-regular fa-paperclip text-[10px]" aria-hidden="true"></i>{task.attachmentsCount}
                                                        </span>
                                                    }
                                                    {task.tags?.length > 0 &&
                                                        <span className="ml-1 hidden shrink-0 items-center gap-1 lg:inline-flex">
                                                            {task.tags.slice(0, 3).map(tag => (
                                                                <TagPill key={tag.id} tag={tag}/>
                                                            ))}
                                                            {task.tags.length > 3 &&
                                                                <span className="text-[11px] text-gray-600 dark:text-gray-400">+{task.tags.length - 3}</span>
                                                            }
                                                        </span>
                                                    }
                                                </span>
                                            </div>

                                            <AgeBadge createdAt={task.created_at} statusName={task.status}/>
                                            <DueDate dueDate={task.dueDate} deleted={isDeleted}/>
                                            <span className="flex w-20 shrink-0 justify-end">
                                                <UserAvatars users={task.assignedUsers || []} max={3}/>
                                            </span>

                                            {/* Дії — з'являються при ховері / фокусі рядка */}
                                            <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                                                {canChangeStatus &&
                                                    <Menu placement="bottom-end">
                                                        <MenuHandler>
                                                            <IconButton size="xs" variant="text" className={ROW_ACTION}
                                                                        title="Змінити стан"
                                                                        onClick={(e) => e.stopPropagation()}>
                                                                <i className="fa-regular fa-circle-half-stroke"></i>
                                                            </IconButton>
                                                        </MenuHandler>
                                                        <MenuList className="min-w-[10rem] rounded-lg border border-gray-200 p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                                                            {/* Лише переходи, дозволені життєвим циклом для цього користувача */}
                                                            {statuses
                                                                .filter(status => allowedStatusIds(task, auth).includes(status.id))
                                                                .map(status => (
                                                                    <MenuItem key={status.id}
                                                                              onClick={(e) => {
                                                                                  e.stopPropagation();
                                                                                  onChangeStatus(task.id, status.id);
                                                                              }}
                                                                              className="rounded-md px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700 dark:hover:text-gray-100 dark:focus:bg-neutral-700">
                                                                        <StatusBadge status={status.name}/>
                                                                    </MenuItem>
                                                                ))}
                                                        </MenuList>
                                                    </Menu>
                                                }
                                                {Boolean(onCloneRequest) &&
                                                    <IconButton size="xs" variant="text" className={ROW_ACTION}
                                                                title="Створити нову задачу на основі цієї"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onCloneRequest(task.id);
                                                                }}>
                                                        <i className="fa-regular fa-clone"></i>
                                                    </IconButton>
                                                }
                                                {canDeleteRow({original: task}, auth) &&
                                                    <IconButton size="xs" variant="text" color="error"
                                                                title="Видалити (можна відновити)"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDelete(task.id);
                                                                }}>
                                                        <i className="fa-regular fa-trash-can"></i>
                                                    </IconButton>
                                                }
                                                {canRestore({original: task}, auth) &&
                                                    <IconButton size="xs" variant="text" color="primary"
                                                                title="Відновити"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onRestore(task.id);
                                                                }}>
                                                        <i className="fa-solid fa-trash-arrow-up"></i>
                                                    </IconButton>
                                                }
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        }
                    </section>
                );
            })}
        </div>
    );
};

export default TaskList;
