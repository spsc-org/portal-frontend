import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { CreateTaskViewModel } from "../../viewmodel/TaskViewModels.js";
import { Spinner, Switch } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import SingleSelect from "../../../../components/fields/SingleSelect.jsx";
import DatePicker from "../../../../components/fields/DatePicker.jsx";
import AttachmentsGallery from "../../../../components/AttachmentsGallery.jsx";
import LoadingButton from "../../../../components/Buttons/LoadingButton.jsx";
import Button from "../../../../components/Buttons/Button.jsx";
import {format} from "date-fns";
import {FIELD, getPriorityStyle, getTypeStyle, SECTION_LABEL} from "../../utils.jsx";
import MetaRow from "../../../../components/MetaRow.jsx";
import TagsEditor from "../TagsEditor.jsx";
import AssigneesEditor from "../AssigneesEditor.jsx";

/**
 * Модалка створення задачі: чернетка (`Task.isDraft=1`) створюється одразу
 * при відкритті — назва/опис/тип/пріоритет/проєкт/термін/теги/учасники/
 * вкладення зберігаються одразу, тим самим набором PATCH-ендпоінтів (і тими
 * самими командами полів — model/taskCommands.js), що інлайн-редагування в картці
 * (TaskViewPanel) — консистентні дані й тости в обох місцях. На відміну від
 * картки поля тут одразу відкриті для редагування (без click-to-reveal) —
 * це форма заповнення, а не компактний перегляд, зайві кліки не потрібні.
 * "Створити" лише знімає прапорець isDraft (finalizeDraft); закриття без
 * нього — discardDraft (чернетку і вкладення видалено одразу; покинуті на
 * випадок краху/закритої вкладки прибирає планова attachments:purge-orphaned).
 */
const CreateTaskModal = ({open, onClose, onCreated, view = "task", cloneFromTaskId = null}) => {
    const vm = useViewModel((deps) => new CreateTaskViewModel({ ...deps, view, cloneFromTaskId, onCreated, onClose }));
    const { types, projects, priorities, isAdvanced, isReady, titleDraft, descriptionDraft } = vm;
    const draftTask = vm.task;
    const { draftAttachments, assignedUsers, tagOptions, assigneeOptions } = vm;
    const toggleAdvanced = vm.toggleAdvanced;
    const setTitleDraft = vm.setTitleDraft;
    const setDescriptionDraft = vm.setDescriptionDraft;
    const saveTitle = vm.saveTitle;
    const saveDescription = vm.saveDescription;
    const handleAddTag = vm.addTag;
    const handleRemoveTag = vm.removeTag;
    const handleAddAssignee = vm.addAssignee;
    const handleRemoveAssignee = vm.removeAssignee;
    const handleUpdateAttachmentList = vm.attach;
    const handleDeleteAttachment = (attachment) => (event) => {
        event.preventDefault();
        if (attachment) vm.deleteAttachment(attachment);
    };
    const handleFinalize = vm.finalize;
    const handleCancel = vm.cancel;
    const finalizeMutation = vm.finalizeCmd;
    const updateTitleMutation = vm.cmd.updateTitle;
    const updateDescriptionMutation = vm.cmd.updateDescription;
    const updateTypeMutation = vm.cmd.updateType;
    const updatePriorityMutation = vm.cmd.updatePriority;
    const updateProjectMutation = vm.cmd.updateProject;
    const updateDueDateMutation = vm.cmd.updateDueDate;
    const updateTagsMutation = vm.cmd.updateTags;
    const updateAssigneesMutation = vm.cmd.updateAssignees;
    const attachFilesMutation = vm.cmd.attachFiles;

    return (
        <Modal open={open} handler={handleCancel} size="md">
            <ModalHeader title="Створити задачу">
                <label htmlFor="advanced-mode"
                       className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1 dark:border-neutral-700 dark:bg-neutral-900">
                    <span className="text-xs font-medium normal-case text-gray-700 dark:text-gray-300">
                        Розширений режим
                    </span>
                    <Switch
                        id="advanced-mode"
                        ripple={false}
                        color="blue"
                        checked={isAdvanced}
                        onChange={toggleAdvanced}
                        className="dark:bg-neutral-600"
                    />
                </label>
            </ModalHeader>
            <ModalBody className={`${isAdvanced ? 'h-[36rem]' : 'h-fit'} overflow-y-auto px-4`}>
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
                                aria-label="Назва задачі"
                                className={`${FIELD} resize-none p-2 text-base font-semibold leading-snug !text-gray-900 dark:!text-gray-100`}
                            />
                            {updateTitleMutation.isPending && <Spinner className="h-3.5 w-3.5 shrink-0"/>}
                        </div>

                        <div className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200 px-3 dark:divide-neutral-700 dark:border-neutral-700">
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
                                                aria-label="Прибрати термін"
                                                className="text-gray-600 transition hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                                            <i className="fa-regular fa-calendar-xmark text-xs"></i>
                                        </button>
                                    }
                                </div>
                            </MetaRow>
                        </div>

                        {isAdvanced && (
                            <div className="mt-3">
                                <p className={SECTION_LABEL}>Опис</p>
                                <div className="flex items-start gap-1.5">
                                    <textarea
                                        rows={4}
                                        value={descriptionDraft}
                                        placeholder="Додати опис…"
                                        onChange={(e) => setDescriptionDraft(e.target.value)}
                                        onBlur={saveDescription}
                                        aria-label="Опис задачі"
                                        className={`${FIELD} resize-y p-2 text-sm leading-relaxed`}
                                    />
                                    {updateDescriptionMutation.isPending && <Spinner className="h-3.5 w-3.5 shrink-0"/>}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <p className={SECTION_LABEL}>
                                Вкладення{draftAttachments.length > 0 ? ` (${draftAttachments.length})` : ""}
                            </p>
                            <AttachmentsGallery data={draftAttachments}
                                                 onUpdateList={handleUpdateAttachmentList}
                                                 onDeleteAttachment={handleDeleteAttachment}
                                                 isLoading={attachFilesMutation.isPending}/>
                        </div>
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={handleCancel} title="Закрити без створення — чернетку буде видалено">
                    Закрити
                </Button>
                <LoadingButton
                    isLoading={finalizeMutation.isPending}
                    disabled={!isReady}
                    color="primary"
                    onClick={handleFinalize}>
                    Створити
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
};

export default observer(CreateTaskModal);
