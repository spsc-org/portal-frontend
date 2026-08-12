import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import React, {useRef, useState} from "react";
import LoadingButton from "../Buttons/LoadingButton.jsx";

const ImportFile = ({
    open,
    onClose,
    accept = '',
    api = '',
    submitText = 'Імпортувати',
    formatText = '',
    handleSubmit,
    isLoading = false,
    extraContent = null
}) => {
    const [file, setFile] = useState(null);
    const fileInput = useRef(null);
    const [error, setError] = useState(null);
    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!accept) {
            setError(null);
            return setFile(file);
        }
        const types = accept.split(",").map(item => item.trim());
        if (types.includes(file.type)) {
            setError(null);
            return setFile(file);
        } else {
            setError("Невідповідний формат")
        }
    }


    const onSubmit = () => {
        handleSubmit(file)
    }


    return (
        <Dialog open={open} size="xs" handler={onClose}>
            <DialogHeader
                className="dark:text-gray-200">Імпорт файлу</DialogHeader>
            <DialogBody>
                {extraContent}
                <input ref={fileInput} type="file" onChange={handleFileInput}
                       accept={accept}
                       autoFocus={false}
                       className="w-full bg-white text-slate-700 border-slate-200 rounded-md px-3 py-2 transition hover:border-blue-300 shadow-sm focus:shadow dark:bg-gray-900 dark:text-gray-300"
                />
                <p className="ml-1 text-sm font-medium dark:text-slate-400">{formatText}</p>
                <p className="ml-1 text-sm font-medium text-red-500">{error}</p>
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
                <LoadingButton isLoading={isLoading} color="green" onClick={onSubmit}
                        disabled={!Boolean(file) || isLoading}>
                    {submitText}
                </LoadingButton>
            </DialogFooter>
        </Dialog>);
};

export default ImportFile;
