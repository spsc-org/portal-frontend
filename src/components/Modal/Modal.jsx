import React from "react";
import {Dialog, DialogBody, DialogHeader} from "@material-tailwind/react";

const Modal = ({
                   open,
                   onClose,
                   onSubmit,
                   title = '',
                   children,
                   size = 'md',
                   confirmText = 'Зберегти',
                   cancelText = 'Закрити',
                   disabled,
               }) => {
    return (
        <Dialog open={open} handler={onClose}>
            <DialogHeader>{title}</DialogHeader>
            <DialogBody>

            </DialogBody>

        </Dialog>
    );
};

export default Modal;
