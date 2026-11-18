import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { ResponsibleFunctionFormViewModel } from "../viewmodel/ResponsibleViewModels.js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import {LabeledInput, LabeledTextarea} from "../../../components/fields/LabeledField.jsx";

// Створення/редагування функції (довідник) — той самий каркас Dialog, що й
// CreateDeveloperPostModal/AnnouncementModal, лише два поля.
const ResponsibleFunctionModalInner = observer(({open, onClose, func = null}) => {
    const vm = useViewModel((deps) => new ResponsibleFunctionFormViewModel({ ...deps, func }));
    const isEditing = vm.isEditing;
    const { name, description, isPending, setName, setDescription } = vm;
    const handleSave = () => vm.save(() => onClose());

    return (
        <Modal data-i-doc="modal:staff-responsible-function" open={open} handler={onClose} size="sm">
            <ModalHeader>{isEditing ? "Редагувати функцію" : "Нова функція"}</ModalHeader>
            <ModalBody className="flex flex-col gap-3">
                <LabeledInput
                    label="Назва"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Напр. Відповідальний за пожежну безпеку"
                    autoFocus
                />
                <LabeledTextarea
                    label="Опис (необов'язково)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </ModalBody>
            <ModalFooter className="gap-2">
                <LoadingButton variant="outlined" color="blue-gray" onClick={onClose} disabled={isPending}>
                    Скасувати
                </LoadingButton>
                <LoadingButton color="blue" onClick={handleSave} isLoading={isPending} disabled={!name.trim()}>
                    Зберегти
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
});

/** Монтується лише відкритою. */
const ResponsibleFunctionModal = (props) => (props.open ? <ResponsibleFunctionModalInner {...props}/> : null);

export default ResponsibleFunctionModal;
