import React, {useState} from "react";
import {Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import {LabeledInput, LabeledTextarea} from "../../../../Components/fields/LabeledField.jsx";
import PhoneNumbersEditor from "../../shared/ui/PhoneNumbersEditor.jsx";
import {useCreatePhoneMutation} from "../../entities/phone/queries.js";

const CreatePhoneModal = ({open, onClose, onCreated}) => {
    const [name, setName] = useState("");
    const [phones, setPhones] = useState([{phone: "", note: ""}]);
    const [department, setDepartment] = useState("");
    const [note, setNote] = useState("");

    const createMutation = useCreatePhoneMutation();

    const resetForm = () => {
        setName("");
        setPhones([{phone: "", note: ""}]);
        setDepartment("");
        setNote("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validPhones = phones.filter((p) => p.phone.trim().length > 0);
    const isValid = name.trim().length > 0 && validPhones.length > 0;

    const handleSubmit = () => {
        if (!isValid) return;
        createMutation.mutate({
            name: name.trim(),
            phones: validPhones.map((p) => ({phone: p.phone.trim(), note: p.note?.trim() || undefined})),
            department: department.trim(),
            note: note.trim(),
        }, {
            onSuccess: (entry) => {
                onCreated?.(entry?.id);
                handleClose();
            },
        });
    };

    return (
        <Dialog data-i-doc="modal:handbook-phone-create" open={open} handler={handleClose} size="sm">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">Новий запис</Typography>
            </DialogHeader>
            <DialogBody className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
                <LabeledInput
                    autoFocus
                    label="Ім'я"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Прізвище Ім'я…"
                />
                <PhoneNumbersEditor value={phones} onChange={setPhones}/>
                <LabeledInput
                    label="Підрозділ (необов'язково)"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                />
                <LabeledTextarea
                    label="Примітка до особи (необов'язково)"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
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

export default CreatePhoneModal;
