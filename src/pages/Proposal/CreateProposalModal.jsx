import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { ProposalFormViewModel } from "./viewmodel/ProposalViewModels.js";
import { useProposalProps } from "./viewmodel/useProposalProps.js";
import { Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"
import SingleSelect from "../../components/fields/SingleSelect.jsx";
import Input from "../../components/fields/Input.jsx";
import DatePicker from "../../components/fields/DatePicker.jsx";
import LoadingButton from "../../components/Buttons/LoadingButton.jsx";


const CreateProposalModal = ({open, onClose}) => {
    const props = useProposalProps();
    const { issuers = [], proposalState = [] } = props;
    const vm = useViewModel((deps) => new ProposalFormViewModel({ ...deps, props }));
    const { form, errors } = vm;
    const handleChangeDate = vm.changeDate;
    const handleInput = vm.changeInput;
    const handleChangeSelect = vm.changeSelect;
    const onSubmit = async () => {
        if (await vm.submit()) onClose();
    };
    const create = vm.saveCmd;

    return (
        <Modal open={open} handler={onClose} size="md" dismiss={{escapeKey: false}}>
            <ModalHeader>
                <Typography variant="h5" className="dark:text-gray-200">
                    Створити подання
                </Typography>
            </ModalHeader>
            <ModalBody className="h-[32rem] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                    <Input error={errors?.caption} placeholder="" label="Назва"
                           value={form.caption} name="caption"
                           onChange={handleInput}/>
                    <Input error={errors?.outgoingNumber} placeholder="" label="Реєстраційний номер"
                           value={form.outgoingNumber} name="outgoingNumber"
                           onChange={handleInput}/>
                    <DatePicker onChange={handleChangeDate} error={errors?.outgoingDate} value={form.outgoingDate}
                                label="Реєстраційна дата"/>
                    <SingleSelect closeMenuOnSelect options={issuers}
                                  label="Суб'єкт подання"
                                  id="issuerId"
                                  error={errors?.issuerId}
                                  value={form.issuerId}
                                  onChange={handleChangeSelect('issuerId')}/>
                    <SingleSelect closeMenuOnSelect options={proposalState}
                                  label="Стан"
                                  id="stateId"
                                  error={errors?.stateId}
                                  value={form.stateId}
                                  onChange={handleChangeSelect('stateId')}/>
                </div>
                <Input tag="textarea" error={errors?.description} placeholder="" label="Опис"
                       value={form.description} name="description"
                       onChange={handleInput}/>
                <Input tag="textarea" error={errors?.comments} placeholder="" label="Коментар"
                       value={form.comments} name="comments"
                       onChange={handleInput}/>

            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
                <LoadingButton isLoading={create.isPending} variant="gradient" color="green" onClick={onSubmit}
                        disabled={create.isPending}>
                    Створити
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
};

export default observer(CreateProposalModal);
