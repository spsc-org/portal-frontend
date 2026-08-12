import {usePage} from "@inertiajs/react";
import React, {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {format} from "date-fns";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import {BOOLEANS, SANC_DECREE_TYPES} from "@/utils.js";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import Input from "@/Components/fields/Input.jsx";
import DatePicker from "@/Components/fields/DatePicker.jsx";
import UploadFileList from "@/ReactPages/Decree/UploadFileList.jsx";
import ImportFile from "@/Components/Modal/ImportFile.jsx";
import toast from "react-hot-toast";


const initialState = {
    isActive: undefined,
    date: undefined,
    code: '',
    typeId: '',
    link: '',
    comment: '',
    rnboId: '',
}
const CreateDecree = ({open, onClose}) => {
    const {auth, token} = usePage().props;
    const queryClient = useQueryClient();

    const [form, setForm] = useState(initialState);
    const [decreeFile, setDecreeFile] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState(null);
    const [openUploadFile, setOpenUploadFile] = useState(null);


    const create = useMutation({
        mutationFn: async ({decreeFile, attachments, form}) => {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                if (key === 'isActive' || key === 'typeId') {
                    formData.append(key, value?.value || '');
                } else {
                    formData.append(key, value || '');
                }
            });
            if (decreeFile) {
                formData.append('decreeFile', decreeFile);
            }
            const filesToSubmit = attachments.filter(attachment => {
                return attachment?.file instanceof File;
            });
            filesToSubmit.forEach((attachment, index) => {
                if (attachment?.file instanceof File) {
                    formData.append(`attachments[${index}]`, attachment.file);
                }
            });
            const response = await axios.post(`/api/decree/create`,
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
        create.mutate({
            decreeFile,
            attachments: attachments.filter(i => i?.file || i?.id),
            form
        })
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

    const handleInput = ({target: {name, value}}) => {
        setErrors(prev => ({...prev, [name]: ""}));
        setForm(prevState => ({...prevState, [name]: value}));
    }

    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: selected}));
    }


    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Створити указ
                </Typography>
            </DialogHeader>
            <DialogBody className="h-[32rem] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                    <SingleSelect closeMenuOnSelect options={SANC_DECREE_TYPES}
                                  label="Тип"
                                  id="typeId"
                                  error={errors?.typeId}
                                  value={form.typeId}
                                  onChange={handleChangeSelect('typeId')}/>
                    <SingleSelect closeMenuOnSelect options={BOOLEANS}
                                  label="Діючий"
                                  id="isActive"
                                  error={errors?.isActive}

                                  value={form.isActive}
                                  onChange={handleChangeSelect('isActive')}/>
                    <Input error={errors?.link} placeholder="" label="Посилання"
                           value={form.link} name="link"
                           onChange={handleInput}/>
                    <Input error={errors?.code} placeholder="" label="Код"
                           value={form.code} name="code"
                           onChange={handleInput}/>
                    <Input error={errors?.rnboId} placeholder="" label="rnboId"
                           value={form.rnboId} name="rnboId"
                           onChange={handleInput}/>
                    <DatePicker onChange={handleChangeDate} error={errors?.date} value={form.date}
                                label="Дата"/>

                </div>

                <Input tag="textarea" error={errors?.comment} placeholder="" label="Коментар"
                       value={form.comment} name="comment"

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
                            onClick={() => setDecreeFile(null)}
                            size="sm"
                        >
                            <i className="fa-regular fa-file-slash"></i>
                        </Button>
                    )}
                </div>
                {
                    Boolean(decreeFile) &&
                    <Typography variant="small" color="blue"><span className="mr-1">Назва файлу буде змінена на:</span>
                        <span>{form.code ? form.code.replace("/", "-") : "-"}_{form.date ? format(form.date, "yyyy-MM-dd") : ""}</span>
                    </Typography>
                }
                <Typography variant="h5" className="dark:text-slate-200">Додати додатки:</Typography>
                <UploadFileList
                    data={form}
                    attachments={attachments}
                    uploadAttachments={handleAttachments}
                    setAttachments={setAttachments}
                />
                {
                    Boolean(openUploadFile) &&
                    <ImportFile
                        accept="application/pdf"
                        open={openUploadFile}
                        handleSubmit={handleUpload}
                        // isLoading={upload.isPending}
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
                <Button variant="gradient" color="green" onClick={handleUpdateDecree}
                        disabled={create.isPending}>
                    Створити
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default CreateDecree;
