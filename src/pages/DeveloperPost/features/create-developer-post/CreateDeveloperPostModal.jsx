import React, {useEffect, useRef, useState} from "react";
import {Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Switch, Typography} from "@material-tailwind/react";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import AttachmentsGallery from "../../../../Components/AttachmentsGallery.jsx";
import {LabeledInput, LabeledTextarea} from "../../../../Components/fields/LabeledField.jsx";
import MultiSelect from "../../../../Components/fields/MultiSelect.jsx";
import {
    useAttachDeveloperPostFilesMutation,
    useCreateDeveloperPostDraftMutation,
    useDeleteDeveloperPostAttachmentMutation,
    useDeveloperPostOptionsQuery,
    useDeveloperPostQuery,
    useDiscardDeveloperPostDraftMutation,
    useFinalizeDeveloperPostDraftMutation,
    useUpdateDeveloperPostMutation,
} from "../../entities/developerPost/queries.js";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const isImageAttachment = (fileName = "") => IMAGE_EXTENSIONS.includes((fileName.split(".").pop() || "").toLowerCase());
const attachmentUrl = (attachment) => `${location.origin}/files?path=${attachment.fileUrl}`;

const toDatetimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
};

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
const CreateDeveloperPostModal = ({open, onClose, onCreated, post = null}) => {
    const isEditing = Boolean(post);
    const isPublished = post?.status === "published";

    const {data: optionsData} = useDeveloperPostOptionsQuery();
    const tagOptions = optionsData?.tags || [];

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [version, setVersion] = useState("");
    const [tags, setTags] = useState([]);
    const [scheduleMode, setScheduleMode] = useState(false);
    const [publishAt, setPublishAt] = useState("");
    const [notify, setNotify] = useState(false);
    const [draftId, setDraftId] = useState(null);
    const bodyTextareaRef = useRef(null);

    // Наповнення форми: з поста (редагування) або підказкою наступної версії
    // (створення, DeveloperPostService::suggestNextVersion()) — залежно від
    // того, з чим модал відкрито цього разу.
    useEffect(() => {
        if (!open) return;

        if (post) {
            setTitle(post.title || "");
            setBody(post.body || "");
            setVersion(post.version || "");
            setTags(tagOptions.filter((option) => (post.tags || []).includes(option.value)));
            setScheduleMode(post.status === "scheduled");
            setPublishAt(toDatetimeLocal(post.publish_at));
            setNotify(Boolean(post.notify));
        } else {
            setTitle("");
            setBody("");
            setVersion(optionsData?.nextVersion || "");
            setTags([]);
            setScheduleMode(false);
            setPublishAt("");
            setNotify(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, post, optionsData]);

    // Чернетку створюємо один раз, одразу при монтуванні модалки (вона й так
    // монтується лише поки відкрита — {openCreate && <CreateDeveloperPostModal/>}).
    const createDraftMutation = useCreateDeveloperPostDraftMutation();
    useEffect(() => {
        if (isEditing) return;
        createDraftMutation.mutate(undefined, {onSuccess: (created) => setDraftId(created?.id)});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const effectivePostId = post?.id ?? draftId;

    // Живий стан чернетки (вкладення) під час композиції — той самий
    // queryKey/кеш, що інвалідує attach/delete-мутація нижче. У режимі
    // редагування вкладення й так приходять через проп `post`.
    const {data: draftPost} = useDeveloperPostQuery(!isEditing ? draftId : null);
    const activePost = isEditing ? post : draftPost;

    const finalizeMutation = useFinalizeDeveloperPostDraftMutation(draftId);
    const updateMutation = useUpdateDeveloperPostMutation(post?.id);
    const discardDraftMutation = useDiscardDeveloperPostDraftMutation();
    const attachFilesMutation = useAttachDeveloperPostFilesMutation(effectivePostId);
    const deleteAttachmentMutation = useDeleteDeveloperPostAttachmentMutation(effectivePostId);
    const isPending = finalizeMutation.isPending || updateMutation.isPending;

    // Скасування (кнопка "Скасувати" чи закриття діалогу без збереження) —
    // прибирає чернетку одразу. Після успішного збереження onClose()
    // викликається напряму (див. handleSubmit), цей шлях уже не спрацьовує.
    const handleClose = () => {
        if (!isEditing && draftId) discardDraftMutation.mutate(draftId);
        onClose();
    };

    // Вкладення йдуть одразу на реальний post-id (чернетку чи вже
    // опублікований пост) — AttachmentsGallery сама викликає onUpdateList
    // з обраними файлами.
    const handleUpdateAttachmentList = (attachments = []) => {
        const newFiles = attachments.filter((item) => item?.file).map((item) => item.file);
        if (newFiles.length) attachFilesMutation.mutate(newFiles);
    };

    const handleDeleteAttachment = (attachment) => (event) => {
        event.preventDefault();
        if (!attachment) return;
        deleteAttachmentMutation.mutate(attachment);
    };

    // Вставляє markdown-посилання на зображення в позицію курсора textarea —
    // доступно і при створенні (файл уже завантажений на чернетку), і при
    // редагуванні.
    const handleInsertImage = (attachment) => () => {
        const markdown = `![${attachment.fileName || ""}](${attachmentUrl(attachment)})`;
        const textarea = bodyTextareaRef.current;
        const start = textarea?.selectionStart ?? body.length;
        const end = textarea?.selectionEnd ?? body.length;
        const next = `${body.slice(0, start)}${markdown}${body.slice(end)}`;
        setBody(next);

        requestAnimationFrame(() => {
            textarea?.focus();
            const caret = start + markdown.length;
            textarea?.setSelectionRange(caret, caret);
        });
    };

    // Версія — опціональна (порожньо — ок, пост просто ігнорується в реєстрі
    // версій); якщо заповнена, все ще звіряється проти регексу.
    const versionValid = version.trim() === "" || /^\d+\.\d+\.\d+$/.test(version.trim());
    const isValid = title.trim().length > 0
        && versionValid
        && (!scheduleMode || Boolean(publishAt))
        && (isEditing || Boolean(draftId));

    const handleSubmit = (status) => () => {
        if (!isValid) return;

        if (isEditing) {
            updateMutation.mutate({
                title: title.trim(),
                body: body.trim(),
                version: version.trim() || null,
                tags: tags.map((option) => option.value),
                status: !isPublished ? status : undefined,
                notify: !isPublished ? notify : undefined,
                publishAt: !isPublished && status === "scheduled" ? new Date(publishAt).toISOString() : undefined,
            }, {
                onSuccess: (updated) => {
                    onCreated?.(updated?.id);
                    onClose();
                },
            });

            return;
        }

        finalizeMutation.mutate({
            title: title.trim(),
            body: body.trim(),
            version: version.trim() || null,
            tags: tags.map((option) => option.value),
            status,
            notify,
            publishAt: status === "scheduled" ? new Date(publishAt).toISOString() : undefined,
        }, {
            onSuccess: (created) => {
                onCreated?.(created?.id);
                onClose();
            },
        });
    };

    // Форма ховається за спінером, поки чернетка не створена (як у
    // CreateTaskModal) — інакше вкладення нема куди прикріпити.
    const isPreparingDraft = !isEditing && !draftId;

    return (
        <Dialog data-i-doc="modal:developer-post-create" open={open} handler={handleClose} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    {isEditing ? "Редагування поста" : "Новий пост"}
                </Typography>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                {isPreparingDraft ? (
                    <div className="flex items-center justify-center py-10">
                        <Spinner className="h-8 w-8"/>
                    </div>
                ) : (
                    <>
                        <LabeledInput
                            autoFocus
                            label="Заголовок"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Коротко про що оновлення…"
                        />

                        <div className="flex gap-3">
                            <div className="w-32">
                                <LabeledInput
                                    label="Версія (необов'язково)"
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="1.0.0"
                                    invalid={Boolean(version) && !versionValid}
                                />
                            </div>
                            <div className="flex-1">
                                <MultiSelect
                                    label="Теги (необов'язково)"
                                    options={tagOptions}
                                    value={tags}
                                    onChange={(selected) => setTags(selected || [])}
                                    placeholder="Без тегів"
                                />
                            </div>
                        </div>

                        <LabeledTextarea
                            ref={bodyTextareaRef}
                            label="Опис (необов'язково)"
                            rows={8}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Що змінилось… (підтримує Markdown: **жирний**, списки, `код`… ![](url) — вставте зображення кнопкою під вкладеннями нижче.)"
                            className="font-mono"
                        />

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                                Вкладення{activePost?.attachments?.length ? ` (${activePost.attachments.length})` : ""}
                            </label>
                            <AttachmentsGallery
                                data={activePost?.attachments || []}
                                isLoading={attachFilesMutation.isPending}
                                onUpdateList={handleUpdateAttachmentList}
                                onDeleteAttachment={handleDeleteAttachment}
                            />
                            {(activePost?.attachments || []).some((a) => isImageAttachment(a.fileName)) &&
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {activePost.attachments.filter((a) => isImageAttachment(a.fileName)).map((attachment) => (
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
                                    checked={notify}
                                    onChange={(e) => setNotify(e.target.checked)}
                                    label={
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            Відправити сповіщення всім користувачам при публікації
                                        </span>
                                    }
                                />
                                <label className="flex w-fit cursor-pointer items-center gap-2">
                                    <input type="checkbox" checked={scheduleMode} onChange={(e) => setScheduleMode(e.target.checked)}
                                           className="dark:border-slate-600"/>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Запланувати публікацію на майбутній час</span>
                                </label>
                                {scheduleMode &&
                                    <input
                                        type="datetime-local"
                                        value={publishAt}
                                        onChange={(e) => setPublishAt(e.target.value)}
                                        min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                                        className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                }
                            </>
                        }
                    </>
                )}
            </DialogBody>
            <DialogFooter className="gap-x-2">
                <button type="button" onClick={handleClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                {isPublished ? (
                    <LoadingButton isLoading={isPending} disabled={!isValid || isPending}
                                   color="green" onClick={handleSubmit(undefined)}>
                        Зберегти
                    </LoadingButton>
                ) : (
                    <>
                        <LoadingButton isLoading={isPending} disabled={!isValid || isPending}
                                       color="gray" variant="outlined" onClick={handleSubmit("draft")}>
                            Зберегти чернетку
                        </LoadingButton>
                        {scheduleMode ? (
                            <LoadingButton isLoading={isPending} disabled={!isValid || isPending}
                                           color="amber" onClick={handleSubmit("scheduled")}>
                                Запланувати
                            </LoadingButton>
                        ) : (
                            <LoadingButton isLoading={isPending} disabled={!isValid || isPending}
                                           color="green" onClick={handleSubmit("published")}>
                                Опублікувати
                            </LoadingButton>
                        )}
                    </>
                )}
            </DialogFooter>
        </Dialog>
    );
};

export default CreateDeveloperPostModal;
