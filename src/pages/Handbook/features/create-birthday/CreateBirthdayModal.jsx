import React, {useState} from "react";
import {Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import {LabeledInput, LabeledTextarea} from "../../../../Components/fields/LabeledField.jsx";
import {useCreateBirthdayMutation} from "../../entities/birthday/queries.js";
import {canManageDefaultBirthdays} from "../../shared/lib/permissions.js";

const CreateBirthdayModal = ({open, onClose, onCreated, auth}) => {
    const [name, setName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [note, setNote] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    const canDefault = canManageDefaultBirthdays(auth);
    const createMutation = useCreateBirthdayMutation();

    const resetForm = () => {
        setName("");
        setDateOfBirth("");
        setNote("");
        setIsDefault(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isValid = name.trim().length > 0 && Boolean(dateOfBirth);

    const handleSubmit = () => {
        if (!isValid) return;
        createMutation.mutate({
            name: name.trim(),
            dateOfBirth,
            note: note.trim(),
            isDefault: canDefault && isDefault,
        }, {
            onSuccess: (entry) => {
                onCreated?.(entry?.id);
                handleClose();
            },
        });
    };

    return (
        <Dialog data-i-doc="modal:handbook-birthday-create" open={open} handler={handleClose} size="sm">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">Новий запис</Typography>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
                <LabeledInput
                    autoFocus
                    label="Ім'я"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Прізвище Ім'я…"
                />
                <LabeledInput
                    label="Дата народження"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                />
                <LabeledTextarea
                    label="Примітка (необов'язково)"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
                {canDefault &&
                    <label className="flex w-fit cursor-pointer items-center gap-2">
                        <Checkbox checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="dark:border-slate-600"/>
                        <span className="text-sm text-slate-700 dark:text-slate-300">Додати у спільний список (видно всім)</span>
                    </label>
                }
            </DialogBody>
            <DialogFooter className="gap-x-2">
                <button type="button" onClick={handleClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                <LoadingButton isLoading={createMutation.isPending} disabled={!isValid || createMutation.isPending}
                               color="green" onClick={handleSubmit}>
                    Додати
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default CreateBirthdayModal;
