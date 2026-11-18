import { Modal, ModalBody, ModalFooter } from "./Modal.jsx"
import Button from "../Buttons/Button.jsx"


const PreviewModal = ({open, onClose, source = undefined}) => {
    return (
        <Modal open={open} handler={onClose} size="md">
            <ModalBody className="h-fit max-h-[calc(100vh-150px)] overflow-y-auto p-0">
                <img
                    className="h-fit  w-full rounded-lg object-contain object-center shadow-xl shadow-blue-gray-900/50"
                    src={source}
                    alt="preview"
                />
            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default PreviewModal;
