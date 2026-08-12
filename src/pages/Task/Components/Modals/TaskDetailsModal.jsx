import {usePage} from "@inertiajs/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Button, Card, Chip, Dialog, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import React, {useEffect, useMemo, useState} from "react";
import {LoadingDialogBody} from "../../../../Components/Buttons/LoadingDialogBody.jsx";
import ImageGallery from "../../../../Components/ImageGallery.jsx";
import {getPriorityStyle, getStatusStyle, getTypeStyle} from "../../utils.jsx";
import {format} from "date-fns";
import {useFilteredAttachments} from "../../../../hooks/useFilteredAttachments.jsx";
import toast from "react-hot-toast";
import Input from "../../../../Components/fields/Input.jsx";
import SingleSelect from "../../../../Components/fields/SingleSelect.jsx";
import MultiSelect from "../../../../Components/fields/MultiSelect.jsx";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import DocumentGallery from "../../../../Components/DocumentGallary.jsx";
import DatePicker from "../../../../Components/fields/DatePicker.jsx";
import {useTaskOptions} from "../../queries.jsx";

const initialState = {
    title: '',
    description: '',
    typeId: '',
    projectId: '',
    assignedUserId: '',
    statusId: '',
    priorityId: '',
    dueDate: undefined,
    tags: [],
}

const TaskDetailsModal = ({open, onClose, selectedId: id, view = "task", readOnly = false}) => {
    const pageProps = usePage().props;
    const {auth, token} = pageProps;
    // Словники — з /api/task/options; fallback на Inertia-props для
    // сторінок, що ще не мігрували (bug/assigned)
    const {data: taskOptions} = useTaskOptions(auth);
    const dictionaries = taskOptions || pageProps;
    const types = dictionaries.types || [];
    const projects = dictionaries.projects || [];
    const statuses = dictionaries.statuses || [];
    const users = dictionaries.users || [];
    const priorities = dictionaries.priorities || [];
    const availableTags = dictionaries.tags || [];
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        ...initialState,
    });
    const [errors, setErrors] = useState();
    const {data, isLoading} = useQuery({
        queryKey: ['task-show', id],
        queryFn: async () => {
            const response = await axios.get(`/api/task/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        },
        enabled: open || Boolean(id)
    })


    const isReadOnly = useMemo(() => {
        return Boolean(data?.data?.deleted_at) || readOnly
    }, [readOnly, data]);


    const update = useMutation({
        mutationFn: async ({form}) => {
            const body = {
                ...form,
                assignedUserId: form?.assignedUserId?.id,
                // __isNew__ — нова назва проєкту (CreatableSelect), бекенд
                // створить проєкт за принципом тегів
                projectId: form?.projectId?.__isNew__ ? form.projectId.value : form?.projectId?.id,
                typeId: form?.typeId?.id,
                priorityId: form?.priorityId?.id,
                statusId: form?.statusId?.id,
                dueDate: form?.dueDate ? format(form.dueDate, "yyyy-MM-dd HH:mm:ss") : null,
                tags: form?.tags?.map(t => t.value || t.name || t)
            }
            const response = await axios.patch(`/api/task/${id}`,
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
            await queryClient.invalidateQueries({queryKey: ['task-show', id]});
            await queryClient.invalidateQueries({queryKey: ['tasks']});
            // Новостворені тег/проєкт мають бути одразу доступні в інших селектах
            await queryClient.invalidateQueries({queryKey: ['task-options']});
        },

        onSettled: async (data, error) => {
            if (!error) {
               await queryClient.invalidateQueries({queryKey: ['tasks']});
               await queryClient.invalidateQueries({queryKey: ['task-show', id]});

            }
        },
    })


    const attachImages = useMutation({
        mutationFn: async (attachments = []) => {
            const formData = new FormData();
            const filesToSubmit = attachments.filter(attachment => {
                return attachment?.file instanceof File;
            });
            filesToSubmit.forEach((attachment, index) => {
                if (attachment?.file instanceof File) {
                    formData.append(`attachments[${index}]`, attachment.file);
                }
            });
            const response = await axios.post(`/api/task/${id}/attach-file`,
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
        onSuccess: async (response) => {
            const files = response?.data?.files ?? [];
            if (!files.length) return;
            files.forEach(({fileName}) => {
                toast.success(`Вкладення ${fileName} успішно завантажено`, {
                    style: {
                        background: 'dark:dark:bg-slate-800',
                        color: 'text-slate-400',
                    },
                });
            });
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['task-show', id]});
            }
        },
    });

    const attachDocuments = useMutation({
        mutationFn: async (attachments = []) => {
            const formData = new FormData();
            const filesToSubmit = attachments.filter(attachment => {
                return attachment?.file instanceof File;
            });
            filesToSubmit.forEach((attachment, index) => {
                if (attachment?.file instanceof File) {
                    formData.append(`attachments[${index}]`, attachment.file);
                }
            });
            const response = await axios.post(`/api/task/${id}/attach-file`,
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
        onSuccess: async (response) => {
            const files = response?.data?.files ?? [];
            if (!files.length) return;
            files.forEach(({fileName}) => {
                toast.success(`Вкладення ${fileName} успішно завантажено`, {
                    style: {
                        background: 'dark:dark:bg-slate-800',
                        color: 'text-slate-400',
                    },
                });
            });
        },
        onError: async () => toast.error('Помилка завантаження вкладення'),
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['task-show', id]});
            }
        },
    });


    const deleteAttachment = useMutation({
        mutationFn: async (attachment) => {
            const response = await axios.delete(`/api/task/delete-file/${attachment.id}`,
                {
                    headers: {
                        "X-CSRF-Token": token,
                        "userId": auth.user.id,
                    }
                }
            );
            return response.data;
        },
        onSuccess: async ({fileName}) => toast.success(`Вкладення ${fileName} видалено успішно`),
        onError: async () => toast.error('Помилка видалення вкладення'),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['task-show', id]})
    });

    const {imageAttachments, wordAttachments} = useFilteredAttachments(data?.attachments);

    useEffect(() => {
        if (data?.data) {
            setForm({
                title: data?.data?.title,
                description: data?.data?.description,
                typeId: types.find(i => i.id === data?.data?.typeId),
                statusId: statuses.find(i => i.id === data?.data?.statusId),
                projectId: projects.find(i => i.id === data?.data?.projectId),
                priorityId: priorities.find(i => i.id === data?.data?.priorityId),
                assignedUserId: users.find(i => i.id === (data?.data?.assigned_user?.id || data?.data?.assignedUser?.id)),
                dueDate: data?.data?.dueDate ? new Date(data?.data?.dueDate) : undefined,
                tags: data?.data?.tags?.map(tag => ({
                    value: tag.id,
                    label: tag.name,
                    color: tag.color
                })) || []
            })
        }
    }, [data?.data, types, statuses, projects, priorities, users])

    const handleCloseModal = () => {
        const params = new URLSearchParams(window.location.search);
        params.delete('view');
        window.history.pushState({}, '', window.location.pathname);
        onClose();
    }

    const handleUpdateImageList = (imageList = []) => {
        if (!imageList.length) return
        attachImages.mutate(imageList);
    }

    const handleUpdateDocumentList = (documentList = []) => {
        if (!documentList.length) return
        attachDocuments.mutate(documentList);
    }

    const handleDeleteAttachment = (attachment) => (event) => {
        event.preventDefault();
        if (!attachment)
            return;
        toast((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    }   max-w-3xl w-full pointer-events-auto flex items-center gap-x-1 flex-row`}
                >
                    <p className="text-sm font-medium text-gray-900">
                        Ви точно хочете видалити файл?
                    </p>
                    <div className="flex flex-row gap-x-1 ">
                        <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>
                            Скасувати
                        </Button>
                        <Button size="sm" color="red" onClick={() => {
                            toast.dismiss(t.id)
                            deleteAttachment.mutate(attachment)
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


    const handleInput = ({target: {name, value}}) => {
        setErrors(prev => ({...prev, [name]: ""}));
        setForm(prevState => ({...prevState, [name]: value}));
    }

    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: selected}));
    }


    const onSubmit = () => {
        update.mutate({
            form
        })
    }

    const canUpdateRow = useMemo(() => {
        if (!data?.data) return;
        const permission = auth?.user?.permissions?.pages?.task?.update;
        // Якщо запис видалений — кнопка не показується
        if (data?.data?.deleted_at) return false;
        // Якщо дозвіл "individual" — власник або учасник задачі
        if (permission === 'individual') {
            const userId = auth?.user?.id;
            return data?.data?.createdUserId === userId
                || (data?.data?.assignedUsers || data?.data?.assigned_users || []).some(user => user.id === userId);
        }
        // Якщо має загальний дозвіл на редагування
        if (permission === true) return true;
        // Інакше не дозволено
        return false;
    }, [data?.data, id, auth]);

    const tagOptions = useMemo(() => availableTags.map(tag => ({
        value: tag.id,
        label: tag.name,
        color: tag.color
    })), [availableTags]);


    return (
        <Dialog open={open} handler={handleCloseModal} size="xl" className="max-h-[90vh] flex flex-col">
            <DialogHeader className="shrink-0">
                <div className="flex flex-col w-full">
                    {
                        Boolean(data) ?
                            <div className="flex justify-between items-start w-full">
                                <div className="flex flex-col">
                                    {
                                        Boolean(data?.data?.deleted_at) &&
                                        <Chip className="w-fit mb-2" color="blue" variant="ghost" value="Архів"/>
                                    }
                                    <Typography variant="h5" className="dark:text-slate-200">
                                        <div className="flex gap-1 items-center flex-wrap">
                                            {getTypeStyle(data?.data?.type?.title)} | {getStatusStyle(data?.data?.status?.name) || "Невідомо"} | {getPriorityStyle(data?.data?.priority?.caption)} | {data?.data?.title}
                                        </div>
                                    </Typography>
                                    <Typography variant="h6" className="dark:text-slate-200 text-sm">
                                        <span>Номер:<span className="ml-1 font-light">#{data?.data?.id}</span></span>
                                    </Typography>
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end max-w-xs">
                                    {data?.data?.tags?.map(tag => (
                                        <Chip key={tag.id} size="sm" value={tag.name} variant="ghost" color="blue-gray" className="rounded-full" />
                                    ))}
                                </div>
                            </div> : null
                    }
                </div>
            </DialogHeader>
            <LoadingDialogBody isLoading={isLoading} className="min-h-[32rem] flex-1 relative overflow-y-auto">
                    <Card className="p-4 bg-gray-600/20 mb-2 ">
                        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                            <div className="col-span-3">
                                <Input error={errors?.title} placeholder="" label="Назва" isRequired
                                       tag="textarea"
                                       value={form.title} name="title"
                                       disabled={isReadOnly || !canUpdateRow}
                                       showToggle={false}
                                       onChange={handleInput}/>
                            </div>

                            <SingleSelect closeMenuOnSelect isClearable isCreatable options={projects}
                                          label="Проєкт"
                                          id="projectId"
                                          error={errors?.projectId}
                                          disabled={isReadOnly || !canUpdateRow}
                                          value={form.projectId}
                                          onChange={handleChangeSelect('projectId')}
                                          formatCreateLabel={(inputValue) => `Створити "${inputValue}"`}/>
                            <SingleSelect closeMenuOnSelect options={types}
                                          label="Тип"
                                          id="typeId"
                                          isRequired
                                          disabled={view === "bug" || isReadOnly || !canUpdateRow}
                                          error={errors?.typeId}
                                          value={form.typeId}
                                          onChange={handleChangeSelect('typeId')}/>
                            <SingleSelect closeMenuOnSelect options={priorities}
                                          label="Пріоритет"
                                          id="priorityId"
                                          isRequired
                                          error={errors?.priorityId}
                                          disabled={isReadOnly || !canUpdateRow}
                                          value={form.priorityId}
                                          onChange={handleChangeSelect('priorityId')}/>
                            <SingleSelect closeMenuOnSelect options={statuses}
                                          label="Статус"
                                          id="statusId"
                                          isRequired
                                          error={errors?.statusId}
                                          disabled={isReadOnly || !canUpdateRow}
                                          value={form.statusId}
                                          onChange={handleChangeSelect('statusId')}/>
                            <SingleSelect closeMenuOnSelect options={users}
                                          label="Виконавець"
                                          id="assignedUserId"
                                          isClearable={true}
                                          error={errors?.assignedUserId}
                                          disabled={isReadOnly || !canUpdateRow}
                                          value={form.assignedUserId}
                                          onChange={handleChangeSelect('assignedUserId')}/>

                            <DatePicker
                                label="Термін"
                                disabled={isReadOnly || !canUpdateRow}
                                value={form.dueDate}
                                onChange={(date) => setForm(prev => ({...prev, dueDate: date}))}
                                error={errors?.dueDate}
                            />

                            <div className="col-span-3">
                                <MultiSelect
                                    isCreatable
                                    isClearable
                                    closeMenuOnSelect
                                    label="Теги"
                                    id="tags"
                                    disabled={isReadOnly || !canUpdateRow}
                                    options={tagOptions}
                                    value={form.tags}
                                    onChange={(selected) => setForm(prev => ({...prev, tags: selected}))}
                                    placeholder="Оберіть або створіть тег"
                                    formatCreateLabel={(inputValue) => `Створити "${inputValue}"`}
                                />
                            </div>
                        </div>

                <div className="mt-4">
                    <Input tag="textarea" error={errors?.description} placeholder="" label="Опис"
                           disabled={isReadOnly || !canUpdateRow}
                           showToggle={false}
                           value={form.description} name="description"
                           onChange={handleInput}/>
                </div>

                        <div className="flex gap-x-6 mt-4">
                            <div className="flex flex-col gap-x-2">
                                <p className="font-bold dark:text-gray-50 text-xs">Створив:</p>
                                <p className="font-normal dark:text-slate-400 text-xs">{data?.data?.created_user?.name || data?.data?.createdUser?.name || "Інформація відсутня"}</p>
                            </div>
                            <div className="flex flex-col gap-x-2">
                                <p className="font-bold dark:text-gray-50 text-xs">Дата створення:</p>
                                <p className="font-normal dark:text-slate-400 text-xs">{Boolean(data?.data?.created_at) ? format(data?.data?.created_at, "yyyy-MM-dd HH:mm") : ""}</p>
                            </div>
                            <div className="flex flex-col gap-x-2">
                                <p className="font-bold dark:text-gray-50 text-xs">Останнє оновлення:</p>
                                <p className="font-normal dark:text-slate-400 text-xs">{Boolean(data?.data?.updated_at) ? format(data?.data?.updated_at, "yyyy-MM-dd HH:mm") : ""}</p>
                            </div>
                        </div>

                    </Card>
                <Typography variant="h5" className="dark:text-slate-200 my-5">
                    Зображення
                </Typography>
                <Card variant="filled" className="p-2 bg-gray-600/20 mb-2">
                    <ImageGallery allowNonImageType={false} data={imageAttachments}
                                  isDisabled={isReadOnly || !canUpdateRow}
                                  onUpdateList={handleUpdateImageList}
                                  onDeleteAttachment={handleDeleteAttachment}
                                  isLoading={attachImages.isPending}/>
                </Card>
                <Typography variant="h5" className="dark:text-slate-200 my-5">
                    Додатки
                </Typography>
                <Card variant="filled" className="p-2 bg-gray-600/20 mb-2">
                    <DocumentGallery data={wordAttachments}
                                     isDisabled={isReadOnly || !canUpdateRow}
                                     onUpdateList={handleUpdateDocumentList}
                                     onDeleteAttachment={handleDeleteAttachment}
                                     isLoading={attachDocuments.isPending}/>
                </Card>
            </LoadingDialogBody>
            <DialogFooter className="shrink-0">
                <Button
                    variant="text"
                    color="red"
                    onClick={handleCloseModal}
                    className="mr-1"
                >
                    <span>Закрити</span>
                </Button>
                {
                    canUpdateRow &&
                    <LoadingButton isLoading={update.isPending} variant="gradient" color="green" onClick={onSubmit}
                                   disabled={update.isPending}>
                        Редагувати
                    </LoadingButton>
                }
            </DialogFooter>
        </Dialog>
    );
};

export default TaskDetailsModal;
