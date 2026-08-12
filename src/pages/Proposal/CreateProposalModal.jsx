import {usePage} from "@inertiajs/react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import React, {useState} from "react";
import toast from "react-hot-toast";
import {format} from "date-fns";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import SingleSelect from "../../Components/fields/SingleSelect.jsx";
import Input from "../../Components/fields/Input.jsx";
import DatePicker from "../../Components/fields/DatePicker.jsx";
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
const CreateProposalModal = ({open, onClose}) => {
    const {auth, token,  issuers = [], proposalState = [], decrees = []} = usePage().props;
    const queryClient = useQueryClient();
    const [form, setForm] = useState({...initialState, stateId: proposalState.find(state=>state.caption === "Проєкт")});
    const [errors, setErrors] = useState(null);


    const create = useMutation({
        mutationFn: async (body) => {
            const response = await axios.post(`/api/proposal/new/create`,
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
            toast.success("Створено успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            create.reset();
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
                queryClient.setQueriesData({queryKey: ['proposal']}, (oldData) => {
                    if (!Array.isArray(oldData?.data)) {
                        return oldData
                    } else {
                        const newData = [{...data.data, isUpdated: true}, ...oldData?.data];
                        return {...oldData, data: newData}
                    }
                });
            }
        },
    })

    const handleChangeDate = (date) => {
        if (date) {
            const str = format(date, "yyyy-MM-dd") || "";
            setForm(prevState => ({...prevState, outgoingDate: str}));
            setErrors({...errors, outgoingDate: ''});
        } else {
            setForm(prevState => ({...prevState, outgoingDate: undefined}));
        }
    }

    const onSubmit = () => {
        create.mutate({
            ...form,
            stateId: form.stateId?.id,
            issuerId: form?.issuerId?.id,
        });
    }

    const handleInput = ({target: {name, value}}) => {
        setErrors(prev => ({...prev, [name]: ""}));
        setForm(prevState => ({...prevState, [name]: value}));
    }

    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: selected}));
    }

    return (
        <Dialog open={open} handler={onClose} size="md" dismiss={{escapeKey: false}}>
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Створити подання
                </Typography>
            </DialogHeader>
            <DialogBody className="h-[32rem] overflow-y-auto">
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
                    <SingleSelect closeMenuOnSelect options={proposalState}
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
                <LoadingButton isLoading={create.isPending} variant="gradient" color="green" onClick={onSubmit}
                        disabled={create.isPending}>
                    Створити
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default CreateProposalModal;
