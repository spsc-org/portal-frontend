import {useEffect} from "react";
import ImageUploading from "react-images-uploading";
import {Gallery, Item} from "react-photoswipe-gallery";
import "photoswipe/dist/photoswipe.css";
import {useImageSize} from "../hooks/useImageSize.jsx";
import { Spinner, Typography } from "@material-tailwind/react"
import IconButton from "./Buttons/IconButton.jsx"
import ImageSkeleton from "./Sekeleton/ImageSkeleton.jsx";

export default function ImageGallery({
                                         allowNonImageType = false,
                                         data = [],
                                         onUpdateList,
                                         isLoading = false,
                                         onDeleteAttachment,
                                         isDisabled = false,
                                     }) {
    const maxNumber = 20;

    const handleUploadChange = (imageList) => {
        onUpdateList(imageList.filter(image => image?.file));
    }


    useEffect(() => {
        if (isDisabled) return;
        const handlePaste = (event) => {
            if (event.clipboardData && event.clipboardData.items) {
                const items = event.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        const reader = new FileReader();
                        reader.onload = () => {
                            const newImage = {
                                data_url: reader.result,
                                file: file,
                                id: Date.now()
                            };
                            onUpdateList([...data, newImage]);
                        };
                        reader.readAsDataURL(file);
                        event.preventDefault();
                        break;
                    }
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [data, onUpdateList, isDisabled]);

    return (
        <>
            <Gallery withDownloadButton withCaption>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {data.map((attachment) => (
                        <ImageItem key={attachment.id} attachment={attachment}
                                   onDelete={isDisabled ? undefined : onDeleteAttachment}/>
                    ))}
                </div>
            </Gallery>
            {
                !isDisabled &&
                <ImageUploading
                    multiple
                    allowNonImageType={allowNonImageType}
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
                                            <i className="dark:text-gray-400 text-4xl fa-solid fa-file-import"></i>
                                    }
                                </div>
                                {!data.length &&
                                    <Typography variant="h5" className="dark:text-gray-400">Зображення
                                        відсутні</Typography>
                                }
                                <span
                                    className={`${isLoading && 'opacity-0'} dark:text-gray-400`}> Натисніть, вставте або
                                    перенесіть зображення сюди</span>
                            </div>
                        </div>
                    )}
                </ImageUploading>
            }
        </>
    );
}


function ImageItem({attachment, onDelete, key}) {
    const src =  `${location.origin}/files?path=${attachment.fileUrl}`;
    const {width, height} = useImageSize(src);
    if (!width || !height) {
        return (
            <ImageSkeleton/>
        );
    }

    return (
        <Item
            original={src}
            thumbnail={src}
            width={width}
            height={height}
            title={attachment.name}
        >
            {({ref, open}) => (
                <div
                    key={key}
                    ref={ref}
                    className="relative transition-transform duration-300 hover:scale-105 cursor-pointer"
                >
                    <img
                        src={src}
                        alt={attachment.name}
                        className="object-cover object-center w-full h-40 rounded-lg shadow-md"
                    />
                    <div
                        onClick={open}
                        title="Збільшити"
                        className="absolute flex justify-center items-center w-full rounded-lg h-full top-0 left-0 hover:bg-blue-700/50 transition"
                    >
                        <IconButton>
                            <i className="fa-regular fa-search text-2xl text-blue-600"></i>
                        </IconButton>
                    </div>
                    {Boolean(onDelete) &&
                        <div className="absolute top-0 translate-y-[-10px] translate-x-[10px]  right-0">
                            <IconButton onClick={onDelete(attachment)} size="sm" title="Видалити зображення">
                                <i className="fa-regular fa-times text-xl text-red-600"></i>
                            </IconButton>
                        </div>
                    }
                </div>
            )}
        </Item>
    );
}
