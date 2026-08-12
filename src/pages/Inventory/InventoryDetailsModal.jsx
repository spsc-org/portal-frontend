import React, {useMemo, useState} from "react";
import {
    Button, Card,
    Dialog,
    DialogFooter,
    DialogHeader,
    IconButton,
    Spinner,
    Tab,
    TabPanel,
    Tabs,
    TabsBody,
    TabsHeader
} from "@material-tailwind/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {usePage} from "@inertiajs/react";
import DocumentGallery from "../../Components/DocumentGallary.jsx";
import {useFilteredAttachments} from "../../hooks/useFilteredAttachments.jsx";
import toast from "react-hot-toast";
import {LoadingDialogBody} from "../../Components/Buttons/LoadingDialogBody.jsx";
import ImageGallery from "../../Components/ImageGallery.jsx";
import axios from "axios";

// --- AUDIT COMPONENTS START ---

const FIELD_LABELS = {
    caption: 'Опис',
    serial: 'Серійний номер',
    inventoryNum: 'Інвентарний номер',
    registryNum: 'Реєстр. №',
    amount: 'Кількість',
    cost: 'Вартість',
    valueTypeId: 'Тип',
    locationId: 'Розташування',
    baileeUserId: 'Відповідальний',
    responsibleUserId: 'Мат. відповідальний',
    invoice: 'Накладна',
    note: 'Примітка',
    details: 'Деталі',
};

const ACTION_CONFIG = {
    create:        {label: 'Створено',          color: 'bg-green-100 text-green-800'},
    clone:         {label: 'Створено копію',    color: 'bg-teal-100 text-teal-800'},
    update:        {label: 'Оновлено',          color: 'bg-blue-100 text-blue-800'},
    delete:        {label: 'Видалено',          color: 'bg-red-100 text-red-800'},
    restore:       {label: 'Відновлено',        color: 'bg-orange-100 text-orange-800'},
    node_attach:   {label: 'Додано до вузла',   color: 'bg-purple-100 text-purple-800'},
    node_detach:   {label: 'Видалено з вузла',  color: 'bg-pink-100 text-pink-800'},
    file_attach:    {label: 'Додано файл',       color: 'bg-indigo-100 text-indigo-800'},
    file_detach:    {label: 'Видалено файл',    color: 'bg-gray-100 text-gray-800'},
    comment_add:    {label: 'Коментар додано',  color: 'bg-cyan-100 text-cyan-800'},
    comment_edit:   {label: 'Коментар змінено', color: 'bg-cyan-100 text-cyan-700'},
    comment_delete: {label: 'Коментар видалено',color: 'bg-gray-100 text-gray-600'},
    legacy_update:  {label: 'Змінено (архів)',  color: 'bg-gray-100 text-gray-600'},
};

const ActionBadge = ({action}) => {
    const cfg = ACTION_CONFIG[action] || {label: action, color: 'bg-gray-100 text-gray-800'};
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

const AuditEntry = ({entry, dictionary, inventoryType, inventoryLocation}) => {
    const [open, setOpen] = useState(true);
    const userName = dictionary?.user?.find(u => u.id === entry.userId)?.caption || `#${entry.userId}`;

    // Convert diff object to array of [field, {from, to}]
    const diffEntries = [];
    if (entry.diff?.changed) {
        Object.entries(entry.diff.changed).forEach(([key, val]) => {
            diffEntries.push([key, {from: val.fromLabel ?? val.from, to: val.toLabel ?? val.to}]);
        });
    }
    if (entry.diff?.added) {
        Object.entries(entry.diff.added).forEach(([key, val]) => {
            const v = (val && typeof val === 'object' && 'label' in val) ? val.label : val;
            diffEntries.push([key, {from: null, to: v}]);
        });
    }
    if (entry.diff?.removed) {
        Object.entries(entry.diff.removed).forEach(([key, val]) => {
            const v = (val && typeof val === 'object' && 'label' in val) ? val.label : val;
            diffEntries.push([key, {from: v, to: null}]);
        });
    }

    const formatValue = (field, value) => {
        if (value === null || value === undefined || value === '') return <span className="text-gray-400 italic">—</span>;
        // Check vocabularies if labels are not provided in diff (though AuditService usually provides labels)
        // For inventory specific fields if needed
        if (field === 'valueTypeId') return inventoryType?.find(t => t.id === value)?.caption || value;
        if (field === 'locationId') return inventoryLocation?.find(l => l.id === value)?.caption || value;

        return String(value);
    };

    return (
        <div className="border rounded-lg mb-2 overflow-hidden dark:border-gray-600">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
                <div className="flex items-center gap-x-3">
                    <ActionBadge action={entry.action}/>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{entry.createdAt}</span>
                    <span className="text-xs dark:text-gray-300">{userName}</span>
                    {entry.action === 'legacy_update' && entry.context ? (
                        <span className="text-xs text-gray-400">({Object.keys(entry.context).length} зм.)</span>
                    ) : entry.context?.name ? (
                        <span className="text-xs text-purple-500 dark:text-purple-400">{entry.context.name}</span>
                    ) : entry.context?.fileName ? (
                        <span className="text-xs text-blue-500 dark:text-blue-400">{entry.context.fileName}</span>
                    ) : entry.action === 'clone' && entry.context?._clonedFrom ? (
                        <span className="text-xs text-teal-500 dark:text-teal-400">з #{entry.context._clonedFrom}</span>
                    ) : entry.action?.startsWith('comment') && entry.context?.comment ? (
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 truncate max-w-[300px]">{entry.context.comment}</span>
                    ) : entry.action === 'comment_edit' && entry.context?.to ? (
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 truncate max-w-[300px]">{entry.context.to}</span>
                    ) : diffEntries.length > 0 ? (
                        <span className="text-xs text-gray-400">({diffEntries.length} зм.)</span>
                    ) : null}
                </div>
                <i className={`fa-regular fa-chevron-${open ? 'up' : 'down'} text-gray-400 text-xs`}/>
            </button>

            {open && (
                <div className="px-3 py-2 dark:bg-gray-800">
                    {entry.action === 'legacy_update' && entry.context ? (
                        <table className="w-full text-xs">
                            <thead>
                            <tr className="text-left text-gray-500 dark:text-gray-400">
                                <th className="pb-1 w-1/4">Поле</th>
                                <th className="pb-1 w-[37.5%]">Було</th>
                                <th className="pb-1 w-[37.5%]">Стало</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(entry.context).map(([field, val]) => {
                                const [oldVal, newVal] = Array.isArray(val) ? val : [null, val];
                                return (
                                    <tr key={field} className="border-t dark:border-gray-600">
                                        <td className="py-1 font-medium dark:text-gray-300">
                                            {FIELD_LABELS[field] || field}
                                        </td>
                                        <td className="py-1 text-red-500 dark:text-red-400">
                                            {formatValue(field, oldVal)}
                                        </td>
                                        <td className="py-1 text-green-600 dark:text-green-400">
                                            {formatValue(field, newVal)}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    ) : entry.context?.name ? (
                        <p className="text-xs dark:text-gray-300">
                            Вузол:&nbsp;
                            <span className="font-medium text-purple-700 dark:text-purple-300">
                                {entry.context.name}
                            </span>
                        </p>
                    ) : entry.context?.fileName ? (
                        <p className="text-xs dark:text-gray-300">
                            Файл:&nbsp;
                            <span className="font-medium text-blue-700 dark:text-blue-300">
                                {entry.context.fileName}
                            </span>
                        </p>
                    ) : entry.action === 'comment_add' || entry.action === 'comment_delete' ? (
                        <p className="text-xs dark:text-gray-300 break-words">
                            {entry.context?.comment}
                        </p>
                    ) : entry.action === 'comment_edit' ? (
                        <div className="flex flex-col gap-1 text-xs">
                            <p className="text-red-500 dark:text-red-400 line-through">{entry.context?.from}</p>
                            <p className="text-green-600 dark:text-green-400">{entry.context?.to}</p>
                        </div>
                    ) : diffEntries.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Немає змін у відстежуваних полях</p>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                            <tr className="text-left text-gray-500 dark:text-gray-400">
                                <th className="pb-1 w-1/4">Поле</th>
                                <th className="pb-1 w-[37.5%]">Було</th>
                                <th className="pb-1 w-[37.5%]">Стало</th>
                            </tr>
                            </thead>
                            <tbody>
                            {diffEntries.map(([field, {from, to}]) => (
                                <tr key={field} className="border-t dark:border-gray-600">
                                    <td className="py-1 font-medium dark:text-gray-300">
                                        {FIELD_LABELS[field] || field}
                                    </td>
                                    <td className="py-1 text-red-500 dark:text-red-400">
                                        {formatValue(field, from)}
                                    </td>
                                    <td className="py-1 text-green-600 dark:text-green-400">
                                        {formatValue(field, to)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

// --- AUDIT COMPONENTS END ---

const InventoryDetailsModal = ({open, id, onClose, dictionary, readOnly = false}) => {
    const {token, auth} = usePage().props;
    const queryClient = useQueryClient();
    const inventoryLocation = dictionary?.inventoryLocation ?? [];
    const inventoryType = dictionary?.inventoryType ?? [];
    const users = dictionary?.user ?? [];
    const responsibleUsers = dictionary?.responsibleUser ?? [];
    const [tab, setTab] = useState("info");
    const [auditPage, setAuditPage] = useState(1);

    const updateLocalInventoryCount = () => {
        queryClient.invalidateQueries({queryKey: ['inventories']});
    };

    // Основні дані
    const {data, isFetching: isDictionaryFetching} = useQuery({
        queryKey: ['inventory-deitals', id],
        queryFn: async () => {
            const response = await axios.get(`api/inventory/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response?.data;
        },
        enabled: !!id,
    });

    // Історія змін (новий аудит)
    const {data: auditData, isFetching: auditLoading} = useQuery({
        queryKey: ['inventory-audit', id, auditPage],
        queryFn: async () => {
            const res = await axios.get(`/api/inventory/${id}/audit`, {
                 headers: {"userId": auth?.user?.id},
                 params: {page: auditPage, limit: 50},
            });
            return res.data;
        },
        enabled: !!id && tab === 'history',
    });

    const {imageAttachments, wordAttachments} = useFilteredAttachments(data?.attachments);

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
            const response = await axios.post(`/api/inventory/${id}/attach-file`,
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
        onSuccess: async (responseData) => {
            const {files, attachments_count} = responseData;
            if (attachments_count !== undefined) {
                updateLocalInventoryCount(attachments_count);
            }
            if (!files.length) return;
            files.forEach(({fileName}) => {
                return (
                    toast.success(`Вкладення ${fileName} успішно завантажено`, {
                        style: {
                            background: 'dark:dark:bg-slate-800',
                            color: 'text-slate-400',
                        },
                    })
                )
            })
        },
        onError: async () => toast.error('Помилка завантаження вкладення'),
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['inventory-deitals', id]});
                queryClient.invalidateQueries({queryKey: ['inventory-audit', id]});
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
            const response = await axios.post(`/api/inventory/${id}/attach-file`,
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
        onSuccess: async (responseData) => {
            const {files, attachments_count} = responseData;
            if (attachments_count !== undefined) {
                updateLocalInventoryCount(attachments_count);
            }
            if (!files.length) return;
            files.forEach(({fileName}) => {
                return (
                    toast.success(`Вкладення ${fileName} успішно завантажено`, {
                        style: {
                            background: 'dark:dark:bg-slate-800',
                            color: 'text-slate-400',
                        },
                    })
                )
            })
        },
        onError: async (error) => {
            return toast.error('Помилка завантаження вкладення');
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['inventory-deitals', id]});
                queryClient.invalidateQueries({queryKey: ['inventory-audit', id]});
            }
        },
    });

    const canUpdateRow = useMemo(() => {
        if (!data?.data) return;
        const permission = auth?.user?.permissions?.pages?.inventory?.update;
        if (data?.data?.deletedAt) return false;
        if (permission === 'individual') {
            return data?.data?.createdUserId === auth?.user?.id;
        }
        if (permission === true) return true;
        return false;
    }, [data?.data, id, auth]);

    const isReadOnly = useMemo(() => {
        return Boolean(data?.data?.deletedAt) || readOnly
    }, [readOnly, data]);


    const deleteAttachment = useMutation({
        mutationFn: async (attachment) => {
            const response = await axios.delete(`/api/inventory/delete-file/${attachment.id}`,
                {
                    headers: {
                        "X-CSRF-Token": token,
                        "userId": auth.user.id,
                    }
                }
            );
            return response.data;
        },
        onSuccess: async (responseData) => {
            const {fileName, attachments_count} = responseData;
            if (attachments_count !== undefined) {
                updateLocalInventoryCount(attachments_count);
            }
            toast.success(`Вкладення ${fileName} видалено успішно`);
        },
        onError: async () => toast.error('Помилка видалення вкладення'),
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ['inventory-deitals', id]});
            queryClient.invalidateQueries({queryKey: ['inventory-audit', id]});
        }
    });


    const handleUpdateDocumentList = (documentList = []) => {
        if (!documentList.length) return
        attachDocuments.mutate(documentList);
    }

    const handleUpdateImageList = (imageList = []) => {
        if (!imageList.length) return
        attachImages.mutate(imageList);
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

    const auditHistory = auditData?.data ?? [];
    const auditTotal   = auditData?.total ?? 0;
    const auditPages   = auditData?.pages ?? 1;


    return (
        <Dialog data-i-doc="modal:inventory-details" open={open} size="xxl" className="dark:bg-gray-800" handler={onClose}>
            <DialogHeader className="dark:text-gray-200">
                <span className="mr-5">Детальна інформація {data?.data?.caption}</span>
                <a className="block"  href={`/inventory/${id}/export`}
                   target="_blank">
                    <IconButton disabled={!id} variant="outlined" color="blue">
                        <i className="fa-regular fa-print"></i>
                    </IconButton>
                </a>
            </DialogHeader>
            <LoadingDialogBody isLoading={isDictionaryFetching} className="min-h-[32rem] h-full relative overflow-y-auto">


                        <Tabs value={tab}>
                            <TabsHeader className="bg-transparent" indicatorProps={{
                                className: "bg-gray-900/10 dark:bg-blue-900/50 shadow-none !text-gray-900",
                            }}>
                                <Tab value="info" onClick={() => setTab("info")} className="dark:text-gray-50">Загальна інформація</Tab>
                                <Tab value="history" onClick={() => setTab("history")} className="dark:text-gray-50">
                                    <div className="flex flex-row items-center gap-x-2">
                                        Аудит змін
                                        {auditTotal > 0 && (
                                            <div className="relative h-[20px] w-[20px] bg-gray-950 dark:bg-gray-950 rounded-full">
                                                <span className="absolute text-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                                                    {auditTotal}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Tab>
                            </TabsHeader>
                            <TabsBody className="overflow-auto">
                                <TabPanel data-i-doc="tab:inventory-details-info" value="info">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">itemId:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.id}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Накладна:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.invoice}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:dark:text-gray-400 font-bold ">Опис:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.caption}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Деталі:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.details}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Серійний номер:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.serial}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Інв. номер:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.inventoryNum}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Реєстр. №:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.registryNum}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Кількість:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.amount}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Вартість:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.cost}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Тип:</p>
                                            <p className="dark:text-slate-400 ">{inventoryType?.find(d => d.id === data?.data?.valueTypeId)?.caption}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Розташування:</p>
                                            <p className="dark:text-slate-400 ">{inventoryLocation?.find(d => d.id === data?.data?.locationId)?.caption}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Мат. відповідальний:</p>
                                            <p className="dark:text-slate-400 ">{responsibleUsers?.find(d => d.id === data?.data?.responsibleUserId)?.caption}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Відповідальний:</p>
                                            <p className="dark:text-slate-400 ">{users?.find(d => d.id === data?.data?.baileeUserId)?.caption}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Дата створення:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.createdAt}</p>
                                        </div>
                                        <div className="flex flex-row gap-x-2"/>
                                        <div className="flex flex-row gap-x-2">
                                            <p className="dark:text-gray-400 font-bold ">Дата редагування:</p>
                                            <p className="dark:text-slate-400 ">{data?.data?.updatedAt}</p>
                                        </div>
                                        {data?.data?.deletedAt &&
                                            <>
                                                <div className="flex flex-row gap-x-2">
                                                    <p className="dark:text-gray-400 font-bold ">Дата видалення:</p>
                                                    <p className="dark:text-slate-400 ">{data?.data?.deletedAt}</p>
                                                </div>
                                                <div className="flex flex-row gap-x-2">
                                                    <p className="dark:text-gray-400 font-bold">Останній змінив:</p>
                                                    <p className="dark:text-slate-400 ">{dictionary?.user?.find(d => d.id === data?.data?.updatedUserId)?.caption}</p>
                                                </div>
                                            </>

                                        }
                                    </div>
                                    <div className="mt-4 flex flex-row gap-x-2">
                                        <p className="dark:text-gray-400 font-bold ">Примітка:</p>
                                        <p className="dark:text-slate-400 flex-1">{data?.data?.note}</p>
                                    </div>
                                    <Card variant="filled" className="p-2 bg-gray-600/20 mb-2">
                                        <ImageGallery allowNonImageType={false} data={imageAttachments}
                                                      isDisabled={isReadOnly || !canUpdateRow}
                                                      onUpdateList={handleUpdateImageList}
                                                      onDeleteAttachment={handleDeleteAttachment}
                                                      isLoading={attachImages.isPending}/>
                                    </Card>
                                    <Card variant="filled" className="p-2 bg-gray-600/20 mb-2">
                                        <DocumentGallery data={wordAttachments}
                                                         isDisabled={isReadOnly || !canUpdateRow}
                                                         onUpdateList={handleUpdateDocumentList}
                                                         onDeleteAttachment={handleDeleteAttachment}
                                                         isLoading={attachDocuments.isPending}/>
                                    </Card>
                                </TabPanel>
                                {/*   HISTORY */}
                                <TabPanel data-i-doc="tab:inventory-details-history" value="history">
                                    {auditLoading
                                        ? <div className="flex justify-center py-4"><Spinner className="h-8 w-8"/></div>
                                        : auditHistory.length === 0
                                            ? <p className="text-sm text-gray-400 italic">Записів аудиту немає</p>
                                            : <>
                                                {auditHistory.map(entry => (
                                                    <AuditEntry
                                                        key={entry.id}
                                                        entry={entry}
                                                        dictionary={dictionary}
                                                        inventoryType={inventoryType}
                                                        inventoryLocation={inventoryLocation}
                                                    />
                                                ))}
                                                {auditPages > 1 && (
                                                    <div className="flex items-center justify-center gap-x-2 mt-3">
                                                        <button
                                                            disabled={auditPage <= 1}
                                                            onClick={() => setAuditPage(p => p - 1)}
                                                            className="px-3 py-1 text-xs rounded border dark:border-gray-600 disabled:opacity-40"
                                                        >‹ Новіші</button>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {auditPage} / {auditPages}
                                                        </span>
                                                        <button
                                                            disabled={auditPage >= auditPages}
                                                            onClick={() => setAuditPage(p => p + 1)}
                                                            className="px-3 py-1 text-xs rounded border dark:border-gray-600 disabled:opacity-40"
                                                        >Старіші ›</button>
                                                    </div>
                                                )}
                                            </>
                                    }
                                </TabPanel>
                                {/*    END HISTORY*/}
                            </TabsBody>
                        </Tabs>
            </LoadingDialogBody>
            <DialogFooter>
                <Button className="mt-20" onClick={onClose} color="gray">
                    <span>Закрити</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default InventoryDetailsModal;
