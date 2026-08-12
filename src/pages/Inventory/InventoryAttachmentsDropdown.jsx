import React, {useMemo, useState} from "react";
import {Button, Popover, PopoverContent, PopoverHandler, Spinner} from "@material-tailwind/react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {usePage} from "@inertiajs/react";
import {downloadFile} from "@/utils.js";
import toast from "react-hot-toast";
import CustomToast from "@/Components/CustomToast.jsx";

const InventoryAttachmentsDropdown = ({id, count = 0}) => {
    const [downloadingFileId, setDownloadingFileId] = useState(null);
    const [openMenu, setOpenMenu] = useState(false);

    const {auth} = usePage().props;
    const {data, isPending: decreePending} = useQuery({
        queryKey: ["decree", id], queryFn: async () => {
            const response = await axios.get(`api/inventory/${id}`, {
                headers: {"userId": auth?.user?.id}
            })
            return response?.data;
        }, enabled: !!openMenu
    });

    const files = useMemo(() => data?.attachments || [], [data])

    const {mutate: getFile, isPending} = useMutation({
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
        },
        onSettled: () => {
            setDownloadingFileId(null);

        }
    });

    const handleDownload = ({fileUrl, id}) => () => {
        if (fileUrl) {
            setDownloadingFileId(id);
            getFile(fileUrl);
        }
    }


    return (
        <Popover open={openMenu} placement="bottom-end" handler={setOpenMenu}>
            <PopoverHandler>
                <Button
                    disabled={count === 0}
                    size="sm"
                    variant="filled"
                    className="flex items-center gap-1 capitalize tracking-normal p-2"
                >
                    {count} {" "}
                    <i className={`fa-regular text-xs fa-chevron-down transition-transform ${openMenu ? "rotate-180" : ""}`}></i>
                </Button>
            </PopoverHandler>
            <PopoverContent className="p-2 w-90 min-h-[8rem]">
                <div className="w-full flex flex-col gap-2">
                    {
                        decreePending ?
                            <Spinner className="h-12 w-12"/>
                            :
                            <div className="flex flex-col justify-center w-full">
                                <span className="text-sm font-medium">Файли:</span>
                                {Boolean(files.length) ? files.map((attachment) => (
                                        <div key={id} className="flex items-center gap-2 mb-1">
                            <span color="blue-gray" className="text-xs flex-1">
                                {attachment.fileName}
                            </span>
                                            <Button size="sm" disabled={isPending && downloadingFileId === id}
                                                    onClick={handleDownload(attachment)}>
                                                {isPending && downloadingFileId === id ?
                                                    <Spinner className="h-4 w-4"/>
                                                    :
                                                    <i className="fa-regular fa-download"></i>
                                                }
                                            </Button>
                                        </div>
                                    ))
                                    : <span className="text-xs text-center">Файли відсутні</span>
                                }
                            </div>
                    }

                </div>
            </PopoverContent>
        </Popover>
    );
};

export default InventoryAttachmentsDropdown;
