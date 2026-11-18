import { observer } from "mobx-react-lite";
import { Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import { LabeledInput, LabeledTextarea } from "../../../components/fields/LabeledField.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { PhoneFormViewModel } from "../viewmodel/PhoneViewModels.js";
import PhoneNumbersEditor from "./PhoneNumbersEditor.jsx";

/** Створення (entry = null) або редагування телефонного запису. Монтується лише відкритою. */
const PhoneFormModal = ({ entry = null, onClose, onCreated }) => {
    const vm = useViewModel((deps) => new PhoneFormViewModel({ ...deps, entry, onDone: onClose, onCreated }));

    return (
        <Modal data-i-doc={vm.isEditing ? "modal:handbook-phone-edit" : "modal:handbook-phone-create"} open handler={onClose} size="sm">
            <ModalHeader>
                <Typography variant="h5" className="dark:text-gray-200">{vm.isEditing ? "Редагування запису" : "Новий запис"}</Typography>
            </ModalHeader>
            <ModalBody className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
                <LabeledInput
                    autoFocus
                    label="Ім'я"
                    type="text"
                    value={vm.name}
                    onChange={(e) => vm.setName(e.target.value)}
                    placeholder="Прізвище Ім'я…"
                />
                <PhoneNumbersEditor value={vm.phones} onChange={vm.setPhones}/>
                <LabeledInput
                    label="Підрозділ (необов'язково)"
                    type="text"
                    value={vm.department}
                    onChange={(e) => vm.setDepartment(e.target.value)}
                />
                <LabeledTextarea
                    label="Примітка до особи (необов'язково)"
                    rows={3}
                    value={vm.note}
                    onChange={(e) => vm.setNote(e.target.value)}
                />
            </ModalBody>
            <ModalFooter className="gap-x-2">
                <button type="button" onClick={onClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                <LoadingButton isLoading={vm.isPending} disabled={!vm.isValid || vm.isPending}
                               color="green" onClick={vm.submit}>
                    {vm.isEditing ? "Зберегти" : "Додати"}
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
};

export default observer(PhoneFormModal);
