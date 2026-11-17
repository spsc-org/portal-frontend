import { observer } from "mobx-react-lite";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import Input from "../../../components/fields/Input.jsx";
import MultiSelect from "../../../components/fields/MultiSelect.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { GroupFormViewModel } from "../viewmodel/GroupFormViewModel.js";

/** Монтується лише коли відкрита — стан форми живе рівно стільки, скільки модалка. */
const GroupModal = ({ group, onClose }) => {
    const vm = useViewModel((deps) => new GroupFormViewModel({ ...deps, group, onDone: onClose }));

    return (
        <Dialog data-i-doc="modal:user-groups-group-modal" open size="sm" handler={onClose} className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <DialogHeader className="border-b border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-100">
                {vm.isEdit ? "Редагувати групу" : "Нова група"}
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4 bg-slate-50/80 dark:bg-slate-900">
                <Input
                    label="Назва групи"
                    name="name"
                    value={vm.name}
                    onChange={(e) => vm.setName(e.target.value)}
                    error={vm.errors?.name}
                    isRequired
                />
                <MultiSelect
                    label="Учасники"
                    id="members"
                    options={vm.userOptions}
                    value={vm.selectedMembers}
                    onChange={vm.setMembers}
                    error={vm.errors?.member_ids}
                    placeholder="Оберіть учасників"
                />
            </DialogBody>
            <DialogFooter className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <Button variant="text" color="red" onClick={onClose} className="mr-1" disabled={vm.isSaving}>
                    Закрити
                </Button>
                <Button variant="gradient" color="green" onClick={vm.submit} disabled={!vm.canSubmit}>
                    {vm.isSaving ? "Зберігаю..." : "Зберегти"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(GroupModal);
