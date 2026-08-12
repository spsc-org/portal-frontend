import {usePage} from "@inertiajs/react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import {format} from "date-fns";
import React from "react";
import {BOOLEANS, downloadFile, SANC_DECREE_TYPES} from "@/utils.js";
import toast from "react-hot-toast";
import CustomToast from "@/Components/CustomToast.jsx";

const DecreeModal = ({selectedId, open = false, onClose}) => {
    const {auth, users} = usePage().props;
    const {data = {data: null, files: []}} = useQuery({
        queryKey: ["decree", selectedId], queryFn: async () => {
            const response = await axios.get(`api/decree/${selectedId}`, {
                headers: {"userId": auth?.user?.id}
            })
            return response?.data;
        }, enabled: !!selectedId
    });
    const {mutate: getFile} = useMutation({
        mutationFn: async (path) => {
            const response = await axios.get('/api/file', {
                params: {
                    path: path
                }, headers: {
                    "userId": auth?.user?.id, 'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }, responseType: 'blob',
            });
            const contentDisposition = response.headers["content-disposition"];
            let filename = "downloaded_file";
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
                if (filenameMatch) {
                    filename = decodeURIComponent(filenameMatch[1]);
                } else {
                    const plainFilenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
                    if (plainFilenameMatch) {
                        filename = plainFilenameMatch[1];
                    } else {
                        const unquotedFilenameMatch = contentDisposition.match(/filename=([^;,\s]+)/i);
                        if (unquotedFilenameMatch) {
                            filename = unquotedFilenameMatch[1];
                        }
                    }
                }
            }
            downloadFile(response.data, filename);
        },
        onError: error => {
            const contentType = error.response.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        if (errorData?.message) {
                            toast.custom((t) => <CustomToast t={t} message={errorData?.message}/>)
                        } else {
                            toast.custom((t) => <CustomToast t={t} message={"Виникла помилка завантаження."}/>)
                        }
                    } catch (e) {
                        console.error("Failed to parse error JSON");
                    }
                };
                reader.readAsText(error.response.data);
            }
        }
    });

    const {data: decree = null, files = []} = data;
    const decreeFile = files.find(file => file?.file_type === 1) || null;
    const attachmentFiles = files.filter(file => file?.file_type === 2);

    const handleDownload = (path) => (event) => {
        event.preventDefault();
        if (path) {
            getFile(path);
        }

    }

    return (<Dialog open={open} handler={onClose} size="md">
        <DialogHeader className="dark:text-gray-200">
                <span className="mr-5">Указ: {decree?.code}
                    <span>{Boolean(decree?.date) ? ` від ${format(decree?.date, "dd.MM.yyyy")}` : null}</span>
                </span>
            {Boolean(decree?.link) && <a title={decree?.link} href={decree?.link} target="_blank">
                <Button size="sm"
                        variant="outlined"
                        color="blue">
                    <i className="fa-regular fa-arrow-up-right-from-square"></i>
                </Button>
            </a>}
        </DialogHeader>
        <DialogBody className="h-[26rem] overflow-y-auto">
            <div className="grid grid-cols-2 mb-2">
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Код:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.code}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Тип:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.typeId ? SANC_DECREE_TYPES.find(i => i.value === decree?.typeId)?.label : ""}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Дата:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.date ? format(decree?.date, "dd.MM.yyyy") : "-"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Діючий:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.isActive ? BOOLEANS.find(i => parseInt(i.value) === decree?.isActive).label : ""}</p>
                </div>

                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">rnboId:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.rnboId}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Створив:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.createdUserId}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Дата створення:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.created_at ? format(decree?.created_at, "dd.MM.yyyy") : "-"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Змінив:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.updatedUserId}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Дата зміни:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.updated_at ? format(decree?.updated_at, "dd.MM.yyyy") : "-"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Дата видалення:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.deleted_at ? format(decree?.deleted_at, "dd.MM.yyyy") : "-"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Коментар:</p>
                    <p className="font-normal dark:text-slate-400">{decree?.comment}</p>
                </div>
            </div>
            <Typography variant="h5" className="dark:text-gray-50">Указ:</Typography>
            <div className="mt-2">
                {Boolean(decreeFile) ? <div className="inline-flex gap-x-2">
                    <div className="inline-flex min-w-80 p-2 rounded-md bg-gray-200">
                        <Typography variant="small"
                                    className="w-full leading-none">{decreeFile?.name}</Typography>
                    </div>
                    {/*<a target="_blank" href={`/storage/${encodeURIComponent(decreeFile?.path)}`}>*/}
                        <Button
                            onClick={handleDownload(decreeFile?.path)}
                            size="sm"
                            title="Завантажити"
                            color="blue">
                            <i className="fa-regular fa-download"></i>
                        </Button>
                    {/*</a>*/}
                </div> : <Typography variant="body2"
                                     className="font-normal dark:text-slate-400"
                >Указ відсутній</Typography>}
            </div>
            <Typography variant="h5" className="dark:text-gray-50">Додатки:</Typography>
            <div className="mt-2 max-h-60 shadow-lx overflow-auto">
                {Boolean(attachmentFiles.length) ?
                    <div className="flex flex-col gap-2"> {attachmentFiles.map((file, index) => {
                        return (<div key={index} className="inline-flex gap-x-2">
                            <span className="font-normal dark:text-slate-400">{index + 1}.</span>
                            <div className="inline-flex min-w-80 p-2 rounded-md bg-gray-200">
                                <Typography variant="small"
                                            className="w-full leading-none">{file?.name}</Typography>
                            </div>
                            <Button
                                onClick={handleDownload(file?.path)}
                                size="sm"
                                title="Завантажити"
                                color="blue">
                                <i className="fa-regular fa-download"></i>
                            </Button>
                        </div>)
                    })}</div> : <Typography variant="body2" color="textSecondary"
                                            className="font-normal dark:text-slate-400"
                    >Додатки відсутні</Typography>}
            </div>

        </DialogBody>
        <DialogFooter>
            <Button
                variant="text"
                color="red"
                onClick={onClose}
                className="mr-1">
                <span>Закрити</span>
            </Button>
        </DialogFooter>
    </Dialog>);
};

export default DecreeModal;
