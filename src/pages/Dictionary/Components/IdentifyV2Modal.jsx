import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import React, {useEffect, useState} from "react";
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

const IdentifyV2Modal = ({open, onClose, id}) => {
    const {auth, countries = [], subjectTypes = []} = usePage().props;
    const queryClient = useQueryClient();
    const [errors, setErrors] = useState(null);
    const [form, setForm] = useState(initialState);

    const {data, isSuccess} = useQuery({
        queryKey: ['identify-v2-edit', id],
        queryFn: async () => {
            const response = await axios.get(`api/dictionary/identifier-v2/${id}`, {
                headers: {"userId": auth?.user?.id},
            });
            return response?.data;
        },
        enabled: !!id,
    })

    useEffect(() => {
        if (isSuccess && data?.data) {
            const d = data.data;
            setForm({
                code: d.code ?? '',
                pattern: d.pattern ?? '',
                group: GROUPS.find(g => g.id === d.group) ?? '',
                name_uk: d.name_uk ?? '',
                name_en: d.name_en ?? '',
                name_doc: d.name_doc ?? '',
                comment: d.comment ?? '',
                description_uk: d.description_uk ?? '',
                description_en: d.description_en ?? '',
                subjectTypeId: subjectTypes?.find(item => item.id === d.subjectTypeId) ?? '',
                belongCountryId: countries?.find(c => c.id === d.belongCountryId) ?? '',
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
            subjectTypeId: form.subjectTypeId?.id,
            group: form.group?.id,
            belongCountryId: form.belongCountryId?.id,
        }
        id
            ? updateMutation.mutate({body, userId: auth?.user?.id})
            : createMutation.mutate({body, userId: auth?.user?.id})
    }

    const mapResponseToRow = (item) => ({
        id: item?.id,
        createdAt: item?.createdAt,
        createdUserId: item?.createdUserId,
        deletedAt: item?.deletedAt,
        updatedAt: item?.updatedAt,
        code: item?.code,
        group: item?.group,
        name_uk: item?.name_uk,
        name_en: item?.name_en,
        name_doc: item?.name_doc,
        description_uk: item?.description_uk,
        description_en: item?.description_en,
        comment: item?.comment,
        subjectTypeId: item?.subjectTypeId,
        belongCountryId: item?.belongCountryId,
        pattern: item?.pattern,
    })

    const createMutation = useMutation({
        mutationFn: async ({body, userId}) => {
            const response = await axios.post('api/dictionary/identifier-v2', body, {
                cache: "no-cache", mode: 'same-origin', credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": auth?.token,
                    "userId": userId,
                },
            });
            return response.data;
        },
        onSuccess: async () => {
            toast.success("Створено успішно");
            createMutation.reset();
            setForm(initialState);
            onClose();
        },
        onError: ({response}) => {
            if (response?.status === 422) {
                setErrors(response.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success) {
                const mapped = {...mapResponseToRow(data.data), isUpdated: true};
                queryClient.setQueriesData({queryKey: ['dictionary-identify-v2']}, (oldData) => {
                    if (!Array.isArray(oldData?.data)) return oldData;
                    return {...oldData, data: [mapped, ...oldData.data]};
                });
            }
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({body, userId}) => {
            const response = await axios.patch(`api/dictionary/identifier-v2/${id}`, body, {
                cache: "no-cache", mode: 'same-origin', credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": auth?.token,
                    "userId": userId,
                },
            });
            return response.data;
        },
        onSuccess: async () => {
            toast.success("Оновлено успішно");
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
                const mapped = {...mapResponseToRow(data.data), isUpdated: true};
                queryClient.setQueriesData({queryKey: ['dictionary-identify-v2']}, (oldData) => {
                    if (!Array.isArray(oldData?.data)) return oldData;
                    const newData = oldData.data.map(item => item.id === mapped.id ? mapped : item);
                    return {...oldData, data: newData};
                });
            }
        },
    })

    return (
        <Dialog data-i-doc="modal:dictionary-identify-v2-modal" open={open} size="lg" handler={onClose}>
            <DialogHeader>
                <span>{id ? `Редагування: ${data?.data?.code}` : "Додати"}</span>
            </DialogHeader>
            <DialogBody className="h-[42rem] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                    <Input shrink error={errors?.code} label="Код" value={form.code}
                           name="code" onChange={handleChangeForm}/>
                    <Input shrink error={errors?.pattern} label="Паттерн" value={form.pattern}
                           name="pattern" onChange={handleChangeForm}/>
                    <SingleSelect isClearable error={errors?.subjectTypeId} closeMenuOnSelect options={subjectTypes}
                                  label="Тип суб'єкта" id="subjectTypeId"
                                  value={form.subjectTypeId}
                                  onChange={handleChangeOptions('subjectTypeId')}/>
                    <SingleSelect isClearable error={errors?.belongCountryId} closeMenuOnSelect options={countries}
                                  label="Країна" id="belongCountryId"
                                  value={form.belongCountryId}
                                  onChange={handleChangeOptions('belongCountryId')}/>
                    <SingleSelect closeMenuOnSelect options={GROUPS} label="Група" error={errors?.group} id="group"
                                  value={form.group}
                                  onChange={handleChangeOptions('group')}/>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Input shrink error={errors?.name_uk} label="Назва українською" value={form.name_uk}
                           name="name_uk" onChange={handleChangeForm}/>
                    <Input shrink error={errors?.name_en} label="Назва англійською" value={form.name_en}
                           name="name_en" onChange={handleChangeForm}/>
                    <Input shrink error={errors?.name_doc} label="Виводити як" value={form.name_doc}
                           name="name_doc" onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.description_uk} tag="textarea" label="description_uk"
                           value={form.description_uk} name="description_uk" onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.description_en} tag="textarea" label="description_en"
                           value={form.description_en} name="description_en" onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.comment} tag="textarea" label="Коментар"
                           value={form.comment} name="comment" onChange={handleChangeForm}/>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" onClick={onClose} className="mr-1">
                    <span>Закрити</span>
                </Button>
                <LoadingButton
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    variant="gradient" color="green" onClick={onSubmit}
                >
                    <span>{id ? 'Редагувати' : 'Створити'}</span>
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default IdentifyV2Modal;
