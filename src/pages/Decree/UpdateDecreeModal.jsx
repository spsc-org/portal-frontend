import {usePage} from "@inertiajs/react";
import React, {useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import {format} from "date-fns";
import Input from "@/Components/fields/Input.jsx";
import ImportFile from "@/Components/Modal/ImportFile.jsx";
import UploadFileList from "@/ReactPages/Decree/UploadFileList.jsx";
import {BOOLEANS, SANC_DECREE_TYPES} from "@/utils.js";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import DatePicker from "@/Components/fields/DatePicker.jsx";


const initialState = {
    isActive: undefined,
    date: undefined,
    code: '',
    typeId: '',
    link: '',
    comment: '',
    rnboId: '',
}
const UpdateDecreeModal = ({open, selectedId: id, onClose}) => {
    const {auth, token} = usePage().props;
    const [deleteDecreeFile, setDeleteDecreeFile] = useState(false);
    const [form, setForm] = useState(initialState);
    const [decreeFile, setDecreeFile] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState(null);
    const queryClient = useQueryClient();
    const [isProtected, setIsProtected] = useState(true);
    const [openUploadFile, setOpenUploadFile] = useState(null);

    const {data, isLoading} = useQuery({
        queryKey: ['decree-update', id],
        queryFn: async () => {
            const response = await axios.get(`/api/decree/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        }
    })

    const update = useMutation({
        mutationFn: async ({decreeFile, attachments, form}) => {
            // Compare form data with original
            const hasFormChanges = Object.keys(form).some(key => {
                const originalValue = data?.data?.[key];
                let formValue = form[key];

                // Handle special cases
                if (key === 'isActive') {
                    return originalValue?.toString() !== formValue?.value;
                }
                if (key === 'typeId') {
                    return originalValue !== formValue?.value;
                }
                if (key === 'date') {
                    const origDate = originalValue ? format(originalValue, "yyyy-MM-dd") : "";
                    return origDate !== formValue;
                }

                return originalValue !== formValue;
            });

            const originalDecreeFile = data?.files?.find(f => f.file_type === 1);
            const hasDecreeFileChange = !originalDecreeFile ||
                (decreeFile && originalDecreeFile.name !== decreeFile.name);

            // Compare attachments
            const originalAttachments = data?.files?.filter(f => f.file_type === 2) || [];

            const formData = new FormData();

            if (hasFormChanges) {
                Object.entries(form).forEach(([key, value]) => {
                    if (key === 'isActive' || key === 'typeId') {
                        formData.append(key, value?.value || '');
                    } else {
                        formData.append(key, value || '');
                    }
                });
            }
            if (hasDecreeFileChange && decreeFile) {
                formData.append('decreeFile', decreeFile);
            }
            const filesToSubmit = attachments.filter(attachment => {
                if (attachment?.file instanceof File) {
                    return true;
                }
                if (attachment?.id) {
                    const originalAttachment = originalAttachments.find(oa => oa.id === attachment.id);
                    return !originalAttachment || originalAttachment.name !== attachment.name;
                }
                return false;
            });

            filesToSubmit.forEach((attachment, index) => {
                if (attachment?.file instanceof File) {
                    formData.append(`attachments[${index}]`, attachment.file);
                }
            });

            const response = await axios.post(`/api/decree/${id}/update`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
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
        onError: error => {
            if (error?.response?.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success) {
                queryClient.setQueriesData({queryKey: ['decree']}, (oldData) => {
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


    const deleteMutation = useMutation({
        mutationFn: async ({id, fileId}) => {
            return await axios.delete(`api/decree/${id}/delete?fileId=${fileId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            });
        },
        onSuccess: async () => {
            toast.success('Успішно видалено');
            setDecreeFile(null);
        },
        onError: async () => toast.error('Помилка видалення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['decree-update', id]}),
    })


    const handleAttachments = ({file, index}) => {
        setAttachments((prev) => {
            if (index >= 0 && index < prev.length) {
                return prev.map((attachment, idx) =>
                    idx === index ? {...attachment, file} : attachment
                );
            } else {
                return [...prev, {file, attached: false}];
            }
        });
    };

    const handleUpload = (file) => {
        setOpenUploadFile(false);
        setDecreeFile(file);
    }

    const handleUpdateDecree = () => {
        update.mutate({
            decreeFile,
            attachments: attachments.filter(i => i?.file || i?.id),
            form
        })
    }


    useEffect(() => {
        if (data?.files) {
            const file = data?.files?.find(f => f.file_type === 1);
            const decreeAttachments = data?.files?.filter(f => f.file_type === 2).map(f => ({file: f}))
            setAttachments(decreeAttachments);
            setDecreeFile(file);
        }
    }, [data?.files])

    useEffect(() => {
        if (data?.data) {
            setForm({
                code: data?.data?.code,
                isActive: BOOLEANS.find(b => b.value === data?.data?.isActive?.toString()),
                comment: data?.data?.comment,
                typeId: SANC_DECREE_TYPES.find(i => i.value === data?.data?.typeId),
                rnboId: data?.data?.rnboId,
                link: data?.data?.link,
                date: data?.data?.date ? format(data?.data?.date, "yyyy-MM-dd") : ""
            })
        }
    }, [data])


    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: selected}));
    }

    const handleInput = ({target: {name, value}}) => {
        setErrors(prev => ({...prev, [name]: ""}));
        setForm(prevState => ({...prevState, [name]: value}));
    }

    const handleChangeDate = (date) => {
        if (date) {
            const str = format(date, "yyyy-MM-dd") || "";
            setForm(prevState => ({...prevState, date: str}));
            setErrors({...errors, date: ''});
        } else {
            setForm(prevState => ({...prevState, date: undefined}));
        }
    }

    const toggleEdit = ({target}) => {
        setIsProtected(target.checked);
    }


    const handleDeleteFile = (fileId) => {
        deleteToast({id, fileId})
    }

    const deleteToast = ({id, fileId}) => {
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center gap-x-1 flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900">
                        Видалити файл назавжди?
                    </p>
                    <div className="flex flex-row gap-x-1 ">
                        <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>
                            Скасувати
                        </Button>
                        <Button size="sm" color="red" onClick={() => {
                            toast.dismiss(t.id)
                            deleteMutation.mutate({id, fileId: fileId})
                        }}>
                            Видалити
                        </Button>
                    </div>
                </div>
            ),
            {
                duration: 10000,
                position: 'top-center',
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            })
    }

    const handleDeleteDecreeFile = () => {
        if (decreeFile?.id) {
            deleteToast({id, fileId: decreeFile.id})
        } else {
            setDecreeFile(null)
        }
    }


    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Редагувати указ: {data?.data?.code} {data?.data?.date ?
                    <span>від {format(data?.data?.date, "dd.MM.yyyy")}</span>
                    : ""}
                </Typography>
            </DialogHeader>
            <DialogBody className="h-[32rem] overflow-y-auto">
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
                    <SingleSelect closeMenuOnSelect options={SANC_DECREE_TYPES}
                                  label="Тип"
                                  id="typeId"
                                  disabled={isProtected}
                                  value={form.typeId}
                                  onChange={handleChangeSelect('typeId')}/>
                    <SingleSelect closeMenuOnSelect options={BOOLEANS}
                                  label="Діючий"
                                  id="isActive"
                                  disabled={isProtected}
                                  value={form.isActive}
                                  onChange={handleChangeSelect('isActive')}/>
                    <Input error={errors?.link} placeholder="" label="Посилання"
                           value={form.link} name="link"
                           disabled={isProtected}
                           onChange={handleInput}/>
                    <Input error={errors?.code} placeholder="" label="Код"
                           value={form.code} name="code"
                           disabled={isProtected}
                           onChange={handleInput}/>
                    <Input error={errors?.rnboId} placeholder="" label="rnboId"
                           value={form.rnboId} name="rnboId"
                           disabled={isProtected}
                           onChange={handleInput}/>
                    {
                        isProtected ?
                            <Input error={errors?.date} disabled={isProtected}
                                   label="Дата"
                                   value={form.date ? format(form.date, "dd.MM.yyyy") : ''} name="regDate"
                            />
                            :
                            <DatePicker onChange={handleChangeDate} value={form.date} disabled={isProtected}
                                        label="Дата"/>
                    }

                </div>

                <Input tag="textarea" error={errors?.comment} placeholder="" label="Коментар"
                       value={form.comment} name="comment"
                       disabled={isProtected}
                       onChange={handleInput}/>
                <Typography variant="h5" className="dark:text-slate-200">Указ:</Typography>
                <div className="flex  gap-x-2 max-w-md">
                    <Input disabled placeholder="Відсутній файл" error={errors?.decreeFile}
                           value={decreeFile?.name}/>
                    <Button onClick={() => setOpenUploadFile(true)} size="sm">
                        <i className="fa-regular fa-plus"></i>
                    </Button>
                    {Boolean(decreeFile?.name) && (
                        <Button
                            title="Видалити файл"
                            color="red"
                            onClick={handleDeleteDecreeFile}
                            size="sm"
                        >
                            <i className="fa-regular fa-file-slash"></i>
                        </Button>
                    )}
                </div>
                {
                    Boolean(decreeFile) &&
                    <Typography variant="small" color="blue"><span className="mr-1">Назва файлу буде змінена на:</span>
                        <span>{data?.data?.code ? data?.data?.code.replace("/", "-") : "-"}_{format(data?.data?.date, "yyyy-MM-dd")}</span></Typography>
                }
                <Typography variant="h5" className="dark:text-slate-200">Додати додатки:</Typography>
                <UploadFileList
                    errors={errors}
                    data={data?.data}
                    attachments={attachments}
                    uploadAttachments={handleAttachments}
                    setAttachments={setAttachments}
                    onDeleteFile={handleDeleteFile}
                />
                {
                    openUploadFile &&
                    <ImportFile
                        accept="application/pdf"
                        open={openUploadFile}
                        handleSubmit={handleUpload}
                        formatText="Формати: .pdf"
                        onClose={() => setOpenUploadFile(false)}/>
                }

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
                <Button
                    variant="gradient"
                    color="green"
                    onClick={handleUpdateDecree}
                    disabled={update.isPending || isLoading}
                >
                    {
                        Boolean(update.isPending) &&
                        <i className="fa-regular fa-spinner animate-spin"></i>
                    }
                    <span>Редагувати</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default UpdateDecreeModal;
