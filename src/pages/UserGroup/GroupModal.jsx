
import React, {useMemo, useState} from "react";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import Input from "@/Components/fields/Input.jsx";
import MultiSelect from "@/Components/fields/MultiSelect.jsx";
import {
    useCreateUserGroupMutation,
    useSyncUserGroupMembersMutation,
    useUpdateUserGroupMutation,
    useUserGroupOptionsQuery,
} from "@/entities/userGroup/queries.js";

const GroupModal = ({open, onClose, group}) => {
    const isEdit = Boolean(group);
    const {data: options} = useUserGroupOptionsQuery();
    const userOptions = options?.users ?? [];

    const [name, setName] = useState(group?.name ?? "");
    const [memberIds, setMemberIds] = useState(() => (group?.members ?? []).map((m) => m.id));
    const [errors, setErrors] = useState(null);

    const createMutation = useCreateUserGroupMutation();
    const updateMutation = useUpdateUserGroupMutation();
    const syncMembersMutation = useSyncUserGroupMembersMutation();

    const isSaving = createMutation.isPending || updateMutation.isPending || syncMembersMutation.isPending;

    const selectedMembers = useMemo(
        () => userOptions.filter((u) => memberIds.includes(u.id)),
        [userOptions, memberIds],
    );

    const handleSubmit = async () => {
        setErrors(null);
        try {
            if (isEdit) {
                if (name !== group.name) {
                    await updateMutation.mutateAsync({id: group.id, name});
                }
                await syncMembersMutation.mutateAsync({id: group.id, memberIds});
            } else {
                await createMutation.mutateAsync({name, memberIds});
            }
            onClose();
        } catch (error) {
            if (error?.response?.status === 422) {
                setErrors(error.response.data?.errors ?? null);
            }
        }
    };

    return (
        <Dialog data-i-doc="modal:user-groups-group-modal" open={open} size="sm" handler={onClose} className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <DialogHeader className="border-b border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-100">
                {isEdit ? "Редагувати групу" : "Нова група"}
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4 bg-slate-50/80 dark:bg-slate-900">
                <Input
                    label="Назва групи"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors?.name}
                    isRequired
                />
                <MultiSelect
                    label="Учасники"
                    id="members"
                    options={userOptions}
                    value={selectedMembers}
                    onChange={(selected) => setMemberIds((selected ?? []).map((u) => u.id))}
                    error={errors?.member_ids}
                    placeholder="Оберіть учасників"
                />
            </DialogBody>
            <DialogFooter className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <Button variant="text" color="red" onClick={onClose} className="mr-1" disabled={isSaving}>
                    Закрити
                </Button>
                <Button variant="gradient" color="green" onClick={handleSubmit} disabled={isSaving || !name.trim()}>
                    {isSaving ? "Зберігаю..." : "Зберегти"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default GroupModal;
