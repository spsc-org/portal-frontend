import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { GenerateDossiersViewModel } from "../viewmodel/ProposalViewModels.js";
import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Radio,
    Switch,
    Typography
} from "@material-tailwind/react";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";

const GenerateDossiersModal = ({open = false, onClose, ...dialogProps}) => {
    const vm = useViewModel((deps) => new GenerateDossiersViewModel(deps));
    const { form, isPending } = vm;
    const handleGenerate = () => vm.generate(dialogProps, onClose);
    const toggleSwitch = ({target}) => vm.setForm(prev => ({...prev, [target.name]: target.checked}));
    const setOption = (key, value) => () => vm.setForm(prev => ({...prev, [key]: value}));

    return (
        <Dialog data-i-doc="modal:proposal-view-generate-dossiers" open={open} handler={onClose} size="sm">
            <DialogHeader className="dark:text-gray-200">
                <span>Згенерувати досьє</span>
            </DialogHeader>
            <DialogBody className="overflow-y-auto max-h-[calc(100vh-200px)]">
                <Typography variant="small" className="dark:text-slate-400 mb-2">
                    Генерація досьє для готових проєктів подання (зі станами «Готово» та «Є питання»).
                </Typography>
                <div className="flex flex-col space-y-4">
                    <Switch ripple={false}
                            color="green"
                            label="Виводити фото"
                            name="includePhoto"
                            checked={form.includePhoto}
                            onChange={toggleSwitch}/>
                    {form.includePhoto && (
                        <div className="ml-14 flex gap-4">
                            <Radio name="photoMode"
                                   label="Перше фото"
                                   checked={form.photoMode === 'first'}
                                   onChange={setOption('photoMode', 'first')}/>
                            <Radio name="photoMode"
                                   label="Всі фото"
                                   checked={form.photoMode === 'all'}
                                   onChange={setOption('photoMode', 'all')}/>
                        </div>
                    )}
                    <Switch ripple={false}
                            color="green"
                            label="Виводити примітки"
                            name="includeNotes"
                            checked={form.includeNotes}
                            onChange={toggleSwitch}/>
                    <div className="flex flex-col gap-2">
                        <Typography variant="small" className="font-medium dark:text-slate-300">
                            Формат виводу
                        </Typography>
                        <div className="flex gap-4">
                            <Radio name="outputFormat"
                                   label="Word (.docx)"
                                   checked={form.outputFormat === 'docx'}
                                   onChange={setOption('outputFormat', 'docx')}/>
                            <Radio name="outputFormat"
                                   label="HTML (відкрити у браузері)"
                                   checked={form.outputFormat === 'html'}
                                   onChange={setOption('outputFormat', 'html')}/>
                        </div>
                    </div>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button
                    variant="text"
                    color="red"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
                <LoadingButton
                    isLoading={isPending}
                    color="green"
                    onClick={handleGenerate}>
                    <span>Згенерувати</span>
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(GenerateDossiersModal);
