import { observer } from "mobx-react-lite";
import { Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import { LabeledInput, LabeledTextarea } from "../../../components/fields/LabeledField.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { BirthdayFormViewModel } from "../viewmodel/BirthdayViewModels.js";

/** Новий запис дня народження. Монтується лише відкритою. */
const BirthdayFormModal = ({ onClose, onCreated }) => {
    const vm = useViewModel((deps) => new BirthdayFormViewModel({ ...deps, onDone: onClose, onCreated }));

    return (
        <Dialog data-i-doc="modal:handbook-birthday-create" open handler={onClose} size="sm">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">Новий запис</Typography>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
                <LabeledInput
                    autoFocus
                    label="Ім'я"
                    type="text"
                    value={vm.name}
                    onChange={(e) => vm.setName(e.target.value)}
                    placeholder="Прізвище Ім'я…"
                />
                <LabeledInput
                    label="Дата народження"
                    type="date"
                    value={vm.dateOfBirth}
                    onChange={(e) => vm.setDateOfBirth(e.target.value)}
                />
                <LabeledTextarea
                    label="Примітка (необов'язково)"
                    rows={3}
                    value={vm.note}
                    onChange={(e) => vm.setNote(e.target.value)}
                />
                {vm.canDefault &&
                    <label className="flex w-fit cursor-pointer items-center gap-2">
                        <Checkbox checked={vm.isDefault} onChange={(e) => vm.setIsDefault(e.target.checked)} className="dark:border-slate-600"/>
                        <span className="text-sm text-slate-700 dark:text-slate-300">Додати у спільний список (видно всім)</span>
                    </label>
                }
            </DialogBody>
            <DialogFooter className="gap-x-2">
                <button type="button" onClick={onClose}
                        className="rounded px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                    Скасувати
                </button>
                <LoadingButton isLoading={vm.cmd.create.isPending} disabled={!vm.isValid || vm.cmd.create.isPending}
                               color="green" onClick={vm.submit}>
                    Додати
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(BirthdayFormModal);
