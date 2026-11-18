import { observer } from "mobx-react-lite";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import { format } from "date-fns";
import Input from "../../../components/fields/Input.jsx";
import SingleSelect from "../../../components/fields/SingleSelect.jsx";
import DatePicker from "../../../components/fields/DatePicker.jsx";
import ImportFile from "../../../components/Modal/ImportFile.jsx";
import UploadFileList from "../../../components/UploadFileList.jsx";
import { confirmToast } from "../../../components/confirmToast.jsx";
import { BOOLEANS, SANC_DECREE_TYPES } from "../../../lib/utils.js";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { DecreeFormViewModel } from "../viewmodel/DecreeViewModels.js";

/** Створення (без decreeId) або редагування указу; монтується відкритою. */
const DecreeFormModal = ({ open, onClose, decreeId = null }) => {
    const vm = useViewModel((deps) => new DecreeFormViewModel({ ...deps, decreeId }));
    const { form, errors, decreeFile, attachments, isEditing, isLocked } = vm;
    const decree = vm.decree;

    const handleSubmit = async () => {
        if (await vm.submit()) onClose();
    };
    const confirmDeleteFile = (fileId) =>
        confirmToast("Видалити файл назавжди?", () => vm.deleteStoredFile(fileId));
    const handleDeleteDecreeFile = () => {
        if (isEditing && decreeFile?.id) confirmDeleteFile(decreeFile.id);
        else vm.setDecreeFile(null);
    };

    // Нова назва файлу указу: <код>_<дата> (у редагуванні — зі збережених даних).
    const nameSource = isEditing ? decree : form;
    const renamedTo = `${nameSource?.code ? nameSource.code.replace("/", "-") : "-"}_${nameSource?.date ? format(nameSource.date, "yyyy-MM-dd") : ""}`;

    return (
        <Modal data-i-doc={isEditing ? "modal:decree-update" : "modal:decree-create"} open={open} handler={onClose} size="md">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    {isEditing
                        ? <>Редагувати указ: {decree?.code} {decree?.date ? <span>від {format(decree.date, "dd.MM.yyyy")}</span> : ""}</>
                        : "Створити указ"}
                </h3>
            </ModalHeader>
            <ModalBody className="h-[32rem] overflow-y-auto">
                {isEditing &&
                    <div className="mb-2">
                        <label className="cursor-pointer text-gray-600 dark:text-gray-400">
                            <input
                                type="checkbox"
                                className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                                checked={vm.isProtected}
                                onChange={(e) => vm.setProtected(e.target.checked)}
                                name="isResponsible"
                            />{' '}
                            Зняти блокування
                        </label>
                    </div>
                }
                <div className="grid grid-cols-2 gap-2">
                    <SingleSelect closeMenuOnSelect options={SANC_DECREE_TYPES}
                                  label="Тип"
                                  id="typeId"
                                  error={errors?.typeId}
                                  disabled={isLocked}
                                  value={form.typeId}
                                  onChange={vm.changeSelect('typeId')}/>
                    <SingleSelect closeMenuOnSelect options={BOOLEANS}
                                  label="Діючий"
                                  id="isActive"
                                  error={errors?.isActive}
                                  disabled={isLocked}
                                  value={form.isActive}
                                  onChange={vm.changeSelect('isActive')}/>
                    <Input error={errors?.link} placeholder="" label="Посилання"
                           value={form.link} name="link" disabled={isLocked}
                           onChange={vm.changeInput}/>
                    <Input error={errors?.code} placeholder="" label="Код"
                           value={form.code} name="code" disabled={isLocked}
                           onChange={vm.changeInput}/>
                    <Input error={errors?.rnboId} placeholder="" label="rnboId"
                           value={form.rnboId} name="rnboId" disabled={isLocked}
                           onChange={vm.changeInput}/>
                    {isLocked ?
                        <Input error={errors?.date} disabled
                               label="Дата"
                               value={form.date ? format(form.date, "dd.MM.yyyy") : ''} name="regDate"
                        />
                        :
                        <DatePicker onChange={vm.changeDate} error={errors?.date} value={form.date} label="Дата"/>
                    }
                </div>

                <Input tag="textarea" error={errors?.comment} placeholder="" label="Коментар"
                       value={form.comment} name="comment" disabled={isLocked}
                       onChange={vm.changeInput}/>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Указ:</h4>
                <div className="flex  gap-x-2 max-w-md">
                    <Input disabled placeholder="Відсутній файл" error={errors?.decreeFile}
                           value={decreeFile?.name}/>
                    <Button onClick={vm.openUpload} size="sm">
                        <i className="fa-regular fa-plus"></i>
                    </Button>
                    {Boolean(decreeFile?.name) && (
                        <Button title="Видалити файл" color="red" onClick={handleDeleteDecreeFile} size="sm">
                            <i className="fa-regular fa-file-slash"></i>
                        </Button>
                    )}
                </div>
                {Boolean(decreeFile) &&
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="mr-1">Назва файлу буде змінена на:</span>
                        <span>{renamedTo}</span>
                    </div>
                }
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Додати додатки:</h4>
                <UploadFileList
                    errors={errors}
                    data={isEditing ? decree : form}
                    attachments={attachments}
                    uploadAttachments={vm.uploadAttachment}
                    setAttachments={vm.setAttachments}
                    onDeleteFile={isEditing ? confirmDeleteFile : undefined}
                />
                {vm.isUploadOpen &&
                    <ImportFile
                        accept="application/pdf"
                        open={vm.isUploadOpen}
                        handleSubmit={vm.setDecreeFile}
                        formatText="Формати: .pdf"
                        onClose={vm.closeUpload}/>
                }
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose} className="mr-1">
                    <span>Закрити</span>
                </Button>
                <Button variant="gradient" color="green" onClick={handleSubmit} disabled={vm.isPending || vm.isLoading}>
                    {vm.isPending && isEditing && <i className="fa-regular fa-spinner animate-spin"></i>}
                    <span>{isEditing ? "Редагувати" : "Створити"}</span>
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(DecreeFormModal);
