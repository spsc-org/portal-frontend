import React, {useEffect, useMemo, useState} from "react";
import {format} from "date-fns";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import Input from "../../../Components/fields/Input.jsx";
import DatePicker from "../../../Components/fields/DatePicker.jsx";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {usePage} from "@inertiajs/react";
import toast from "react-hot-toast";
import SingleSelect from "../../../Components/fields/SingleSelect.jsx";
import LoadingButton from "../../../Components/Buttons/LoadingButton.jsx";

const initialState = {
    outgoingDate: undefined,
    outgoingNumber: '',
    stateId: '',
}

const CompleteModal = ({open, onClose, ...props}) => {
    const queryClient = useQueryClient();

    const {id, auth, token, proposalState = []} = usePage().props;
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState(null);

    const fixedStates = useMemo(() => {
        return proposalState.length ? proposalState.filter(state => state.isFixed) : [];
    }, [proposalState])

    useEffect(() => {
        if (open) {
            setForm({
                outgoingNumber: props?.outgoingNumber || initialState?.outgoingNumber,
                outgoingDate: props?.outgoingDate || initialState?.outgoingDate,
            });
        }
    }, [])

    const title = useMemo(() => {
        if (props?.isEdit) {
            return "Внесення змін"
        } else {
            return "Зафіксувати стан"
        }
    }, [props])

    const complete = useMutation({
        mutationFn: async (body) => {
            const method = props?.isEdit ? 'patch' : 'post';
            const response = await axios[method](`/api/proposal/new/${id}/complete`,
                body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        "X-CSRF-Token": token,
                        "userId": auth.user.id,
                    }
                });
            return response.data;
        },
        onSuccess: async () => {
            toast.success("Стан підтверджено успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            onClose();
        },
        onError: ({response}) => {
            if (response?.data?.message)
                toast.error(response?.data?.message, {
                    style: {
                        background: 'dark:dark:bg-slate-800',
                        color: 'text-slate-400',
                    },
                });
            if (response.status === 422) {
                setErrors(response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success) {
                queryClient.invalidateQueries(['proposal-show', 'proposal-show-lined-projects', id]);
            }
        },
    });


    const handleChangeDate = (date) => {
        if (date) {
            const str = format(date, "yyyy-MM-dd") || "";
            setForm(prevState => ({...prevState, outgoingDate: str}));
            setErrors({...errors, outgoingDate: ''});
        } else {
            setForm(prevState => ({...prevState, outgoingDate: undefined}));
        }
    }
    const handleInput = ({target: {name, value}}) => {
        setErrors(prev => ({...prev, [name]: ""}));
        setForm(prevState => ({...prevState, [name]: value}));
    }

    const onSubmit = () => {
        setErrors(null);
        const body = {...form, stateId: form?.stateId?.id};
        complete.mutate(body);
    }

    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: selected}));
    }

    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    {title}
                </Typography>
            </DialogHeader>
            <DialogBody className="h-[32rem] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                    <Typography variant="paragraph" className="font-medium dark:text-slate-400">Виконуючи цю дію
                        стане
                        неможливо редагувати та змінювати порядок проєктів.</Typography>
                    <Input error={errors?.outgoingNumber} placeholder="" label="Реєстраційний номер"
                           value={form.outgoingNumber} name="outgoingNumber"
                           onChange={handleInput}/>
                    <DatePicker onChange={handleChangeDate} error={errors?.outgoingDate} value={form.outgoingDate}
                                label="Реєстраційна дата"/>
                    <SingleSelect closeMenuOnSelect options={fixedStates}
                                  isRequired
                                  label="Стан"
                                  id="stateId"
                                  error={errors?.stateId}
                                  value={form.stateId}
                                  onChange={handleChangeSelect('stateId')}/>
                </div>
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
                <LoadingButton variant="gradient" isLoading={complete.isPending} color="green"
                               onClick={() => onSubmit(form)}
                               disabled={complete.isPending}>
                    Зафіксувати
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default CompleteModal;
