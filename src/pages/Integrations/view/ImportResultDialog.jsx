import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"

/** onDownload(url) — завантаження файлу результату (ExportViewModel.downloadResult). */
const ImportResultDialog = ({ open, onClose, result, onDownload }) => {
    if (!result) return null;

    const { success, message, details } = result;
    const downloadUrl = details?.download_url;


    const displayDetails = { ...details };
    delete displayDetails.download_url;

    const handleDownload = () => onDownload?.(downloadUrl);

    return (
        <Modal open={open} handler={onClose} size="xl">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    {success ? "Результат операції" : "Помилка"}
                </h3>
            </ModalHeader>
            <ModalBody divider className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{message}</h4>

                {downloadUrl && (
                    <div className="flex justify-center my-4">
                        <Button color="blue" className="flex items-center gap-2" onClick={handleDownload}>
                            <i className="fa-solid fa-download"></i>
                            Скачати файл
                        </Button>
                    </div>
                )}

                {displayDetails && Object.keys(displayDetails).length > 0 && (
                    <div className="p-2 bg-gray-100 dark:bg-neutral-700 rounded-md max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap break-all">
                            {JSON.stringify(displayDetails, null, 2)}
                        </pre>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button
                    variant="filled"
                    color="green"
                    onClick={onClose}>
                    Ок
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ImportResultDialog;
