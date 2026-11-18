import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { CompleteViewModel } from "../viewmodel/ProposalViewModels.js";
import { useProposalProps } from "../viewmodel/useProposalProps.js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import Input from "../../../components/fields/Input.jsx";
import DatePicker from "../../../components/fields/DatePicker.jsx";
import SingleSelect from "../../../components/fields/SingleSelect.jsx";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";


const CompleteModal = ({open, onClose, ...dialogProps}) => {
    const pageProps = useProposalProps();
    const vm = useViewModel((deps) => new CompleteViewModel({ ...deps, props: pageProps, dialogProps }));
    const { form, errors, title, fixedStates } = vm;
    const complete = vm.completeCmd;
    const handleChangeDate = vm.changeDate;
    const handleInput = vm.changeInput;
    const handleChangeSelect = vm.changeSelect;
    const onSubmit = async () => {
        if (await vm.submit()) onClose();
    };

    return (
        <Modal open={open} handler={onClose} size="md">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    {title}
                </h3>
            </ModalHeader>
            <ModalBody className="h-[32rem] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                    <p className="text-sm text-gray-700 font-medium dark:text-gray-400">Виконуючи цю дію
                        стане
                        неможливо редагувати та змінювати порядок проєктів.</p>
                    <Input error={errors?.outgoingNumber} placeholder="" label="Реєстраційний номер"
                           value={form.outgoingNumber} name="outgoingNumber"
                           onChange={handleInput}/>
                    <DatePicker onChange={handleChangeDate} error={errors?.outgoingDate} value={form.outgoingDate}
                                label="Реєстраційна дата"/>
                    <SingleSelect closeMenuOnSelect options={fixedStates}
                                  isRequired
                                  label="Стан"
                                  id="stateId"
                                  error={errors?.stateId}
                                  value={form.stateId}
                                  onChange={handleChangeSelect('stateId')}/>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
                <LoadingButton variant="gradient" isLoading={complete.isPending} color="green"
                               onClick={() => onSubmit(form)}
                               disabled={complete.isPending}>
                    Зафіксувати
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
};

export default observer(CompleteModal);
