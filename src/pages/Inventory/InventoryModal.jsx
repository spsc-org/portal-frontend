import React, {useEffect, useMemo, useState} from 'react';
import {usePage} from "@inertiajs/react";
import toast from "react-hot-toast";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import Input from "@/Components/fields/Input.jsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

const InventoryModal = ({open, onClose, dictionary, id, isClone = false}) => {
    const {auth, token} = usePage().props;
    const inventoryLocation = dictionary?.inventoryLocation ?? [];
    const inventoryType = dictionary?.inventoryType ?? [];
    const users = dictionary?.user ?? [];
    const responsibleUsers = dictionary?.responsibleUser ?? [];
    const req = (field) => dictionary?.requiredFields?.includes(field) ?? false;
    const queryClient = useQueryClient()

    const getInitialState = () => ({
        inventoryId: '',
        inventoryNum: '',
        registryNum: '',
        serial: '',
        caption: '',
        details: '',
        amount: 1,
        cost: '',
        note: '',
        valueTypeId: '',
        baileeUserId: '',
        responsibleUserId: '',
        locationId: inventoryLocation?.find(l => l.id === 1) ?? '',
        invoice: '',
    });

    const [form, setForm] = useState(getInitialState)
    const [errors, setErrors] = useState(null);
    const {data, isSuccess} = useQuery({
        queryKey: ['inventory-edit', id],
        queryFn: async () => {
            const response = await axios.get(`api/inventory/${id}`, {headers: {"userId": auth?.user?.id}});
            return response?.data
        },
        enabled: !!id,
    })


    const cloneMutation = useMutation({
        mutationFn: async ({sourceId, body, userId}) => {
            const response = await axios.post(`api/inventory/${sourceId}/clone`, body, {
                cache: "no-cache", mode: 'same-origin', credentials: "same-origin", headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-Token": token,
                    "userId": userId
                },
            });
            return response.data;
        },
        onSuccess: async () => {
            toast.success("Копію створено успішно");
            cloneMutation.reset();
            setForm(getInitialState());
            onClose();
        },
        onError: error => {
            if (error.response.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['inventories']});
            }
        },
    })

    const createMutation = useMutation({
        mutationFn: async ({body, userId}) => {
            const response = await axios.post(`api/inventory`, body, {
                cache: "no-cache", mode: 'same-origin', credentials: "same-origin", headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-Token": token,
                    "userId": userId
                },
            });
            return response.data;
        },
        onSuccess: async () => {
            toast.success("Створено успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            createMutation.reset();
            setForm(getInitialState());
            onClose();
        },
        onError: error => {
            if (error.response.status === 204) {
                toast.error("Зміни не були внесені, оскільки дані залишилися незмінними");
            }
            if (error.response.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['inventories']});
            }
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({body, id, userId}) => {
            const response = await axios.patch(`api/inventory/${id}`, body, {
                cache: "no-cache", mode: 'same-origin', credentials: "same-origin", headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-Token": token,
                    "userId": userId
                },
            })
            return response.data;
        },
        onSuccess: async () => {
            toast.success("Оновлено успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            updateMutation.reset();
            setForm(getInitialState());
            onClose();
        },
        onError: error => {
            if (error.response.status === 204) {
                toast.error("Зміни не були внесені, оскільки дані залишилися незмінними");
            }
            if (error.response.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success && data?.data) {
                queryClient.setQueriesData({queryKey: ['inventories']}, (oldData) => {
                    if (!Array.isArray(oldData?.data)) {
                        return oldData;
                    }
                    const newData = oldData.data.map((item) => {
                        if (item.id === data.data.id) {
                            return {...item, ...data.data, isUpdated: true};
                        }
                        return item;
                    });
                    return {...oldData, data: newData};
                });
            }
        },
    })

    useEffect(() => {
        if (isSuccess) {
            setForm({
                inventoryNum: data?.data?.inventoryNum,
                registryNum: data?.data?.registryNum,
                serial: data?.data?.serial,
                note: data?.data?.note,
                cost: data?.data?.cost,
                caption: data?.data?.caption,
                amount: data?.data?.amount,
                details: data?.data?.details,
                invoice: data?.data?.invoice,
                responsibleUserId: responsibleUsers?.find(d => d.id === data?.data?.responsibleUserId),
                baileeUserId: users?.find(d => d.id === data?.data?.baileeUserId),
                valueTypeId: inventoryType?.find(d => d.id === data?.data?.valueTypeId),
                locationId: inventoryLocation?.find(d => d.id === data?.data?.locationId),
            });
        }
    }, [data])

    const handleChangeForm = ({target}) => {
        setErrors(prev => ({...prev, [target.name]: ""}))
        setForm(prev => ({...prev, [target.name]: target.value}))
    }

    const handleChangeOptions = (key = '') => (newSelectedIds) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: newSelectedIds}));
    };

    const onSubmit = () => {
        const body = {
            ...form,
            locationId: form.locationId?.id,
            valueTypeId: form.valueTypeId?.id,
            baileeUserId: form.baileeUserId?.id,
            responsibleUserId: form.responsibleUserId?.id,
        }
        if (isClone) {
            return cloneMutation.mutate({
                sourceId: id,
                body,
                userId: auth?.user?.id
            })
        }
        if (id) {
            return updateMutation.mutate({body, id, userId: auth?.user?.id})
        }
        return createMutation.mutate({
            body,
            userId: auth?.user?.id
        })
    }

    const dialogTitle = useMemo(() => {
        if (isClone) {
            return `Створити копію: ${data?.data?.caption}`;
        }
        if (id) {
            return `Редагувати інвентар: ${data?.data?.caption}`;
        }
        return "Створити новий інвентар";
    }, [id, isClone, data])


    const submitText = useMemo(() => {
        if (isClone) {
            return `Створити копію`;
        }
        if (id) {
            return `Редагувати`;
        }
        return "Створити";
    }, [id, isClone, data])



    return (
        <Dialog open={open} size="lg" handler={onClose}>
            <DialogHeader
                className="dark:text-gray-200">{dialogTitle}</DialogHeader>
            <DialogBody>
                <div className="grid grid-cols-2 gap-4">
                    <Input error={errors?.caption} label="Опис" value={form.caption}
                           name="caption" isRequired={req('caption')}
                           onChange={handleChangeForm}/>
                    <Input error={errors?.details} label="Деталі" value={form.details} name="details"
                           isRequired={req('details')} onChange={handleChangeForm}/>
                    <Input error={errors?.invoice} label="Накладна" value={form.invoice} name="invoice"
                           isRequired={req('invoice')} onChange={handleChangeForm}/>
                    <Input error={errors?.serial} label="Серійний номер" isProtected={id} value={form.serial}
                           name="serial" isRequired={req('serial')}
                           onChange={handleChangeForm}/>
                    <Input error={errors?.inventoryNum} isProtected={id} label="Інв. номер" value={form.inventoryNum}
                           name="inventoryNum" isRequired={req('inventoryNum')} onChange={handleChangeForm}/>
                    <Input error={errors?.registryNum} label="Реєстр. №" value={form.registryNum}
                           name="registryNum" isRequired={req('registryNum')} onChange={handleChangeForm} maxLength={20}/>
                    <Input min={0} type="number" error={errors?.amount} label="Кількість" value={form.amount}
                           name="amount" isRequired={req('amount')}
                           onChange={handleChangeForm}/>
                    <Input min={0} type="number" error={errors?.cost} label="Вартість" value={form.cost}
                           name="cost" isRequired={req('cost')}
                           onChange={handleChangeForm}/>
                    <SingleSelect closeMenuOnSelect error={errors?.valueTypeId} options={inventoryType} label="Тип"
                                  id="valueTypeId" isRequired={req('valueTypeId')}
                                  value={form.valueTypeId}
                                  onChange={handleChangeOptions('valueTypeId')}/>
                    <SingleSelect closeMenuOnSelect error={errors?.baileeUserId} options={users}
                                  label="Відповідальний" id="baileeUserId" isRequired={req('baileeUserId')}
                                  isClearable
                                  value={form.baileeUserId}
                                  onChange={handleChangeOptions('baileeUserId')}/>
                    <SingleSelect closeMenuOnSelect error={errors?.responsibleUserId} options={responsibleUsers}
                                  label="Матеріально відповідальний"
                                  id="responsibleUserId" isRequired={req('responsibleUserId')}
                                  value={form.responsibleUserId}
                                  onChange={handleChangeOptions('responsibleUserId')}/>
                    <SingleSelect closeMenuOnSelect error={errors?.locationId} options={inventoryLocation}
                                  label="Розташування" id="locationId" isRequired={req('locationId')}
                                  value={form.locationId}
                                  onChange={handleChangeOptions('locationId')}/>
                </div>
                <div className="">
                    <Input tag="textarea" error={errors?.note} label="Примітка" value={form.note} name="note"
                           onChange={handleChangeForm}/>
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
                <Button variant="gradient" color="green" onClick={onSubmit}>
                    <span>{submitText}</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default InventoryModal;
