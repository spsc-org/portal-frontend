import {observer} from "mobx-react-lite";
import {Gallery} from "react-photoswipe-gallery";
import ImageUploading from "react-images-uploading";
import {IconButton, Spinner, Typography} from "@material-tailwind/react";
import {useViewModel} from "../shared/mvvm/useViewModel.js";
import {FileDownloadViewModel} from "../entities/file/FileDownloadViewModel.js";
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

    const maxNumber = 20;
    const downloads = useViewModel((deps) => new FileDownloadViewModel(deps));

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
                                onClick={() => downloads.download(attachment)}
                                title="Завантажити"
                                className="absolute opacity-0 group-hover:opacity-100 flex justify-center items-center w-full rounded-lg h-full top-0 left-0 bg-blue-700/30 group-hover:bg-blue-700/50 transition-all"
                            >
                                <LoadingButton color="black"
                                               isLoading={downloads.isPending(attachment?.id)}>
                                    <i className="fa-regular fa-download text-2xl text-blue-600"></i>
                                </LoadingButton>
                            </div>
                            {!isDisabled && Boolean(onDeleteAttachment) &&
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
                !isDisabled &&
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

export default observer(DocumentGallery);
