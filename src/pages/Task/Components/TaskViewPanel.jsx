import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { confirmToast } from "../../../components/confirmToast.jsx";
import { TaskDetailsViewModel } from "../viewmodel/TaskViewModels.js";
import {Chip, IconButton, Menu, MenuHandler, MenuItem, MenuList, Spinner, Tooltip} from "@material-tailwind/react";
import {format} from "date-fns";
import AttachmentsGallery from "../../../components/AttachmentsGallery.jsx";
import {allowedStatusIds, getPriorityStyle, getStatusStyle, getTypeStyle} from "../utils.jsx";
import MergeTaskModal from "./Modals/MergeTaskModal.jsx";
import CreateTaskModal from "./Modals/CreateTaskModal.jsx";
import ProjectsSetModal from "./Modals/ProjectsSetModal.jsx";
import TaskAuditModal from "./Modals/TaskAuditModal.jsx";
import TaskDiscussion from "./TaskDiscussion.jsx";
import MetaRow from "../../../components/MetaRow.jsx";
import TagsEditor from "./TagsEditor.jsx";
import AssigneesEditor from "./AssigneesEditor.jsx";
import InlineSelectField from "./fields/InlineSelectField.jsx";
import InlineTitleField from "./fields/InlineTitleField.jsx";
import InlineDescriptionField from "./fields/InlineDescriptionField.jsx";
import InlineDueDateField from "./fields/InlineDueDateField.jsx";

// Панель швидкого перегляду задачі праворуч від таблиці (master-detail):
// одинарний клік по рядку підвантажує дані сюди, таблиця лишається клікабельною.
// Модалки злиття, набору проєктів і блок обговорення — окремі компоненти
// (Modals/MergeTaskModal.jsx, Modals/ProjectsSetModal.jsx, TaskDiscussion.jsx).
// Поля картки (назва/опис/тип/пріоритет/проєкт/термін/теги/учасники) —
// спільні Inline*Field/TagsEditor/AssigneesEditor + команди model/taskCommands.js,
// перевикористані так само в CreateTaskModal (чернетка при створенні) —
// однаковий вигляд і поведінка в обох місцях.
/** Монтується з key={id}: VM (запит картки, команди полів) — на одну задачу. */
const TaskViewPanel = ({selectedId: id, onClose}) => {
    const vm = useViewModel((deps) => new TaskDetailsViewModel({ ...deps, taskId: id }));
    const auth = vm.auth;
    const token = undefined;
    const { projects, statuses, types, priorities, users } = vm;
    const { data, task, isLoading, isFetching, attachments, resultAttachments, canEdit, canReadAudit } = vm;
    const { projectName, linkedProjects, linkedProjectIds, assignedUsers, tagOptions, assigneeOptions } = vm;
    const { isProjectsModalOpen, isMergeModalOpen, isAuditModalOpen, isCloneModalOpen } = vm;
    const setIsProjectsModalOpen = vm.setProjectsModalOpen;
    const setIsMergeModalOpen = vm.setMergeModalOpen;
    const setIsAuditModalOpen = vm.setAuditModalOpen;
    const setIsCloneModalOpen = vm.setCloneModalOpen;
    const canRemoveTag = (tag) => vm.canRemoveTag(tag);
    const handleAddTag = vm.addTag;
    const handleRemoveTag = vm.removeTag;
    const handleAddAssignee = vm.addAssignee;
    const handleRemoveAssignee = vm.removeAssignee;
    const handleToggleFavorite = vm.toggleFavorite;
    const handleChangeStatus = vm.changeStatus;
    const handleCopyLink = vm.copyLink;
    const handleUpdateAttachmentList = vm.attach;
    const handleUpdateResultAttachmentList = vm.attachResult;
    const handleDeleteAttachment = (attachment) => (event) => {
        event.preventDefault();
        if (attachment) confirmToast("Видалити файл?", () => vm.deleteAttachment(attachment));
    };
    const toggleFavoriteMutation = vm.cmd.toggleFavorite;
    const updateTitleMutation = vm.cmd.updateTitle;
    const updateDescriptionMutation = vm.cmd.updateDescription;
    const updateResultMutation = vm.cmd.updateResult;
    const updateTypeMutation = vm.cmd.updateType;
    const updatePriorityMutation = vm.cmd.updatePriority;
    const updateProjectMutation = vm.cmd.updateProject;
    const updateDueDateMutation = vm.cmd.updateDueDate;
    const updateTagsMutation = vm.cmd.updateTags;
    const updateAssigneesMutation = vm.cmd.updateAssignees;
    const attachFilesMutation = vm.cmd.attachFiles;
    const attachResultFilesMutation = vm.cmd.attachResultFiles;
    const updateStatusMutation = vm.cmd.changeStatus;

    return (
        <aside data-i-doc="view:task-view-panel"
            className="w-[26rem] 2xl:w-[30rem] shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {/* Шапка: id, дії */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">#{id}</span>
                    {Boolean(task?.deleted_at) &&
                        <Chip size="sm" color="blue" variant="ghost" className="py-0.5" value="Видалено"/>
                    }
                    {Boolean(task) && (canEdit && allowedStatusIds(task, auth).length > 0 ? (
                        <Menu placement="bottom-start">
                            <MenuHandler>
                                <button type="button" title="Змінити стан"
                                        disabled={updateStatusMutation.isPending}
                                        className="inline-flex items-center gap-1 rounded transition hover:opacity-70">
                                    {getStatusStyle(task.status?.name)}
                                    {updateStatusMutation.isPending
                                        ? <Spinner className="h-3 w-3"/>
                                        : <i className="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>}
                                </button>
                            </MenuHandler>
                            <MenuList className="min-w-[9rem] dark:border-slate-700 dark:bg-slate-800">
                                {/* Лише переходи, дозволені життєвим циклом (TaskLifecycle) */}
                                {statuses
                                    .filter(status => allowedStatusIds(task, auth).includes(status.id))
                                    .map(status => (
                                        <MenuItem key={status.id}
                                                  onClick={() => handleChangeStatus(status.id)}
                                                  className="dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                            {getStatusStyle(status.name)}
                                        </MenuItem>
                                    ))}
                            </MenuList>
                        </Menu>
                    ) : getStatusStyle(task.status?.name))}
                    {isFetching && <Spinner className="h-3 w-3"/>}
                </div>
                <div className="flex items-center gap-1">
                    {Boolean(task) &&
                        <Tooltip content={data?.isFavorite ? "Прибрати з обраного" : "Додати в обране"}>
                            <IconButton size="sm" variant="text"
                                        className={data?.isFavorite ? "text-amber-400" : "dark:text-slate-300"}
                                        disabled={toggleFavoriteMutation.isPending}
                                        onClick={handleToggleFavorite}>
                                <i className={`${data?.isFavorite ? "fa-solid" : "fa-regular"} fa-star`}></i>
                            </IconButton>
                        </Tooltip>
                    }
                    {canEdit &&
                        <Tooltip content="Злити з іншою задачею">
                            <IconButton size="sm" variant="text" className="dark:text-slate-300" onClick={() => setIsMergeModalOpen(true)}>
                                <i className="fa-solid fa-code-merge"></i>
                            </IconButton>
                        </Tooltip>
                    }
                    {Boolean(task) &&
                        <Tooltip content="Створити нову задачу на основі цієї">
                            <IconButton size="sm" variant="text" className="dark:text-slate-300" onClick={() => setIsCloneModalOpen(true)}>
                                <i className="fa-regular fa-clone"></i>
                            </IconButton>
                        </Tooltip>
                    }
                    {Boolean(task) && canReadAudit &&
                        <Tooltip content="Історія змін">
                            <IconButton
                                size="sm"
                                variant="text"
                                className="dark:text-slate-300"
                                onClick={() => setIsAuditModalOpen(true)}
                            >
                                <i className="fa-regular fa-clock-rotate-left"></i>
                            </IconButton>
                        </Tooltip>
                    }
                    <Tooltip content="Скопіювати посилання">
                        <IconButton size="sm" variant="text" className="dark:text-slate-300" onClick={handleCopyLink}>
                            <i className="fa-regular fa-link"></i>
                        </IconButton>
                    </Tooltip>
                    <Tooltip content="Закрити (Esc)">
                        <IconButton size="sm" variant="text" className="dark:text-slate-300" onClick={onClose}>
                            <i className="fa-regular fa-xmark text-base"></i>
                        </IconButton>
                    </Tooltip>
                </div>
            </div>

            {/* Тіло */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {isLoading && !task ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : !task ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
                        <i className="fa-regular fa-circle-exclamation text-2xl"></i>
                        <span className="text-sm">Не вдалося завантажити задачу</span>
                    </div>
                ) : (
                    <>
                        <InlineTitleField
                            value={task.title}
                            onSave={(value) => value && updateTitleMutation.mutate(value)}
                            isPending={updateTitleMutation.isPending}
                            canEdit={canEdit}
                        />

                        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/60 px-3 dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-800/40">
                            <InlineSelectField
                                icon="fa-regular fa-shapes" label="Тип"
                                options={types}
                                value={types.find(t => t.id === task.typeId) || null}
                                onSave={(opt) => opt && opt.id !== task.typeId && updateTypeMutation.mutate(opt.id)}
                                renderValue={(v) => <>{getTypeStyle(v?.title)}<span>{v?.title || "—"}</span></>}
                                canEdit={canEdit}
                                isPending={updateTypeMutation.isPending}
                            />
                            <InlineSelectField
                                icon="fa-regular fa-flag" label="Пріоритет"
                                options={priorities}
                                value={priorities.find(p => p.id === task.priorityId) || null}
                                onSave={(opt) => opt && opt.id !== task.priorityId && updatePriorityMutation.mutate(opt.id)}
                                renderValue={(v) => getPriorityStyle(v?.caption) || "—"}
                                canEdit={canEdit}
                                isPending={updatePriorityMutation.isPending}
                            />
                            <InlineSelectField
                                icon="fa-regular fa-folder" label="Проєкт"
                                options={projects}
                                value={projects.find(p => p.id === task.projectId) || null}
                                isClearable isCreatable
                                formatCreateLabel={(inputValue) => `Створити "${inputValue}"`}
                                onSave={(opt) => {
                                    const newProjectId = opt?.__isNew__ ? opt.value : (opt?.id ?? null);
                                    if (newProjectId === (task?.projectId ?? null)) return;
                                    updateProjectMutation.mutate(newProjectId);
                                }}
                                renderValue={() => projectName || "—"}
                                canEdit={canEdit}
                                isPending={updateProjectMutation.isPending}
                            />
                            <MetaRow icon="fa-regular fa-tags" label="Теги">
                                <TagsEditor
                                    tags={task.tags || []}
                                    options={tagOptions}
                                    onAdd={handleAddTag}
                                    onRemove={handleRemoveTag}
                                    isPending={updateTagsMutation.isPending}
                                    canEdit={canEdit}
                                    canRemoveTag={canRemoveTag}
                                />
                            </MetaRow>
                            <MetaRow icon="fa-regular fa-folder-tree" label="Проєкти">
                                <span className="inline-flex items-center gap-1.5">
                                    {linkedProjectIds.length > 0
                                        ? `${linkedProjectIds.length} у наборі`
                                        : "—"}
                                    {linkedProjectIds.length > 0 &&
                                        <a href={`/project?fId=${linkedProjectIds.join(',')}`}
                                           target="_blank" rel="noreferrer"
                                           title="Відкрити набір у розділі проєктів"
                                           onClick={(e) => e.stopPropagation()}
                                           className="text-blue-500 transition hover:text-blue-600">
                                            <i className="fa-regular fa-arrow-up-right-from-square text-[10px]"></i>
                                        </a>
                                    }
                                    {canEdit &&
                                        <button type="button"
                                                onClick={() => setIsProjectsModalOpen(true)}
                                                title="Керувати набором проєктів"
                                                className="text-slate-400 transition hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400">
                                            <i className="fa-regular fa-pen text-[10px]"></i>
                                        </button>
                                    }
                                </span>
                            </MetaRow>
                            <MetaRow icon="fa-regular fa-users" label="Учасники">
                                <AssigneesEditor
                                    assignedUsers={assignedUsers}
                                    options={assigneeOptions}
                                    onAdd={handleAddAssignee}
                                    onRemove={handleRemoveAssignee}
                                    isPending={updateAssigneesMutation.isPending}
                                    canEdit={canEdit}
                                />
                            </MetaRow>
                            <InlineDueDateField
                                value={task.dueDate}
                                onSave={(dueDate) => updateDueDateMutation.mutate(dueDate)}
                                onClear={() => updateDueDateMutation.mutate(null)}
                                isPending={updateDueDateMutation.isPending}
                                canEdit={canEdit}
                            />
                            <MetaRow icon="fa-regular fa-user-pen" label="Створив">
                                {task.created_user?.name || task.createdUser?.name}
                            </MetaRow>
                            <MetaRow icon="fa-regular fa-clock" label="Створено">
                                {task.created_at ? format(task.created_at, "yyyy-MM-dd HH:mm") : ""}
                            </MetaRow>
                            <MetaRow icon="fa-regular fa-clock-rotate-left" label="Оновлено">
                                {task.updated_at ? format(task.updated_at, "yyyy-MM-dd HH:mm") : ""}
                            </MetaRow>
                        </div>

                        <div className="mt-3">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                Опис
                            </p>
                            <InlineDescriptionField
                                value={task.description}
                                onSave={(value) => updateDescriptionMutation.mutate(value)}
                                isPending={updateDescriptionMutation.isPending}
                                canEdit={canEdit}
                            />
                        </div>

                        {(attachments.length > 0 || canEdit) &&
                            <div className="mt-4">
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    Вкладення{attachments.length > 0 ? ` (${attachments.length})` : ""}
                                </p>
                                <AttachmentsGallery data={attachments}
                                                    isDisabled={!canEdit}
                                                    onUpdateList={handleUpdateAttachmentList}
                                                    onDeleteAttachment={handleDeleteAttachment}
                                                    isLoading={attachFilesMutation.isPending}/>
                            </div>
                        }

                        {(task.result || resultAttachments.length > 0 || canEdit) &&
                            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    Результат
                                </p>
                                <InlineDescriptionField
                                    value={task.result}
                                    onSave={(value) => updateResultMutation.mutate(value)}
                                    isPending={updateResultMutation.isPending}
                                    canEdit={canEdit}
                                    placeholder="Додати опис результату…"
                                />
                                {(resultAttachments.length > 0 || canEdit) &&
                                    <div className="mt-2.5">
                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                            Файли результату{resultAttachments.length > 0 ? ` (${resultAttachments.length})` : ""}
                                        </p>
                                        <AttachmentsGallery data={resultAttachments}
                                                            isDisabled={!canEdit}
                                                            onUpdateList={handleUpdateResultAttachmentList}
                                                            onDeleteAttachment={handleDeleteAttachment}
                                                            isLoading={attachResultFilesMutation.isPending}/>
                                    </div>
                                }
                            </div>
                        }

                        <TaskDiscussion
                            taskId={id}
                            createdUserId={task.createdUserId}
                            assignedUsers={assignedUsers}
                            auth={auth}
                            token={token}
                        />
                    </>
                )}
            </div>

            {isProjectsModalOpen &&
                <ProjectsSetModal
                    taskId={id}
                    initialProjects={linkedProjects}
                    auth={auth}
                    token={token}
                    onClose={() => setIsProjectsModalOpen(false)}
                />
            }

            {isMergeModalOpen &&
                <MergeTaskModal
                    baseId={id}
                    auth={auth}
                    token={token}
                    onClose={() => setIsMergeModalOpen(false)}
                />
            }

            {isCloneModalOpen &&
                <CreateTaskModal
                    open={true}
                    cloneFromTaskId={id}
                    onClose={() => setIsCloneModalOpen(false)}
                    onCreated={() => setIsCloneModalOpen(false)}
                />
            }

            {isAuditModalOpen &&
                <TaskAuditModal
                    taskId={id}
                    auth={auth}
                    users={users}
                    onClose={() => setIsAuditModalOpen(false)}
                />
            }
        </aside>
    );
};

export default observer(TaskViewPanel);
