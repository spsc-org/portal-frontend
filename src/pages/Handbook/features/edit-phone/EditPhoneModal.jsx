import React, {useEffect, useState} from "react";
import {Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import {LabeledInput, LabeledTextarea} from "../../../../Components/fields/LabeledField.jsx";
import PhoneNumbersEditor from "../../shared/ui/PhoneNumbersEditor.jsx";
import {useUpdatePhoneMutation} from "../../entities/phone/queries.js";

const EditPhoneModal = ({open, onClose, entry}) => {
    const [name, setName] = useState("");
    const [phones, setPhones] = useState([{phone: "", note: ""}]);
    const [department, setDepartment] = useState("");
    const [note, setNote] = useState("");

    const updateMutation = useUpdatePhoneMutation(entry?.id);

    useEffect(() => {
        if (open && entry) {
            setName(entry.name || "");
            setPhones(entry.phones?.length ? entry.phones.map((p) => ({phone: p.phone, note: p.note})) : [{phone: "", note: ""}]);
            setDepartment(entry.department || "");
            setNote(entry.note || "");
        }
    }, [open, entry]);

    const validPhones = phones.filter((p) => p.phone.trim().length > 0);
    const isValid = name.trim().length > 0 && validPhones.length > 0;

    const handleSubmit = () => {
        if (!isValid) return;
        updateMutation.mutate({
            name: name.trim(),
            phones: validPhones.map((p) => ({phone: p.phone.trim(), note: p.note?.trim() || undefined})),
            department: department.trim(),
            note: note.trim(),
        }, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog data-i-doc="modal:handbook-phone-edit" open={open} handler={onClose} size="sm">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">Редагувати запис</Typography>
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
                <button type="button" onClick={onClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                <LoadingButton isLoading={updateMutation.isPending} disabled={!isValid || updateMutation.isPending}
                               color="green" onClick={handleSubmit}>
                    Зберегти
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default EditPhoneModal;
