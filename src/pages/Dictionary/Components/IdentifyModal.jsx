import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import React, {useEffect, useState} from "react";
import {useDictionaryContext} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import Input from "@/Components/fields/Input.jsx";
import {GROUPS} from "@/ReactPages/Dictionary/utils.js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {usePage} from "@inertiajs/react";
import axios from "axios";
import LoadingButton from "../../../Components/Buttons/LoadingButton.jsx";

const initialState = {
    code: '',
    pattern: '',
    group: '',
    subjectTypeId: '',
    name_uk: '',
    name_en: '',
    name_doc: '',
    comment: '',
    description_uk: '',
    description_en: '',
    belongCountryId: '',
}

const IdentifyModal = ({open, onClose, id}) => {
    const {auth, countries = [], subjectTypes = []} = usePage().props;

    const queryClient = useQueryClient();
    const [errors, setErrors] = useState(null);
    const [form, setForm] = useState(initialState);

    const {data, isSuccess} = useQuery({
        queryKey: ['identify-edit', id],
        queryFn: async () => {
            const response = await axios.get(`api/dictionary/identifier/${id}`, {headers: {"userId": auth?.user?.id}});
            return response?.data;
        },
        enabled: !!id,
    })

    useEffect(() => {
        if (isSuccess) {
            const {current_version} = data?.data;
            setForm({
                code: current_version?.code ?? '',
                pattern: current_version?.pattern ?? '',
                group: GROUPS.find(g => g.id === current_version?.group) ?? '',
                name_uk: current_version?.name_uk ?? '',
                name_en: current_version?.name_en ?? '',
                name_doc: current_version?.name_doc ?? '',
                comment: current_version?.comment ?? '',
                description_uk: current_version?.description_uk ?? '',
                description_en: current_version?.description_en ?? '',
                subjectTypeId: subjectTypes?.find(item => item.id === current_version?.subjectTypeId) ?? '',
                belongCountryId: countries?.find(c => c.id === current_version?.belongCountryId) ?? '',
            });
        }
    }, [data, isSuccess])

    const handleChangeForm = ({target}) => {
        setForm({...form, [target.name]: target.value});
    }

    const handleChangeOptions = (key = '') => (newSelectedIds) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: newSelectedIds}));
    };

    const onSubmit = () => {
        const body = {
            ...form,
            subjectTypeId: form.subjectTypeId?.id || null,
            group: form.group?.id || null,
            belongCountryId: form.belongCountryId?.id || null,
        }
        id ? updateMutation.mutate({body, userId: auth?.user?.id}) : createMutation.mutate({
            body,
            userId: auth?.user?.id
        })
    }

    const createMutation = useMutation({
        mutationFn: async ({body, userId}) => {
            const response = await axios.post('api/dictionary/identifier', body, {
                cache: "no-cache", mode: 'same-origin', credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": auth?.token,
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
            setForm(initialState);
            onClose();
        },
        onError: ({response}) => {
            if (response.status === 422) {
                setErrors(response.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success) {
                const updatedIdentify = data.data;
                const mapped = {
                    id: updatedIdentify?.id,
                    createdAt: updatedIdentify?.createdAt,
                    createdUserId: updatedIdentify?.createdUserId,
                    currentVersion: updatedIdentify?.currentVersion,
                    deletedAt: updatedIdentify?.deletedAt,
                    updatedAt: updatedIdentify?.updatedAt,
                    code: updatedIdentify?.current_version?.code,
                    group: updatedIdentify?.current_version?.group,
                    name_uk: updatedIdentify?.current_version?.name_uk,
                    name_en: updatedIdentify?.current_version?.name_en,
                    name_doc: updatedIdentify?.current_version?.name_doc,
                    description_uk: updatedIdentify?.current_version?.description_uk,
                    description_en: updatedIdentify?.current_version?.description_en,
                    comment: updatedIdentify?.current_version?.comment,
                    subjectTypeId: updatedIdentify?.current_version?.subjectTypeId,
                    belongCountryId: updatedIdentify?.current_version?.belongCountryId,
                    pattern: updatedIdentify?.current_version?.pattern,
                }
                queryClient.setQueriesData({queryKey: ['dictionary-identify']}, (oldData) => {
                    if (!Array.isArray(oldData?.data)) {
                        return oldData
                    } else {
                        const newData = [{...mapped, isUpdated: true}, ...oldData?.data];
                        return {...oldData, data: newData}
                    }
                });
            }
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({body, userId}) => {
            const response = await axios.patch(`api/dictionary/identifier/${id}`, body, {
                cache: "no-cache", mode: 'same-origin', credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": auth?.token,
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
            setForm(initialState);
            onClose();
        },
        onError: error => {
            if (error?.response?.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success) {
                const updatedIdentify = data.data;
                const mapped = {
                    id: updatedIdentify?.id,
                    createdAt: updatedIdentify?.createdAt,
                    createdUserId: updatedIdentify?.createdUserId,
                    currentVersion: updatedIdentify?.currentVersion,
                    deletedAt: updatedIdentify?.deletedAt,
                    updatedAt: updatedIdentify?.updatedAt,
                    code: updatedIdentify?.current_version?.code,
                    group: updatedIdentify?.current_version?.group,
                    name_uk: updatedIdentify?.current_version?.name_uk,
                    name_en: updatedIdentify?.current_version?.name_en,
                    name_doc: updatedIdentify?.current_version?.name_doc,
                    description_uk: updatedIdentify?.current_version?.description_uk,
                    description_en: updatedIdentify?.current_version?.description_en,
                    comment: updatedIdentify?.current_version?.comment,
                    subjectTypeId: updatedIdentify?.current_version?.subjectTypeId,
                    belongCountryId: updatedIdentify?.current_version?.belongCountryId,
                    pattern: updatedIdentify?.current_version?.pattern,
                }
                queryClient.setQueriesData({queryKey: ['dictionary-identify']}, (oldData) => {
                    if (!Array.isArray(oldData?.data)) {
                        return oldData
                    } else {
                        const newData = oldData?.data.map((item) => {
                            if (item.id === mapped.id) {
                                item = {...mapped, isUpdated: true}
                            }
                            return item;
                        })
                        return {...oldData, data: newData}
                    }
                });

            }
        },
    })


    return (
        <Dialog open={open} size="lg" handler={onClose}>
            <DialogHeader>
                <span>{id ? `Редагування: ${data?.data?.current_version?.code}` : "Додати"}</span>
            </DialogHeader>
            <DialogBody className="h-[42rem] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                    <Input shrink error={errors?.code} label="Код" value={form.code}
                           name="code"
                           onChange={handleChangeForm}/>
                    <Input shrink error={errors?.pattern} label="Паттерн" value={form.pattern}
                           name="pattern"
                           onChange={handleChangeForm}/>
                    <SingleSelect isClearable error={errors?.subjectTypeId} closeMenuOnSelect options={subjectTypes}
                                  label="Тип суб'єкта"
                                  id="subjectTypeId"
                                  value={form.subjectTypeId}
                                  onChange={handleChangeOptions('subjectTypeId')}/>
                    <SingleSelect isClearable error={errors?.belongCountryId} closeMenuOnSelect options={countries}
                                  label="Країна"
                                  id="belongCountryId"
                                  value={form.belongCountryId}
                                  onChange={handleChangeOptions('belongCountryId')}/>
                    <SingleSelect closeMenuOnSelect options={GROUPS} label="Група" error={errors?.group} id="group"
                                  value={form.group}
                                  onChange={handleChangeOptions('group')}/>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Input shrink error={errors?.name_uk} label="Назва українською" value={form.name_uk}
                           name="name_uk"
                           onChange={handleChangeForm}/>
                    <Input shrink error={errors?.name_en} label="Назва англійською" value={form.name_en}
                           name="name_en"
                           onChange={handleChangeForm}/>
                    <Input shrink error={errors?.name_doc} label="Виводити як" value={form.name_doc}
                           name="name_doc"
                           onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.description_uk} tag="textarea" label="description_uk"
                           value={form.description_uk} name="description_uk"
                           onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.description_en} tag="textarea" label="description_en"
                           value={form.description_en} name="description_en"
                           onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.comment} tag="textarea" label="Коментар"
                           value={form.comment} name="comment"
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
                <LoadingButton isLoading={createMutation.isPending || updateMutation.isPending} variant="gradient" color="green" onClick={onSubmit}>
                    <span>{id ? 'Редагувати' : 'Створити'}</span>
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};
export default IdentifyModal;
