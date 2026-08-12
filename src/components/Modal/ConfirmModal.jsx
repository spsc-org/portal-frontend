import React, { useEffect, useRef } from "react";
import {
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
} from "@material-tailwind/react";

const ConfirmModal = ({ open, onClose, onConfirm, title, message, isLoading = false }) => {
    const confirmBtnRef = useRef(null);
    const confirmRef = useRef(onConfirm);
    confirmRef.current = onConfirm;

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            confirmBtnRef.current?.focus();
        }, 100);

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                confirmRef.current();
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timer);
        };
    }, [open, onClose]);

    return (
        <Dialog
            open={open}
            handler={onClose}
            size="xs"
            className="dark:bg-slate-900 border dark:border-slate-800"
            overlayProps={{ className: "bg-black/20 backdrop-blur-none" }}
        >
            <DialogHeader className="dark:text-white">
                <Typography variant="h5">{title || "Підтвердження"}</Typography>
            </DialogHeader>
            <DialogBody className="dark:text-gray-400 font-medium">
                {message || "Ви впевнені, що хочете виконати цю дію?"}
            </DialogBody>
            <DialogFooter className="gap-2">
                <Button variant="text" color="red" onClick={onClose} disabled={isLoading}>
                    Скасувати
                </Button>
                <Button
                    ref={confirmBtnRef}
                    variant="gradient"
                    color="green"
                    onClick={onConfirm}
                    className="outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isLoading}
                >
                    {isLoading ? 'Видаляю...' : 'Підтвердити'}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default React.memo(ConfirmModal);
