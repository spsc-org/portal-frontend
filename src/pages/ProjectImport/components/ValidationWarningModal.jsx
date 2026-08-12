import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import React from "react";

const ValidationWarningModal = ({open, onClose, onSubmit}) => {
    return (
        <Dialog open={open} size="xs" handler={onClose}>
            <DialogHeader
                className="dark:text-gray-200">Увага!</DialogHeader>
            <DialogBody>
                Неможливо опрацювати через помилки валідації. Переглянути помилки?
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
                <Button variant="gradient" color="green" onClick={onSubmit}>
                    <span>Переглянути</span>
                </Button>
            </DialogFooter>

        </Dialog>
    );
};

export default ValidationWarningModal;
