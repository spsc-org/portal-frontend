import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { RevertStateViewModel } from "./viewmodel/ProposalViewModels.js";
import { useProposalProps } from "./viewmodel/useProposalProps.js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"
import SingleSelect from "../../components/fields/SingleSelect.jsx";
import LoadingButton from "../../components/Buttons/LoadingButton.jsx";


const RevertStateModal = ({open = false, selectedId: id, onClose}) => {
    const props = useProposalProps();
    const vm = useViewModel((deps) => new RevertStateViewModel({ ...deps, id, props }));
    const { form, errors, options } = vm;
    const setForm = vm.setForm;
    const revertState = vm.revertCmd;
    const onSubmit = async () => {
        if (await vm.submit()) onClose();
    };

    return (
        <Modal open={open} handler={onClose} size="xs">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    Зняти зафіксований стан
                </h3>
            </ModalHeader>
            <ModalBody className="h-[16rem] relative overflow-y-auto">
                <SingleSelect closeMenuOnSelect error={errors?.stateId}
                              info="Всі прив'язані проєкти стануть доступними для редагування, а також можливість змінювати зв'язок з
                    пакетами. Якщо указ прив'язаний то він залишаєтсья незмінним."

                              onChange={(option)=> setForm({state: option})} options={options} value={form.state} label="Оберіть стан"/>
            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
                <LoadingButton isLoading={revertState.isPending} variant="gradient" color="green" onClick={onSubmit}
                        disabled={revertState.isPending}>
                    Застосувати
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
};

export default observer(RevertStateModal);
