import {usePage} from "@inertiajs/react";
import React, {useEffect, useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography} from "@material-tailwind/react";
import Input from "../../Components/fields/Input.jsx";
import DatePicker from "../../Components/fields/DatePicker.jsx";
import SingleSelect from "../../Components/fields/SingleSelect.jsx";
import {format} from "date-fns";
import LoadingButton from "../../Components/Buttons/LoadingButton.jsx";


const initialState = {
    issuerId: '',
    stateId: '',
    caption: '',
    description: '',
    outgoingDate: undefined,
    outgoingNumber: '',
    createdUserId: '',
    comments: '',
}

const UpdateProposalModal = ({selectedId: id, open, onClose}) => {
    const {auth, token, issuers = [], proposalState = [], decrees = []} = usePage().props;
    const queryClient = useQueryClient();
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState(null);

    const {data, isLoading} = useQuery({
        queryKey: ['proposal-update', id],
        queryFn: async () => {
            const response = await axios.get(`/api/proposal/new/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        }
    })

    const states = useMemo(() => {
        if (!data?.data?.stateId) {
            return proposalState;
        } else {
            const isCurrFixed = proposalState.find(item => item.id === data.data.stateId)?.isFixed;
            return isCurrFixed ? proposalState.filter(item => item.isFixed) : proposalState.filter(item => !item.isFixed);
        }
    }, [data?.data?.stateId, proposalState]);


    const update = useMutation({
        mutationFn: async (body) => {
            const response = await axios.patch(`/api/proposal/new/${id}/update`,
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
            toast.success("Оновлено успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            update.reset();
            setForm(initialState);
            onClose();
        },
        onError: ({response}) => {
            if (response.status === 422) {
                setErrors(response?.data?.unvalidFields);
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
        update.mutate({
            ...form,
            stateId: form.stateId?.id,
            issuerId: form?.issuerId?.id,
        });
    }

    useEffect(() => {
        if (data?.data) {
            const result = {
                caption: data.data.caption,
                description: data.data.description,
                outgoingNumber: data.data.outgoingNumber,
                comments: data.data.comments,
                issuerId: issuers.find(i => i.id === data.data.issuerId),
                stateId: proposalState.find(s => s.id === data.data.stateId),
                outgoingDate: data.data.outgoingDate ? format(data.data.outgoingDate, "yyyy-MM-dd") : ""
            };

            setForm(prevForm => {
                const isChanged = Object.keys(result).some(
                    key => JSON.stringify(prevForm[key]) !== JSON.stringify(result[key])
                );
                return isChanged ? result : prevForm;
            });
        }
    }, [data?.data, issuers, proposalState]);

    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: selected}));
    }

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

    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Оновити подання
                </Typography>
            </DialogHeader>
            <DialogBody className="h-[32rem] relative overflow-y-auto">
                {
                    isLoading && <div
                        className="bg-gray-950/20 absolute top-0 left-0 w-full h-full z-[999] flex justify-center items-center">
                        <Spinner className="h-12 w-12"/>
                    </div>
                }
                <div className="grid grid-cols-2 gap-2">
                    <Input error={errors?.caption} placeholder="" label="Назва"
                           value={form.caption} name="caption"
                           onChange={handleInput}/>
                    <Input error={errors?.outgoingNumber} placeholder="" label="Реєстраційний номер"
                           value={form.outgoingNumber} name="outgoingNumber"
                           onChange={handleInput}/>
                    <DatePicker onChange={handleChangeDate} error={errors?.outgoingDate} value={form.outgoingDate}
                                label="Реєстраційна дата"/>
                    <SingleSelect closeMenuOnSelect options={issuers}
                                  label="Суб'єкт подання"
                                  id="issuerId"
                                  error={errors?.issuerId}
                                  value={form.issuerId}
                                  onChange={handleChangeSelect('issuerId')}/>
                    <SingleSelect closeMenuOnSelect options={states}
                                  label="Стан"
                                  id="stateId"
                                  error={errors?.stateId}
                                  value={form.stateId}
                                  onChange={handleChangeSelect('stateId')}/>
                </div>
                <Input tag="textarea" error={errors?.description} placeholder="" label="Опис"
                       value={form.description} name="description"
                       onChange={handleInput}/>
                <Input tag="textarea" error={errors?.comments} placeholder="" label="Коментар"
                       value={form.comments} name="comments"
                       onChange={handleInput}/>

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
                <LoadingButton isLoading={update.isPending} variant="gradient" color="green" onClick={onSubmit}
                        disabled={update.isPending || isLoading}>
                    Оновити
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default UpdateProposalModal;
