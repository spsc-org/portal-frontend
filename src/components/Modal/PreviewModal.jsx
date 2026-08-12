import {Button, Dialog, DialogBody, DialogFooter} from "@material-tailwind/react";

const PreviewModal = ({open, onClose, source = undefined}) => {
    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogBody className="h-fit max-h-[calc(100vh-150px)] overflow-y-auto p-0">
                <img
                    className="h-fit  w-full rounded-lg object-contain object-center shadow-xl shadow-blue-gray-900/50"
                    src={source}
                    alt="preview"
                />
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
            </DialogFooter>
        </Dialog>
    );
};

export default PreviewModal;
