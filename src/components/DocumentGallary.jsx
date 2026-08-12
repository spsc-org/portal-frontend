import React, {useState} from "react";
import {Gallery} from "react-photoswipe-gallery";
import ImageUploading from "react-images-uploading";
import {IconButton, Spinner, Typography} from "@material-tailwind/react";
import {downloadFile} from "../utils.js";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import CustomToast from "./CustomToast.jsx";
import {usePage} from "@inertiajs/react";
import LoadingButton from "./Buttons/LoadingButton.jsx";

const getIconByExtension = (extension) => {
    switch (extension) {
        case "xlsx":
        case "xls":
            return <i className="fa-solid text-green-600 text-4xl fa-file-excel"></i>
        case "docx":
        case "doc":
            return <i className="fa-solid text-blue-600 text-4xl fa-file-word"></i>
        case "pdf":
            return <i className="fa-solid text-red-600 text-4xl fa-file-pdf"></i>
        default:
            return <i className="fa-solid text-4xl fa-file"></i>
    }
}

const DocumentGallery = ({
                             data = [],
                             isLoading = false,
                             isDisabled = false,
                             onDeleteAttachment,
                             onUpdateList,
                         }) => {

    const {auth} = usePage().props;
    const maxNumber = 20;
    const [downloadingFileId, setDownloadingFileId] = useState(null);


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
        }
    });

    const handleDownload = ({fileUrl, id}) => () => {
        if (fileUrl) {
            setDownloadingFileId(id);
            getFile(fileUrl);
        }
    }
    const handleUploadChange = (documents) => {
        onUpdateList(documents.filter(d => d?.file));
    }


    return (
        <>
            <Gallery withDownloadButton withCaption>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {data.map((attachment) => (
                        <div key={attachment.id}
                             className="relative transition flex flex-col justify-center flex-wrap items-center gap-1 rounded-lg bg-gray-300 py-10 group">
                            {getIconByExtension(attachment?.fileUrl.split(".")[1])}
                            <span className="text-xs text-slate-600">{attachment?.fileName}</span>
                            <div
                                onClick={handleDownload(attachment)}
                                title="Завантажити"
                                className="absolute opacity-0 group-hover:opacity-100 flex justify-center items-center w-full rounded-lg h-full top-0 left-0 bg-blue-700/30 group-hover:bg-blue-700/50 transition-all"
                            >
                                <LoadingButton color="black"
                                               isLoading={isPending && downloadingFileId === attachment?.id}>
                                    <i className="fa-regular fa-download text-2xl text-blue-600"></i>
                                </LoadingButton>
                            </div>
                            {!Boolean(isDisabled) && Boolean(onDeleteAttachment) &&
                                <div className="absolute top-0 translate-y-[-10px] translate-x-[10px]  right-0">
                                    <IconButton onClick={onDeleteAttachment(attachment)} size="sm" title="Видалити зображення">
                                        <i className="fa-regular fa-times text-xl text-red-600"></i>
                                    </IconButton>
                                </div>
                            }
                        </div>
                    ))}
                </div>
            </Gallery>
            {
                !Boolean(isDisabled) &&
                <ImageUploading
                    acceptType={["docx", "doc", "pdf", "xlsx", "xls"]}
                    multiple
                    allowNonImageType
                    value={data}
                    onChange={handleUploadChange}
                    maxNumber={maxNumber}
                    dataURLKey="data_url"
                >
                    {({
                          isDragging,
                          onImageUpload,
                          dragProps,
                      }) => (
                        <div className="mt-4">
                            <div
                                className={`p-4 ${isLoading && 'pointer-events-none bg-gray-950'} border-2 h-40 flex justify-center items-center flex-col border-dashed rounded cursor-pointer hover:bg-blue-50 ${isDragging && 'bg-blue-100'}`}
                                onClick={onImageUpload}
                                {...dragProps}
                            >
                                <div>
                                    {
                                        isLoading ? <Spinner className="h-20 w-20"/> :
                                            <i className="dark:text-slate-400 text-4xl fa-solid fa-file-import"></i>
                                    }
                                </div>
                                {!data.length  &&
                                    <Typography variant="h5" className="dark:text-slate-400">Додатки
                                        відсутні</Typography>
                                }
                                <span
                                    className={`${isLoading && 'opacity-0'} dark:text-slate-400`}>Натисніть, вставте або
                                    перенесіть додаток сюди</span>
                            </div>
                        </div>
                    )}
                </ImageUploading>
            }
        </>
    );
};

export default DocumentGallery;
