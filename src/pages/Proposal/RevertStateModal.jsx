import {usePage} from "@inertiajs/react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import React, {useMemo, useState} from "react";
import toast from "react-hot-toast";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import SingleSelect from "../../Components/fields/SingleSelect.jsx";
import LoadingButton from "../../Components/Buttons/LoadingButton.jsx";


const RevertStateModal = ({open = false, selectedId: id, onClose}) => {
    const {auth, token, proposalState = []} = usePage().props;
    const queryClient = useQueryClient();
    const [errors, setErrors] = useState(null);
    const [form, setForm] = useState({
        state: null
    });

    const revertState = useMutation({
        mutationFn: async (body) => {
            const response = await axios.patch(`/api/proposal/new/${id}/revert-state`,
                body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        "X-CSRF-Token": token,
                        "userId": auth.user.id,
                    }
                }
            );
            return response.data;
        },
        onSuccess: async () => {
            toast.success("Стан змінено успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            revertState.reset();
            setForm({
                state: null
            });
            onClose();
        },
        onError: error => {
            if (error?.response?.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success) {
                queryClient.invalidateQueries(['proposal-show', id]);
                queryClient.invalidateQueries(['proposal']);
            }
        },
    })

    const onSubmit = () => {
        revertState.mutate({stateId: form.state?.id});
    }

    const options = useMemo(() => {
        return proposalState.filter(item => !item.isFixed)
    }, [proposalState])

    return (
        <Dialog open={open} handler={onClose} size="xs">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Зняти зафіксований стан
                </Typography>
            </DialogHeader>
            <DialogBody className="h-[16rem] relative overflow-y-auto">
                <SingleSelect closeMenuOnSelect error={errors?.stateId}
                              info="Всі прив'язані проєкти стануть доступними для редагування, а також можливість змінювати зв'язок з
                    пакетами. Якщо указ прив'язаний то він залишаєтсья незмінним."

                              onChange={(option)=> setForm({state: option})} options={options} value={form.state} label="Оберіть стан"/>
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
                <LoadingButton isLoading={revertState.isPending} variant="gradient" color="green" onClick={onSubmit}
                        disabled={revertState.isPending}>
                    Застосувати
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default RevertStateModal;
