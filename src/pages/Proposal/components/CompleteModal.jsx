import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { CompleteViewModel } from "../viewmodel/ProposalViewModels.js";
import { useProposalProps } from "../viewmodel/useProposalProps.js";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
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
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    {title}
                </Typography>
            </DialogHeader>
            <DialogBody className="h-[32rem] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                    <Typography variant="paragraph" className="font-medium dark:text-slate-400">Виконуючи цю дію
                        стане
                        неможливо редагувати та змінювати порядок проєктів.</Typography>
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
                <LoadingButton variant="gradient" isLoading={complete.isPending} color="green"
                               onClick={() => onSubmit(form)}
                               disabled={complete.isPending}>
                    Зафіксувати
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(CompleteModal);
