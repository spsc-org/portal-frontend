import React, {useEffect, useState} from "react";
import {Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Tooltip, Typography} from "@material-tailwind/react";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import AttachmentsGallery from "../../../../Components/AttachmentsGallery.jsx";
import {LabeledInput, LabeledTextarea} from "../../../../Components/fields/LabeledField.jsx";
import PendingFilesList from "../../../../Components/fields/PendingFilesList.jsx";
import AudiencePicker from "../../shared/ui/AudiencePicker.jsx";
import {
    useAnnouncementOptionsQuery,
    useAttachAnnouncementFilesMutation,
    useCreateAnnouncementMutation,
    useDeleteAnnouncementAttachmentMutation,
    useUpdateAnnouncementMutation,
} from "../../entities/announcement/queries.js";

// Той самий модал відповідає і за створення, і за РЕДАГУВАННЯ оголошення
// (проп `announcement`) — редагування контенту (заголовок/деталі/аудиторія/
// вкладення) зручніше в модалці, ніж інлайн у картці; AnnouncementDetailPane
// лишає в собі лише перегляд і швидкі дії ІНШИХ користувачів (підтвердження
// прочитання) та автора (публікація чернетки, видалення).
const CreateAnnouncementModal = ({open, onClose, onCreated, announcement = null}) => {
    const isEditing = Boolean(announcement);

    const [title, setTitle] = useState("");
    const [details, setDetails] = useState("");
    const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(false);
    const [audienceType, setAudienceType] = useState("all");
    const [recipients, setRecipients] = useState([]);
    const [files, setFiles] = useState([]);

    const {data: optionsData} = useAnnouncementOptionsQuery();
    const users = optionsData?.users || [];

    const createMutation = useCreateAnnouncementMutation();
    const updateMutation = useUpdateAnnouncementMutation(announcement?.id);
    const attachFilesMutation = useAttachAnnouncementFilesMutation(announcement?.id);
    const deleteAttachmentMutation = useDeleteAnnouncementAttachmentMutation(announcement?.id);
    const isPending = createMutation.isPending || updateMutation.isPending;

    // Наповнення форми: з оголошення (редагування) або з чистого стану
    // (створення) — залежно від того, з чим модал відкрито цього разу.
    useEffect(() => {
        if (!open) return;

        if (announcement) {
            setTitle(announcement.title || "");
            setDetails(announcement.details || "");
            setRequiresAcknowledgement(Boolean(announcement.requires_acknowledgement));
            setAudienceType(announcement.audience_type || "all");
            setRecipients(announcement.recipients || []);
        } else {
            setTitle("");
            setDetails("");
            setRequiresAcknowledgement(false);
            setAudienceType("all");
            setRecipients([]);
        }
        setFiles([]);
    }, [open, announcement]);

    const handleClose = () => {
        onClose();
    };

    const handleAddFiles = (event) => {
        const selected = Array.from(event.target.files || []);
        setFiles((prev) => [...prev, ...selected]);
        event.target.value = "";
    };

    const handleRemoveFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Редагування: нові файли завантажуються одразу (оголошення вже існує).
    const handleUpdateAttachmentList = (attachments = []) => {
        const newFiles = attachments.filter((item) => item?.file).map((item) => item.file);
        if (newFiles.length) attachFilesMutation.mutate(newFiles);
    };

    const handleDeleteAttachment = (attachment) => (event) => {
        event.preventDefault();
        if (!attachment) return;
        deleteAttachmentMutation.mutate(attachment);
    };

    // Адресоване конкретним людям оголошення — по суті доручення їм ознайомитись,
    // тож підтвердження прочитання для нього обов'язкове (форсується й на бекенді).
    const handleAudienceTypeChange = (value) => {
        setAudienceType(value);
        if (value === "selected") setRequiresAcknowledgement(true);
    };

    const isValid = title.trim().length > 0 && (audienceType !== "selected" || recipients.length > 0);

    const handleEditSubmit = () => {
        if (!isValid) return;
        updateMutation.mutate({
            title: title.trim(),
            details: details.trim(),
            requiresAcknowledgement,
            audienceType,
            recipientIds: recipients.map((user) => user.id),
        }, {
            onSuccess: () => handleClose(),
        });
    };

    const handleCreateSubmit = (isDraft) => () => {
        if (!isValid) return;
        createMutation.mutate({
            title: title.trim(),
            details: details.trim(),
            requiresAcknowledgement,
            audienceType,
            recipientIds: recipients.map((user) => user.id),
            files,
            isDraft,
        }, {
            onSuccess: (created) => {
                onCreated?.(created?.id);
                handleClose();
            },
        });
    };

    return (
        <Dialog data-i-doc="modal:announcement-create" open={open} handler={handleClose} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    {isEditing ? "Редагування оголошення" : "Нове оголошення"}
                </Typography>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                <LabeledInput
                    autoFocus
                    label="Заголовок"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Коротко про що оголошення…"
                />

                <LabeledTextarea
                    label="Деталі (необов'язково)"
                    rows={6}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Текст оголошення…"
                />

                {isEditing ? (
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                            Файли{announcement.attachments?.length ? ` (${announcement.attachments.length})` : ""}
                        </label>
                        <AttachmentsGallery
                            data={announcement.attachments || []}
                            isLoading={attachFilesMutation.isPending}
                            onUpdateList={handleUpdateAttachmentList}
                            onDeleteAttachment={handleDeleteAttachment}
                        />
                    </div>
                ) : (
                    <PendingFilesList files={files} onAdd={handleAddFiles} onRemove={handleRemoveFile}/>
                )}

                <AudiencePicker
                    audienceType={audienceType}
                    onAudienceTypeChange={handleAudienceTypeChange}
                    recipients={recipients}
                    onRecipientsChange={setRecipients}
                    users={users}
                />

                <Tooltip content={audienceType === "selected"
                    ? "Адресоване конкретним людям оголошення завжди потребує підтвердження — це доручення їм"
                    : "Відкриття картки не рахуватиметься прочитанням — користувач має явно натиснути «Я прочитав»"}>
                    <label className={`flex w-fit items-center gap-2 ${audienceType === "selected" ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
                        <Checkbox
                            checked={requiresAcknowledgement}
                            disabled={audienceType === "selected"}
                            onChange={(e) => setRequiresAcknowledgement(e.target.checked)}
                            className="dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                            Потребує свідомого підтвердження прочитання
                        </span>
                    </label>
                </Tooltip>
            </DialogBody>
            <DialogFooter className="gap-x-2">
                <button type="button" onClick={handleClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                {isEditing ? (
                    <LoadingButton isLoading={isPending} disabled={!isValid || isPending}
                                   color="green" onClick={handleEditSubmit}>
                        Зберегти
                    </LoadingButton>
                ) : (
                    <>
                        <LoadingButton isLoading={isPending} disabled={!isValid || isPending}
                                       color="gray" variant="outlined" onClick={handleCreateSubmit(true)}>
                            Зберегти чернетку
                        </LoadingButton>
                        <LoadingButton isLoading={isPending} disabled={!isValid || isPending}
                                       color="green" onClick={handleCreateSubmit(false)}>
                            Опублікувати
                        </LoadingButton>
                    </>
                )}
            </DialogFooter>
        </Dialog>
    );
};

export default CreateAnnouncementModal;
