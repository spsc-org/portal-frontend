import React, {useState} from "react";
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
import LoadingButton from "../../../Components/Buttons/LoadingButton.jsx";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {usePage} from "@inertiajs/react";

const GenerateDossiersModal = ({open = false, onClose, ...dialogProps}) => {
    const {auth, token} = usePage().props;

    const [form, setForm] = useState({
        includePhoto: true,
        photoMode: 'first',
        includeNotes: false,
        outputFormat: 'docx',
    });

    const {mutate: generate, isPending} = useMutation({
        mutationFn: async ({actionId, typeId, id, form}) => {
            const response = await axios.post(`/api/proposal/${id}/generate-dossiers`, {
                actionTypeId: actionId,
                subjectTypeId: typeId,
                includePhoto: form.includePhoto,
                includeNotes: form.includeNotes,
                outputFormat: form.outputFormat,
                photoMode: form.photoMode,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onSuccess: (data) => {
            const filePath = data?.data?.filePath;
            if (!filePath) {
                return;
            }
            const filename = filePath.split(/[\\/]/).pop();
            const url = `/api/project/download-dossier/${filename}`;
            if (filename.endsWith('.html')) {
                window.open(url, '_blank');
            } else {
                window.location.href = url;
            }
            toast.success(data?.message ?? 'Досьє згенеровано');
            onClose();
        },
        onError: (error) => {
            const message = error?.response?.data?.message ?? 'Виникла помилка генерації досьє';
            toast.error(message);
        }
    });

    const handleGenerate = () => {
        if (isPending) {
            return;
        }
        generate({...dialogProps, form});
    }

    const toggleSwitch = ({target}) => {
        setForm(prevState => ({...prevState, [target.name]: target.checked}));
    }

    const setOption = (key, value) => () => {
        setForm(prevState => ({...prevState, [key]: value}));
    }

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

export default GenerateDossiersModal;
