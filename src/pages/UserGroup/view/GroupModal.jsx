import { observer } from "mobx-react-lite";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import Input from "../../../components/fields/Input.jsx";
import MultiSelect from "../../../components/fields/MultiSelect.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { GroupFormViewModel } from "../viewmodel/GroupFormViewModel.js";

/** Монтується лише коли відкрита — стан форми живе рівно стільки, скільки модалка. */
const GroupModal = ({ group, onClose }) => {
    const vm = useViewModel((deps) => new GroupFormViewModel({ ...deps, group, onDone: onClose }));

    return (
        <Modal data-i-doc="modal:user-groups-group-modal" open size="sm" handler={onClose} className="border">
            <ModalHeader className="border-b">
                {vm.isEdit ? "Редагувати групу" : "Нова група"}
            </ModalHeader>
            <ModalBody className="flex flex-col gap-4">
                <Input
                    label="Назва групи"
                    name="name"
                    value={vm.name}
                    onChange={(e) => vm.setName(e.target.value)}
                    error={vm.errors?.name}
                    isRequired
                />
                <MultiSelect
                    label="Учасники"
                    id="members"
                    options={vm.userOptions}
                    value={vm.selectedMembers}
                    onChange={vm.setMembers}
                    error={vm.errors?.member_ids}
                    placeholder="Оберіть учасників"
                />
            </ModalBody>
            <ModalFooter className="border-t">
                <Button color="secondary" onClick={onClose} className="mr-1" disabled={vm.isSaving}>
                    Закрити
                </Button>
                <Button variant="gradient" color="green" onClick={vm.submit} disabled={!vm.canSubmit}>
                    {vm.isSaving ? "Зберігаю..." : "Зберегти"}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(GroupModal);
