import React, {useEffect, useState} from "react";
import {Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import {LabeledInput, LabeledTextarea} from "../../../../Components/fields/LabeledField.jsx";
import {useCreateResponsibleFunctionMutation, useUpdateResponsibleFunctionMutation} from "../../entities/responsible/queries.js";

// Створення/редагування функції (довідник) — той самий каркас Dialog, що й
// CreateDeveloperPostModal/AnnouncementModal, лише два поля.
const ResponsibleFunctionModal = ({open, onClose, func = null}) => {
    const isEditing = Boolean(func);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const createMutation = useCreateResponsibleFunctionMutation();
    const updateMutation = useUpdateResponsibleFunctionMutation();
    const isPending = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (open) {
            setName(func?.name || "");
            setDescription(func?.description || "");
        }
    }, [open, func]);

    const handleSave = () => {
        if (!name.trim()) return;

        const onSuccess = () => onClose();

        if (isEditing) {
            updateMutation.mutate({functionId: func.id, name, description}, {onSuccess});
        } else {
            createMutation.mutate({name, description}, {onSuccess});
        }
    };

    return (
        <Dialog data-i-doc="modal:staff-responsible-function" open={open} handler={onClose} size="sm">
            <DialogHeader>{isEditing ? "Редагувати функцію" : "Нова функція"}</DialogHeader>
            <DialogBody className="flex flex-col gap-3">
                <LabeledInput
                    label="Назва"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Напр. Відповідальний за пожежну безпеку"
                    autoFocus
                />
                <LabeledTextarea
                    label="Опис (необов'язково)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </DialogBody>
            <DialogFooter className="gap-2">
                <LoadingButton variant="outlined" color="blue-gray" onClick={onClose} disabled={isPending}>
                    Скасувати
                </LoadingButton>
                <LoadingButton color="blue" onClick={handleSave} isLoading={isPending} disabled={!name.trim()}>
                    Зберегти
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default ResponsibleFunctionModal;
