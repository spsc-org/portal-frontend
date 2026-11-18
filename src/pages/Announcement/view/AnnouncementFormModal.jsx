import { observer } from "mobx-react-lite";
import { Checkbox, Tooltip } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import AttachmentsGallery from "../../../components/AttachmentsGallery.jsx";
import { LabeledInput, LabeledTextarea } from "../../../components/fields/LabeledField.jsx";
import PendingFilesList from "../../../components/fields/PendingFilesList.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { AnnouncementFormViewModel } from "../viewmodel/AnnouncementFormViewModel.js";
import AudiencePicker from "./AudiencePicker.jsx";

// Той самий модал відповідає і за створення, і за РЕДАГУВАННЯ оголошення
// (проп `announcement`) — редагування контенту (заголовок/деталі/аудиторія/
// вкладення) зручніше в модалці, ніж інлайн у картці; AnnouncementDetailPane
// лишає в собі лише перегляд і швидкі дії ІНШИХ користувачів (підтвердження
// прочитання) та автора (публікація чернетки, видалення).
const AnnouncementFormModal = ({ board = null, announcement = null, onClose, onCreated }) => {
    const vm = useViewModel((deps) => new AnnouncementFormViewModel({ ...deps, board, announcement, onDone: onClose, onCreated }));
    const isEditing = vm.isEditing;

    return (
        <Modal data-i-doc="modal:announcement-create" open handler={onClose} size="md">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    {isEditing ? "Редагування оголошення" : "Нове оголошення"}
                </h3>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                <LabeledInput
                    autoFocus
                    label="Заголовок"
                    type="text"
                    value={vm.title}
                    onChange={(e) => vm.setTitle(e.target.value)}
                    placeholder="Коротко про що оголошення…"
                />

                <LabeledTextarea
                    label="Деталі (необов'язково)"
                    rows={6}
                    value={vm.details}
                    onChange={(e) => vm.setDetails(e.target.value)}
                    placeholder="Текст оголошення…"
                />

                {isEditing ? (
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Файли{vm.attachments.length ? ` (${vm.attachments.length})` : ""}
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
                    </div>
                ) : (
                    <PendingFilesList files={vm.files} onAdd={vm.addFiles} onRemove={vm.removeFile}/>
                )}

                <AudiencePicker
                    audienceType={vm.audienceType}
                    onAudienceTypeChange={vm.setAudienceType}
                    recipients={vm.recipients}
                    onRecipientsChange={vm.setRecipients}
                    users={vm.users}
                />

                <Tooltip content={vm.audienceType === "selected"
                    ? "Адресоване конкретним людям оголошення завжди потребує підтвердження — це доручення їм"
                    : "Відкриття картки не рахуватиметься прочитанням — користувач має явно натиснути «Я прочитав»"}>
                    <label className={`flex w-fit items-center gap-2 ${vm.audienceType === "selected" ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
                        <Checkbox
                            checked={vm.requiresAcknowledgement}
                            disabled={vm.audienceType === "selected"}
                            onChange={(e) => vm.setRequiresAcknowledgement(e.target.checked)}
                            className="dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Потребує свідомого підтвердження прочитання
                        </span>
                    </label>
                </Tooltip>
            </ModalBody>
            <ModalFooter className="gap-x-2">
                <button type="button" onClick={onClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                {isEditing ? (
                    <LoadingButton isLoading={vm.isPending} disabled={!vm.canSubmit}
                                   color="green" onClick={vm.saveEdit}>
                        Зберегти
                    </LoadingButton>
                ) : (
                    <>
                        <LoadingButton isLoading={vm.isPending} disabled={!vm.canSubmit}
                                       color="gray" variant="outlined" onClick={() => vm.create(true)}>
                            Зберегти чернетку
                        </LoadingButton>
                        <LoadingButton isLoading={vm.isPending} disabled={!vm.canSubmit}
                                       color="green" onClick={() => vm.create(false)}>
                            Опублікувати
                        </LoadingButton>
                    </>
                )}
            </ModalFooter>
        </Modal>
    );
};

export default observer(AnnouncementFormModal);
