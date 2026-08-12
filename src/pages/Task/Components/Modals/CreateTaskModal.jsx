import {usePage} from "@inertiajs/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import React, {useEffect, useMemo, useState} from "react";
import {
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Spinner,
    Switch,
    Typography,
} from "@material-tailwind/react";
import SingleSelect from "../../../../Components/fields/SingleSelect.jsx";
import DatePicker from "../../../../Components/fields/DatePicker.jsx";
import AttachmentsGallery from "../../../../Components/AttachmentsGallery.jsx";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import toast from "react-hot-toast";
import {format} from "date-fns";
import {getPriorityStyle, getTypeStyle} from "../../utils.jsx";
import {
    getErrorMessage,
    useAttachTaskFiles,
    useDeleteTaskAttachment,
    useTaskOptions,
    useUpdateTaskAssignees,
    useUpdateTaskDescription,
    useUpdateTaskDueDate,
    useUpdateTaskPriority,
    useUpdateTaskProject,
    useUpdateTaskTags,
    useUpdateTaskTitle,
    useUpdateTaskType,
} from "../../queries.jsx";
import MetaRow from "../../../../Components/MetaRow.jsx";
import TagsEditor from "../TagsEditor.jsx";
import AssigneesEditor from "../AssigneesEditor.jsx";

/**
 * Модалка створення задачі: чернетка (`Task.isDraft=1`) створюється одразу
 * при відкритті — назва/опис/тип/пріоритет/проєкт/термін/теги/учасники/
 * вкладення зберігаються одразу, тим самим набором PATCH-ендпоінтів (і тими
 * самими хуками-мутаціями з queries.jsx), що інлайн-редагування в картці
 * (TaskViewPanel) — консистентні дані й тости в обох місцях. На відміну від
 * картки поля тут одразу відкриті для редагування (без click-to-reveal) —
 * це форма заповнення, а не компактний перегляд, зайві кліки не потрібні.
 * "Створити" лише знімає прапорець isDraft (finalizeDraft); закриття без
 * нього — discardDraft (чернетку і вкладення видалено одразу; покинуті на
 * випадок краху/закритої вкладки прибирає планова attachments:purge-orphaned).
 */
const CreateTaskModal = ({open, onClose, onCreated, view = "task", cloneFromTaskId = null}) => {
    const pageProps = usePage().props;
    const {auth, token} = pageProps;
    const {data: taskOptions} = useTaskOptions(auth);
    const dictionaries = taskOptions || pageProps;
    const types = dictionaries.types || [];
    const projects = dictionaries.projects || [];
    const users = dictionaries.users || [];
    const priorities = dictionaries.priorities || [];
    const availableTags = dictionaries.tags || [];
    const queryClient = useQueryClient();

    const [isAdvanced, setIsAdvanced] = useState(() => {
        return localStorage.getItem('task-create-modal-advanced') === 'true';
    });
    const [draftId, setDraftId] = useState(null);
    const [titleDraft, setTitleDraft] = useState("");
    const [descriptionDraft, setDescriptionDraft] = useState("");

    const toggleAdvanced = () => {
        setIsAdvanced(prev => {
            const newValue = !prev;
            localStorage.setItem('task-create-modal-advanced', newValue.toString());
            return newValue;
        });
    };

    // Учасник за замовчуванням для "Моїх задач"
    const defaultAssigneeId = view === "assigned" ? auth?.user?.id : null;
    // Тип за замовчуванням: баг-сторінка форсує "Помилка", інакше "Новий функціонал"
    // "Баг" — форсовано на /task/bug; інакше "Звичайна" (дефолт розділу задач)
    const defaultTypeId = types.find((t) => view === "bug" ? t.id === 1 : t.name === "Звичайна")?.id;

    // Чернетку створюємо один раз, одразу при монтуванні модалки (вона й
    // так монтується лише поки відкрита — {openCreate && <CreateTaskModal/>})
    const createDraftMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.post('/api/task/draft', {typeId: defaultTypeId}, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onSuccess: (response) => setDraftId(response?.data?.id),
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося підготувати задачу")),
    });

    useEffect(() => {
        createDraftMutation.mutate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Поточний стан чернетки — той самий queryKey, що й у TaskViewPanel,
    // тому мутації (той самий queries.jsx) інвалідують саме цей запит.
    // isLoading: форма ховається за спінером, поки цей ПЕРШИЙ фетч не
    // завершиться (як і в картці) — інакше швидка дія (напр. вибір
    // учасника з готового списку, без набору тексту) встигає обігнати
    // цей запит, і його застаріла (ще без учасника) відповідь пізніше
    // затирає щойно збережене.
    const {data: draftData, isLoading: isDraftLoading} = useQuery({
        queryKey: ['task-show', draftId],
        queryFn: async () => {
            const response = await axios.get(`/api/task/${draftId}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        },
        enabled: Boolean(draftId),
    });
    const draftTask = draftData?.data;
    const draftAttachments = draftData?.attachments || [];
    // Eloquent серіалізує назви зв'язків у snake_case (toArray()/JSON) — бекенд
    // віддає "assigned_users", не "assignedUsers"; snake_case лишено як фолбек
    // (той самий патерн, що й у TaskViewPanel.jsx)
    const assignedUsers = draftTask?.assignedUsers || draftTask?.assigned_users || [];

    // Одразу додати виконавця для "Моїх задач", щойно чернетка готова —
    // ПРОПУСКАЄМО при клонуванні: список учасників донора (applyCloneMutation
    // нижче) має бути єдиним джерелом істини, без гонитви двох PATCH одразу
    // після створення чернетки.
    const updateAssigneesMutation = useUpdateTaskAssignees(draftId, auth, token);
    useEffect(() => {
        if (draftId && defaultAssigneeId && !cloneFromTaskId) {
            updateAssigneesMutation.mutate([defaultAssigneeId]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftId]);

    // "Створити на основі цієї задачі" — читаємо донора (той самий
    // GET /api/task/{id}, що відкриває TaskViewPanel) і прогоняємо його дані
    // через ТІ САМІ PATCH-ендпоінти, що й ручне редагування — лише напряму
    // через axios, а не через useUpdateTaskXxx()-хуки: кожен з них показує
    // власний toast ("Тип оновлено", "Теги оновлено"...), 7-8 тостів підряд
    // при автопідстановці — шумно. Тут один зведений виклик, один фінальний
    // toast, один invalidate. Аудит/обговорення/файли донора свідомо не
    // читаються тут узагалі (їх тут і немає в GET /api/task/{id}).
    const applyCloneMutation = useMutation({
        mutationFn: async () => {
            const donorRes = await axios.get(`/api/task/${cloneFromTaskId}`, {
                headers: {"userId": auth?.user?.id}
            });
            const donor = donorRes.data?.data ?? {};
            const donorAssignedUsers = donor.assignedUsers || donor.assigned_users || [];
            const donorLinkedProjects = donorRes.data?.linkedProjects ?? [];

            const patchHeaders = {
                headers: {'Content-Type': 'application/json', "X-CSRF-Token": token, "userId": auth?.user?.id}
            };
            await axios.patch(`/api/task/${draftId}/title`, {title: donor.title ?? ""}, patchHeaders);
            await axios.patch(`/api/task/${draftId}/description`, {description: donor.description ?? ""}, patchHeaders);
            if (donor.typeId) await axios.patch(`/api/task/${draftId}/type`, {typeId: donor.typeId}, patchHeaders);
            if (donor.priorityId) await axios.patch(`/api/task/${draftId}/priority`, {priorityId: donor.priorityId}, patchHeaders);
            if (donor.projectId) await axios.patch(`/api/task/${draftId}/project`, {projectId: donor.projectId}, patchHeaders);
            if (donor.dueDate) await axios.patch(`/api/task/${draftId}/due-date`, {dueDate: donor.dueDate}, patchHeaders);
            await axios.patch(`/api/task/${draftId}/tags`, {tags: (donor.tags || []).map(t => t.id)}, patchHeaders);
            await axios.patch(`/api/task/${draftId}/assignees`, {userIds: donorAssignedUsers.map(u => u.id)}, patchHeaders);
            await axios.patch(`/api/task/${draftId}/projects`, {projectIds: donorLinkedProjects.map(p => p.id)}, patchHeaders);

            return donor;
        },
        onSuccess: (donor) => {
            setTitleDraft(donor.title || "");
            setDescriptionDraft(donor.description || "");
            queryClient.invalidateQueries({queryKey: ['task-show', draftId]});
            toast.success(`Дані підставлено з задачі #${cloneFromTaskId}`);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося підставити дані донора")),
    });

    useEffect(() => {
        if (draftId && cloneFromTaskId) {
            applyCloneMutation.mutate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftId]);

    const updateTitleMutation = useUpdateTaskTitle(draftId, auth, token);
    const updateDescriptionMutation = useUpdateTaskDescription(draftId, auth, token);
    const updateTypeMutation = useUpdateTaskType(draftId, auth, token);
    const updatePriorityMutation = useUpdateTaskPriority(draftId, auth, token);
    const updateProjectMutation = useUpdateTaskProject(draftId, auth, token);
    const updateDueDateMutation = useUpdateTaskDueDate(draftId, auth, token);
    const updateTagsMutation = useUpdateTaskTags(draftId, auth, token);
    const attachFilesMutation = useAttachTaskFiles(draftId, auth, token);
    const deleteAttachmentMutation = useDeleteTaskAttachment(draftId, auth, token);

    // Назва: локальна чернетка тексту, зберігається на blur (без спаму запитів на кожну літеру)
    useEffect(() => {
        if (draftTask) setTitleDraft(draftTask.title || "");
    }, [draftId]);
    const saveTitle = () => {
        const value = titleDraft.trim();
        if (value && value !== (draftTask?.title || "")) updateTitleMutation.mutate(value);
    };

    useEffect(() => {
        if (draftTask) setDescriptionDraft(draftTask.description || "");
    }, [draftId]);
    const saveDescription = () => {
        if (descriptionDraft !== (draftTask?.description || "")) updateDescriptionMutation.mutate(descriptionDraft);
    };

    const handleAddTag = (selected) => {
        const option = selected?.[selected.length - 1];
        if (!option) return;
        const current = (draftTask?.tags || []).map(t => t.id);
        const addition = option.__isNew__ ? option.value : (option.id ?? option.value);
        if (!option.__isNew__ && current.includes(addition)) return;
        updateTagsMutation.mutate([...current, addition]);
    };

    const handleRemoveTag = (tagId) => {
        updateTagsMutation.mutate((draftTask?.tags || []).filter(t => t.id !== tagId).map(t => t.id));
    };

    const tagOptions = useMemo(
        () => availableTags.filter(tag => !(draftTask?.tags || []).some(t => t.id === tag.id)),
        [availableTags, draftTask?.tags]
    );

    const handleAddAssignee = (selected) => {
        const option = selected?.[selected.length - 1];
        if (!option) return;
        const current = assignedUsers.map(u => u.id);
        if (current.includes(option.id)) return;
        updateAssigneesMutation.mutate([...current, option.id]);
    };

    const handleRemoveAssignee = (userId) => {
        updateAssigneesMutation.mutate(assignedUsers.filter(u => u.id !== userId).map(u => u.id));
    };

    const assigneeOptions = useMemo(
        () => users.filter(user => !assignedUsers.some(u => u.id === user.id)),
        [users, assignedUsers]
    );

    const handleUpdateAttachmentList = (attachments = []) => {
        if (!attachments.length) return;
        attachFilesMutation.mutate(attachments);
    };

    const handleDeleteAttachment = (attachment) => (event) => {
        event.preventDefault();
        if (!attachment) return;
        deleteAttachmentMutation.mutate(attachment);
    };

    // Фіналізація: усі поля вже збережені окремими PATCH — тут лише знімається isDraft
    const finalizeMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.patch(`/api/task/${draftId}/finalize`, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося створити задачу")),
        onSuccess: (response) => {
            toast.success("Задачу створено", {
                style: {background: 'dark:dark:bg-slate-800', color: 'text-slate-400'},
            });
            queryClient.invalidateQueries({queryKey: ['tasks']});
            onCreated?.(response?.data?.id);
            onClose();
        },
    });

    const handleFinalize = () => {
        saveTitle();
        finalizeMutation.mutate();
    };

    // Чернетку без "Створити" (X, Escape, фон, кнопка "Закрити") —
    // видаляємо одразу разом із вкладеннями; не блокуємо закриття модалки
    const discardDraftMutation = useMutation({
        mutationFn: async (id) => {
            const response = await axios.delete(`/api/task/${id}/draft`, {
                headers: {"X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося прибрати чернетку")),
    });

    const handleCancel = () => {
        if (draftId) discardDraftMutation.mutate(draftId);
        onClose();
    };

    // При клонуванні форма ховається за спінером, поки applyCloneMutation не
    // завершиться (успіхом чи помилкою) — інакше на мить блимають порожні/
    // дефолтні поля до того, як донорські дані підставляться.
    const isReady = Boolean(draftId) && Boolean(draftData) && !isDraftLoading
        && (!cloneFromTaskId || applyCloneMutation.isSuccess || applyCloneMutation.isError);

    return (
        <Dialog open={open} handler={handleCancel} size="md">
            <DialogHeader className="flex flex-row justify-between items-center">
                <Typography variant="h5" className="dark:text-slate-200">
                    Створити задачу
                </Typography>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border dark:border-slate-700">
                    <Typography variant="small" className="text-slate-600 dark:text-slate-400 font-medium">
                        Розширений режим
                    </Typography>
                    <Switch
                        id="advanced-mode"
                        ripple={false}
                        color="green"
                        checked={isAdvanced}
                        onChange={toggleAdvanced}
                        className="dark:bg-slate-700"
                    />
                </div>
            </DialogHeader>
            <DialogBody className={`${isAdvanced ? 'h-[36rem]' : 'h-fit'} overflow-y-auto px-4`}>
                {!isReady ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : (
                    <>
                        {/* Назва — завжди відкрита для редагування, зберігається на blur */}
                        <div className="flex items-center gap-1.5">
                            <textarea
                                autoFocus
                                rows={2}
                                value={titleDraft}
                                placeholder="Назва задачі…"
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={saveTitle}
                                className="w-full resize-none rounded-md border border-slate-200 bg-white p-1.5 text-base font-semibold leading-snug text-slate-900 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                            {updateTitleMutation.isPending && <Spinner className="h-3.5 w-3.5 shrink-0"/>}
                        </div>

                        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/60 px-3 dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-800/40">
                            {isAdvanced &&
                                <>
                                    <MetaRow icon="fa-regular fa-shapes" label="Тип">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex-1">
                                                <SingleSelect size="xs" closeMenuOnSelect
                                                              options={types}
                                                              disabled={view === "bug"}
                                                              value={types.find(t => t.id === draftTask?.typeId) || null}
                                                              onChange={(opt) => opt && updateTypeMutation.mutate(opt.id)}/>
                                            </div>
                                            {updateTypeMutation.isPending
                                                ? <Spinner className="h-3 w-3 shrink-0"/>
                                                : getTypeStyle(types.find(t => t.id === draftTask?.typeId)?.name)}
                                        </div>
                                    </MetaRow>
                                    <MetaRow icon="fa-regular fa-flag" label="Пріоритет">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex-1">
                                                <SingleSelect size="xs" closeMenuOnSelect
                                                              options={priorities}
                                                              value={priorities.find(p => p.id === draftTask?.priorityId) || null}
                                                              onChange={(opt) => opt && updatePriorityMutation.mutate(opt.id)}/>
                                            </div>
                                            {updatePriorityMutation.isPending
                                                ? <Spinner className="h-3 w-3 shrink-0"/>
                                                : getPriorityStyle(priorities.find(p => p.id === draftTask?.priorityId)?.caption)}
                                        </div>
                                    </MetaRow>
                                    <MetaRow icon="fa-regular fa-folder" label="Проєкт">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex-1">
                                                <SingleSelect size="xs" closeMenuOnSelect isClearable isCreatable
                                                              options={projects}
                                                              value={projects.find(p => p.id === draftTask?.projectId) || null}
                                                              onChange={(opt) => {
                                                                  const newProjectId = opt?.__isNew__ ? opt.value : (opt?.id ?? null);
                                                                  updateProjectMutation.mutate(newProjectId);
                                                              }}
                                                              formatCreateLabel={(inputValue) => `Створити "${inputValue}"`}/>
                                            </div>
                                            {updateProjectMutation.isPending && <Spinner className="h-3 w-3 shrink-0"/>}
                                        </div>
                                    </MetaRow>
                                    <MetaRow icon="fa-regular fa-tags" label="Теги">
                                        <TagsEditor
                                            tags={draftTask?.tags || []}
                                            options={tagOptions}
                                            onAdd={handleAddTag}
                                            onRemove={handleRemoveTag}
                                            isPending={updateTagsMutation.isPending}
                                        />
                                    </MetaRow>
                                </>
                            }
                            <MetaRow icon="fa-regular fa-users" label="Учасники">
                                <AssigneesEditor
                                    assignedUsers={assignedUsers}
                                    options={assigneeOptions}
                                    onAdd={handleAddAssignee}
                                    onRemove={handleRemoveAssignee}
                                    isPending={updateAssigneesMutation.isPending}
                                />
                            </MetaRow>
                            <MetaRow icon="fa-regular fa-calendar" label="Термін">
                                <div className="flex items-center gap-1.5">
                                    <DatePicker
                                        value={draftTask?.dueDate ? new Date(draftTask.dueDate) : undefined}
                                        onChange={(date) => date && updateDueDateMutation.mutate(format(date, "yyyy-MM-dd"))}
                                    />
                                    {updateDueDateMutation.isPending && <Spinner className="h-3 w-3 shrink-0"/>}
                                    {Boolean(draftTask?.dueDate) &&
                                        <button type="button"
                                                onClick={() => updateDueDateMutation.mutate(null)}
                                                title="Прибрати термін"
                                                className="text-slate-400 transition hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400">
                                            <i className="fa-regular fa-calendar-xmark text-xs"></i>
                                        </button>
                                    }
                                </div>
                            </MetaRow>
                        </div>

                        {isAdvanced && (
                            <div className="mt-3">
                                <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Опис</p>
                                <div className="flex items-start gap-1.5">
                                    <textarea
                                        rows={4}
                                        value={descriptionDraft}
                                        placeholder="Додати опис…"
                                        onChange={(e) => setDescriptionDraft(e.target.value)}
                                        onBlur={saveDescription}
                                        className="w-full resize-y rounded-md border border-slate-200 bg-white p-2 text-sm leading-relaxed text-slate-700 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    />
                                    {updateDescriptionMutation.isPending && <Spinner className="h-3.5 w-3.5 shrink-0"/>}
                                </div>
                            </div>
                        )}

                        <div className="mt-3">
                            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                Вкладення{draftAttachments.length > 0 ? ` (${draftAttachments.length})` : ""}
                            </p>
                            <AttachmentsGallery data={draftAttachments}
                                                 onUpdateList={handleUpdateAttachmentList}
                                                 onDeleteAttachment={handleDeleteAttachment}
                                                 isLoading={attachFilesMutation.isPending}/>
                        </div>
                    </>
                )}
            </DialogBody>
            <DialogFooter className="gap-x-2">
                <button type="button" onClick={handleCancel}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Закрити
                </button>
                <LoadingButton
                    isLoading={finalizeMutation.isPending}
                    disabled={!isReady}
                    color="green"
                    onClick={handleFinalize}
                >
                    Створити
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default CreateTaskModal;
