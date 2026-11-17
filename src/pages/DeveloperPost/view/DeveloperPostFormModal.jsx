import { useRef } from "react";
import { observer } from "mobx-react-lite";
import { Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Switch, Typography } from "@material-tailwind/react";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import AttachmentsGallery from "../../../components/AttachmentsGallery.jsx";
import { LabeledInput, LabeledTextarea } from "../../../components/fields/LabeledField.jsx";
import MultiSelect from "../../../components/fields/MultiSelect.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { DeveloperPostFormViewModel } from "../viewmodel/DeveloperPostFormViewModel.js";

// Той самий модал відповідає і за створення, і за РЕДАГУВАННЯ поста (проп
// `post`) — на відміну від Announcement (де редагування інлайн у детальній
// панелі), тут за прямою вимогою користувача весь досвід редагування (текст,
// версія/тег, стан публікації, вкладення, вставка зображень у текст)
// зведено в один модал; DeveloperPostDetailPane лишається лише переглядом.
//
// Створення — той самий принцип, що CreateTaskModal (Task.isDraft): при
// монтуванні одразу створюється чернетка-шелл (DeveloperPostService::
// createDraft(), pending=true), щоб зображення можна було вставляти в текст
// ОДРАЗУ під час першого заповнення (вкладення йдуть на реальний post-id,
// без окремого stage-механізму). "Створити" — finalizeDraft() (знімає
// pending). Закриття без збереження — discardDraft() (чернетку і вкладення
// видалено одразу; покинуті на випадок краху/закритої вкладки прибирає
// планова attachments:purge-orphaned).
//
// Три дії публікації (на відміну від Announcement, де їх дві): зберегти
// чернетку, опублікувати одразу, або запланувати на майбутню дату/час —
// автопублікація Artisan-командою (PublishScheduledDeveloperPosts, щохвилини).
// Для вже ОПУБЛІКОВАНОГО поста стан лишається фіксованим (публікацію назад
// у чернетку/заплановане цей модал не повертає) — усе інше (заголовок,
// версія, теги, опис, вкладення) редагується завжди, одна кнопка "Зберегти".
const DeveloperPostFormModal = ({ board = null, post = null, onClose, onCreated }) => {
    const vm = useViewModel((deps) => new DeveloperPostFormViewModel({ ...deps, board, post, onDone: onClose, onCreated }));
    const bodyTextareaRef = useRef(null);
    const isEditing = vm.isEditing;
    const isPublished = vm.isPublished;

    // Курсор — DOM-деталь View: VM вставляє markdown і повертає нову позицію.
    const handleInsertImage = (attachment) => () => {
        const textarea = bodyTextareaRef.current;
        const caret = vm.insertImage(attachment, textarea?.selectionStart ?? vm.body.length, textarea?.selectionEnd ?? vm.body.length);
        requestAnimationFrame(() => {
            textarea?.focus();
            textarea?.setSelectionRange(caret, caret);
        });
    };

    return (
        <Dialog data-i-doc="modal:developer-post-create" open handler={vm.cancel} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    {isEditing ? "Редагування поста" : "Новий пост"}
                </Typography>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                {vm.isPreparingDraft ? (
                    <div className="flex items-center justify-center py-10">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : (
                    <>
                        <LabeledInput
                            autoFocus
                            label="Заголовок"
                            type="text"
                            value={vm.title}
                            onChange={(e) => vm.setTitle(e.target.value)}
                            placeholder="Коротко про що оновлення…"
                        />

                        <div className="flex gap-3">
                            <div className="w-32">
                                <LabeledInput
                                    label="Версія (необов'язково)"
                                    type="text"
                                    value={vm.version}
                                    onChange={(e) => vm.setVersion(e.target.value)}
                                    placeholder="1.0.0"
                                    invalid={Boolean(vm.version) && !vm.versionValid}
                                />
                            </div>
                            <div className="flex-1">
                                <MultiSelect
                                    label="Теги (необов'язково)"
                                    options={vm.tagOptions}
                                    value={vm.tags}
                                    onChange={vm.setTags}
                                    placeholder="Без тегів"
                                />
                            </div>
                        </div>

                        <LabeledTextarea
                            ref={bodyTextareaRef}
                            label="Опис (необов'язково)"
                            rows={8}
                            value={vm.body}
                            onChange={(e) => vm.setBody(e.target.value)}
                            placeholder="Що змінилось… (підтримує Markdown: **жирний**, списки, `код`… ![](url) — вставте зображення кнопкою під вкладеннями нижче.)"
                            className="font-mono"
                        />

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                                Вкладення{vm.attachments.length ? ` (${vm.attachments.length})` : ""}
                            </label>
                            <AttachmentsGallery
                                data={vm.attachments}
                                isLoading={vm.attachMutation.isPending}
                                onUpdateList={vm.uploadAttachments}
                                onDeleteAttachment={(attachment) => (event) => {
                                    event.preventDefault();
                                    vm.deleteAttachment(attachment);
                                }}
                            />
                            {vm.imageAttachments.length > 0 &&
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {vm.imageAttachments.map((attachment) => (
                                        <button
                                            key={attachment.id}
                                            type="button"
                                            onClick={handleInsertImage(attachment)}
                                            title={`Вставити «${attachment.fileName}» у текст (курсор)`}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:text-blue-400"
                                        >
                                            <i className="fa-regular fa-image"></i>
                                            Вставити «{attachment.fileName}»
                                        </button>
                                    ))}
                                </div>
                            }
                        </div>

                        {!isPublished &&
                            <>
                                <Switch
                                    color="green"
                                    checked={vm.notify}
                                    onChange={(e) => vm.setNotify(e.target.checked)}
                                    label={
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            Відправити сповіщення всім користувачам при публікації
                                        </span>
                                    }
                                />
                                <label className="flex w-fit cursor-pointer items-center gap-2">
                                    <input type="checkbox" checked={vm.scheduleMode} onChange={(e) => vm.setScheduleMode(e.target.checked)}
                                           className="dark:border-slate-600"/>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Запланувати публікацію на майбутній час</span>
                                </label>
                                {vm.scheduleMode &&
                                    <input
                                        type="datetime-local"
                                        value={vm.publishAt}
                                        onChange={(e) => vm.setPublishAt(e.target.value)}
                                        min={vm.minPublishAt}
                                        className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                }
                            </>
                        }
                    </>
                )}
            </DialogBody>
            <DialogFooter className="gap-x-2">
                <button type="button" onClick={vm.cancel}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                {isPublished ? (
                    <LoadingButton isLoading={vm.isPending} disabled={!vm.canSubmit}
                                   color="green" onClick={() => vm.submit(undefined)}>
                        Зберегти
                    </LoadingButton>
                ) : (
                    <>
                        <LoadingButton isLoading={vm.isPending} disabled={!vm.canSubmit}
                                       color="gray" variant="outlined" onClick={() => vm.submit("draft")}>
                            Зберегти чернетку
                        </LoadingButton>
                        {vm.scheduleMode ? (
                            <LoadingButton isLoading={vm.isPending} disabled={!vm.canSubmit}
                                           color="amber" onClick={() => vm.submit("scheduled")}>
                                Запланувати
                            </LoadingButton>
                        ) : (
                            <LoadingButton isLoading={vm.isPending} disabled={!vm.canSubmit}
                                           color="green" onClick={() => vm.submit("published")}>
                                Опублікувати
                            </LoadingButton>
                        )}
                    </>
                )}
            </DialogFooter>
        </Dialog>
    );
};

export default observer(DeveloperPostFormModal);
