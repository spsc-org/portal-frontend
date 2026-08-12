import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import DatePicker from "@/Components/fields/DatePicker.jsx";
import React, {useEffect, useState} from "react";
import {usePage} from "@inertiajs/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {format} from "date-fns";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import Input from "@/Components/fields/Input.jsx";

const initialState = {
    caption: '',
    regNum: '',
    typeId: '',
    regDate: '',
    unitId: '',
    comments: '',
    performerId: '',
    path: '',
}
const UpdateDocumentModal = ({open, selectedId: id, onClose}) => {
    const {auth, token, types, units, users} = usePage().props;
    const [form, setForm] = useState(initialState);
    const [isProtected, setIsProtected] = useState(true);


    const [errors, setErrors] = useState(null);
    const queryClient = useQueryClient();

    const {data, isFetching} = useQuery({
        queryKey: ['document-update', id],
        queryFn: async () => {
            const response = await axios.get(`/api/document/${id}`, {
                headers: {"userId": auth?.user?.id}
            })
            return response.data;
        },
    });


    const update = useMutation({
        mutationFn: async (body) => {
            const response = await axios.patch(`/api/document/${id}`, body, {
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": token,
                    "userId": auth.user.id
                }
            });
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
        onError: error => {
            if (error?.response?.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success) {
                queryClient.setQueriesData({queryKey: ['documents']}, (oldData) => {
                    if (!Array.isArray(oldData?.data)) {
                        return oldData
                    } else {
                        const newData = oldData?.data.map((item) => {
                            if (item.id === data.data.id) {
                                item = {...data.data, isUpdated: true}
                            }
                            return item;
                        })
                        return {...oldData, data: newData}
                    }
                });

            }
        },

    })

    useEffect(() => {
        if (data?.data) {
            setForm({
                caption: data?.data?.caption || "",
                regNum: data?.data?.regNum || "",
                regDate: data?.data?.regDate,
                path: data?.data?.path || '',
                comments: data?.data?.comments || '',
                typeId: types.find(t => t.id === data?.data?.typeId),
                unitId: units.find(u => u.id === data?.data?.unitId),
                performerId: users.find(u => u.id === data?.data?.performerId),
            })
        }
    }, [data])

    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        if (key === "unitId") {
            setForm(prevState => ({...prevState, [key]: selected, regNum: (selected?.pattern || "")}));
        } else {
            setForm(prevState => ({...prevState, [key]: selected}));
        }
    }

    const handleChangeForm = ({target}) => {
        setErrors(prev => ({...prev, [target.name]: ""}))
        setForm(prev => ({...prev, [target.name]: target.value}))
    }

    const handleSubmit = () => {
        update.mutate({
            ...form,
            unitId: form?.unitId?.id,
            typeId: form?.typeId?.id,
            performerId: form.performerId?.id,
        })
    }

    const handleChangeDate = (date) => {
        if (date) {
            const str = format(date, "yyyy-MM-dd") || "";
            setForm(prevState => ({...prevState, regDate: str}));
            setErrors({...errors, regDate: ''});
        } else {
            setForm(prevState => ({...prevState, regDate: undefined}));
        }
    }

    const handleChangeRegNum = ({target}) => {
        setForm(prevState => ({...prevState, regNum: target.value}));
        const findUnit = units.find(unit => unit.pattern === target.value);
        if (target.value.length > 1 && findUnit) {
            setForm(prevState => ({...prevState, unitId: findUnit}));
        }
        setErrors({...errors, regNum: ''});
    }

    const toggleEdit = ({target}) => {
        setIsProtected(target.checked);
    }

    return (
        <Dialog open={open} handler={onClose} size="sm">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Редагувати документ: {data?.data?.regNum} {data?.data?.regDate ?
                    <span>від {format(data?.data?.regDate, "dd.MM.yyyy")}</span>
                    : ""}
                </Typography>
            </DialogHeader>
            <DialogBody>
                <div className="mb-2">
                    <label className="cursor-pointer text-slate-500 dark:text-slate-400">
                        <input

                            type="checkbox"
                            className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                            checked={isProtected}
                            onChange={toggleEdit}
                            name="isResponsible"
                        />{' '}
                        Зняти блокування
                    </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <SingleSelect closeMenuOnSelect error={errors?.typeId}
                                  options={types}
                                  label="Тип"
                                  id="typeId"
                                  value={form.typeId}
                                  onChange={handleChangeSelect("typeId")}/>
                    {
                        isProtected ?
                            <Input error={errors?.regDate} disabled={isProtected}
                                   label="Дата реєстрації"
                                   value={form.regDate ? format(form.regDate, "dd.MM.yyyy") : ''} name="regDate"
                            />
                            :
                            <DatePicker onChange={handleChangeDate} value={form.regDate} disabled={isProtected}
                                        label="Дата реєстрації"/>
                    }
                    <Input error={errors?.regNum} placeholder="0/0/0 <гриф>" label="Реєстраційний номер"
                           value={form.regNum} name="regNum"
                           onChange={handleChangeRegNum}/>
                    <SingleSelect closeMenuOnSelect error={errors?.unitId} options={units}
                                  isClearable
                                  label="Підрозділ"
                                  id="unitId"
                                  value={form.unitId}
                                  onChange={handleChangeSelect("unitId")}/>
                    <SingleSelect closeMenuOnSelect error={errors?.performerId} options={users}
                                  isClearable
                                  label="Виконавець"
                                  id="performerId"
                                  value={form.performerId}
                                  onChange={handleChangeSelect("performerId")}/>
                    <Input error={errors?.path} label="Шлях" value={form.path} name="path"
                           onChange={handleChangeForm}/>
                    <Input error={errors?.caption} label="Назва" value={form.caption} name="caption"
                           onChange={handleChangeForm}/>
                </div>
                <div className="mt-4">
                    <Input error={errors?.comments} tag="textarea" label="Коментар"
                           value={form.comments} name="comments"
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
                <Button variant="gradient" color="green" onClick={handleSubmit}>
                    Редагувати
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default UpdateDocumentModal;
