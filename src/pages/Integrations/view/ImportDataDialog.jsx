import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { Alert, Input, Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import ImportResultDetails from "./ImportResultDetails.jsx";

/** page — DatasetsViewModel (створює FileImportViewModel під обраний датасет). */
const ImportDataDialog = ({ open, onClose, dataset, page }) => {
    const vm = useViewModel(({ scope }) => page.createImport(scope));
    const { file, error, requiresFile, importMutation } = vm;
    const handleFileChange = (e) => vm.setFile(e.target.files);
    const handleSubmit = () => vm.confirm();
    const handleClose = onClose;
    const isSettled = vm.isImportSettled;

    const renderBody = () => {
        if (importMutation.isPending) {
            return (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <Spinner className="h-12 w-12" />
                    <p className="text-sm text-gray-700 dark:text-gray-200">Йде імпорт, будь ласка, зачекайте…</p>
                </div>
            );
        }

        if (isSettled) {
            const result = importMutation.isSuccess
                ? importMutation.data
                : importMutation.error?.response?.data;
            return <ImportResultDetails result={result} />;
        }

        return (
            <>
                {error && <Alert color="red" className="mb-4">{error}</Alert>}
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Імпорт для: <span className="font-bold">{dataset.caption || dataset.name}</span>
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    Очікуваний формат файлу:{' '}
                    <span className="font-bold text-blue-500">{dataset.format.toUpperCase()}</span>.
                </p>

                {requiresFile ? (
                    <Input
                        type="file"
                        label="Файл для імпорту"
                        onChange={handleFileChange}
                        className="dark:text-gray-200"
                        labelProps={{
                            className: "dark:!text-gray-400 dark:peer-focus:!text-blue-300",
                        }}
                        error={!!error}
                    />
                ) : (
                    <Alert color="blue" className="mt-4 flex items-center gap-2">
                        <i className="fa-solid fa-database"></i>
                        <span>Цей датасет імпортується з внутрішньої бази даних. Файл не потрібен.</span>
                    </Alert>
                )}
            </>
        );
    };

    return (
        <Modal open={open} handler={handleClose} size="md">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    Імпорт консолідованих даних
                </h3>
            </ModalHeader>

            <ModalBody>{renderBody()}</ModalBody>

            <ModalFooter>
                <Button color="secondary" onClick={handleClose}>
                    Закрити
                </Button>
                {!isSettled && (
                    <LoadingButton
                        variant="gradient"
                        color="green"
                        onClick={handleSubmit}
                        isLoading={importMutation.isPending}
                        disabled={(requiresFile && !file) || importMutation.isPending}>
                        {requiresFile ? 'Імпортувати файл' : 'Запустити синхронізацію'}
                    </LoadingButton>
                )}
            </ModalFooter>
        </Modal>
    );
};

export default observer(ImportDataDialog);
