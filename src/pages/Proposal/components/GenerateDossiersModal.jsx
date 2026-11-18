import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { GenerateDossiersViewModel } from "../viewmodel/ProposalViewModels.js";
import { Radio, Switch } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";

const GenerateDossiersModal = ({open = false, onClose, ...dialogProps}) => {
    const vm = useViewModel((deps) => new GenerateDossiersViewModel(deps));
    const { form, isPending } = vm;
    const handleGenerate = () => vm.generate(dialogProps, onClose);
    const toggleSwitch = ({target}) => vm.setForm(prev => ({...prev, [target.name]: target.checked}));
    const setOption = (key, value) => () => vm.setForm(prev => ({...prev, [key]: value}));

    return (
        <Modal data-i-doc="modal:proposal-view-generate-dossiers" open={open} handler={onClose} size="sm">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase"><span>Згенерувати досьє</span></h3>
            </ModalHeader>
            <ModalBody className="overflow-y-auto max-h-[calc(100vh-200px)]">
                <div className="text-sm text-gray-700 dark:text-gray-400 mb-2">
                    Генерація досьє для готових проєктів подання (зі станами «Готово» та «Є питання»).
                </div>
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
                        <div className="text-sm text-gray-700 font-medium dark:text-gray-300">
                            Формат виводу
                        </div>
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
            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
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
            </ModalFooter>
        </Modal>
    );
};

export default observer(GenerateDossiersModal);
