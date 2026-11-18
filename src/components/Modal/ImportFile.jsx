import { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal.jsx"
import Button from "../Buttons/Button.jsx"

import {useRef, useState} from "react";
import LoadingButton from "../Buttons/LoadingButton.jsx";

const ImportFile = ({
    open,
    onClose,
    accept = '',
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
        <Modal open={open} size="xs" handler={onClose}>
            <ModalHeader>Імпорт файлу</ModalHeader>
            <ModalBody>
                {extraContent}
                <input ref={fileInput} type="file" onChange={handleFileInput}
                       accept={accept}
                       autoFocus={false}
                       className="w-full bg-white text-gray-700 border-gray-200 rounded-md px-3 py-2 transition hover:border-blue-300 shadow-sm focus:shadow dark:bg-neutral-800 dark:text-gray-300"
                />
                <p className="ml-1 text-sm font-medium dark:text-gray-400">{formatText}</p>
                <p className="ml-1 text-sm font-medium text-red-500">{error}</p>
            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
                <LoadingButton isLoading={isLoading} color="green" onClick={onSubmit}
                        disabled={!file || isLoading}>
                    {submitText}
                </LoadingButton>
            </ModalFooter>
        </Modal>);
};

export default ImportFile;
