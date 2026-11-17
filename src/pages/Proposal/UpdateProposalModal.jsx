import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { ProposalFormViewModel } from "./viewmodel/ProposalViewModels.js";
import { useProposalProps } from "./viewmodel/useProposalProps.js";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography} from "@material-tailwind/react";
import Input from "../../components/fields/Input.jsx";
import DatePicker from "../../components/fields/DatePicker.jsx";
import SingleSelect from "../../components/fields/SingleSelect.jsx";
import LoadingButton from "../../components/Buttons/LoadingButton.jsx";



const UpdateProposalModal = ({selectedId: id, open, onClose}) => {
    const props = useProposalProps();
    const { issuers = [] } = props;
    const vm = useViewModel((deps) => new ProposalFormViewModel({ ...deps, id, props }));
    const { form, errors } = vm;
    const { isLoading, states } = vm;
    const handleChangeDate = vm.changeDate;
    const handleInput = vm.changeInput;
    const handleChangeSelect = vm.changeSelect;
    const onSubmit = async () => {
        if (await vm.submit()) onClose();
    };
    const update = vm.saveCmd;

    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Оновити подання
                </Typography>
            </DialogHeader>
            <DialogBody className="h-[32rem] relative overflow-y-auto">
                {
                    isLoading && <div
                        className="bg-gray-950/20 absolute top-0 left-0 w-full h-full z-[999] flex justify-center items-center">
                        <Spinner className="h-12 w-12"/>
                    </div>
                }
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
                    <SingleSelect closeMenuOnSelect options={states}
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

            </DialogBody>
            <DialogFooter>
                <Button
                    variant="text"
                    color="red"
                    onClick={onClose}
                    className="mr-1"
                >
                    <span>Закрити</span>
                </Button>
                <LoadingButton isLoading={update.isPending} variant="gradient" color="green" onClick={onSubmit}
                        disabled={update.isPending || isLoading}>
                    Оновити
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(UpdateProposalModal);
