import React, { useEffect, useRef } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal.jsx"
import Button from "../Buttons/Button.jsx"

const ConfirmModal = ({ open, onClose, onConfirm, title, message, isLoading = false }) => {
    const confirmBtnRef = useRef(null);
    // Актуальний onConfirm для обробника клавіатури (оновлюється після рендеру, не під час нього)
    const confirmRef = useRef(onConfirm);
    useEffect(() => {
        confirmRef.current = onConfirm;
    });

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
        <Modal
            open={open}
            handler={onClose}
            size="xs"
            overlayProps={{ className: "bg-black/20 backdrop-blur-none" }}>
            <ModalHeader title={title || "Підтвердження"} />
            <ModalBody>
                {message || "Ви впевнені, що хочете виконати цю дію?"}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose} disabled={isLoading}>
                    Скасувати
                </Button>
                <Button
                    ref={confirmBtnRef}
                    onClick={onConfirm}
                    disabled={isLoading}>
                    {isLoading ? 'Видаляю...' : 'Підтвердити'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default React.memo(ConfirmModal);
