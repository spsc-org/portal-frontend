import {useEffect} from "react";
import ImageUploading from "react-images-uploading";
import {Gallery, Item} from "react-photoswipe-gallery";
import "photoswipe/dist/photoswipe.css";
import {Spinner, Tooltip} from "@material-tailwind/react";
import {observer} from "mobx-react-lite";
import {useViewModel} from "../shared/mvvm/useViewModel.js";
import {FileDownloadViewModel} from "../entities/file/FileDownloadViewModel.js";

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

const isImageFile = (fileName = '') =>
    IMAGE_EXTENSIONS.includes((fileName.split('.').pop() || '').toLowerCase());

const iconByExtension = (extension = '') => {
    switch (extension.toLowerCase()) {
        case "xlsx":
        case "xls":
            return "fa-file-excel text-green-600";
        case "docx":
        case "doc":
            return "fa-file-word text-blue-500";
        case "pdf":
            return "fa-file-pdf text-red-500";
        default:
            return "fa-file text-slate-400";
    }
};

// Спільна компактна "плитка" вкладення (48px), як TagPill/аватарки в
// панелі — хрестик видалення з'являється лише на ховері
const Tile = ({onDelete, attachment, children}) => (
    <div className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
        {children}
        {Boolean(onDelete) &&
            <button type="button"
                    onClick={onDelete(attachment)}
                    title="Видалити файл"
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition group-hover:opacity-100">
                <i className="fa-solid fa-xmark text-[8px]"></i>
            </button>
        }
    </div>
);

const ImageThumb = ({attachment, onDelete}) => {
    // fileUrl — реально завантажений файл (сервер); data_url — локальний
    // прев'ю ще не завантаженого файлу (напр. форма зворотного зв'язку,
    // де вкладення відправляються лише після створення задачі).
    const src = attachment.fileUrl ? `${location.origin}/files?path=${attachment.fileUrl}` : attachment.data_url;
    return (
        <Item original={src} thumbnail={src} width={800} height={600} title={attachment.fileName}>
            {({ref, open}) => (
                <Tile attachment={attachment} onDelete={onDelete}>
                    <button ref={ref} type="button" onClick={open} title={attachment.fileName} className="block h-full w-full">
                        <img src={src} alt={attachment.fileName} className="h-full w-full object-cover"/>
                    </button>
                </Tile>
            )}
        </Item>
    );
};

const DocumentThumb = observer(({attachment, onDelete, downloads}) => {
    const isPending = downloads.isPending(attachment.id);

    // Без fileUrl файл ще не завантажений на сервер (локальна черга перед
    // відправкою форми) — показуємо іконку без можливості "завантажити".
    if (!attachment.fileUrl) {
        return (
            <Tile attachment={attachment} onDelete={onDelete}>
                <Tooltip content={attachment.fileName}>
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                        <i className={`fa-regular ${iconByExtension(attachment.fileName?.split('.').pop() || '')} text-lg`}></i>
                    </div>
                </Tooltip>
            </Tile>
        );
    }

    return (
        <Tile attachment={attachment} onDelete={onDelete}>
            <Tooltip content={attachment.fileName}>
                <button type="button" onClick={() => downloads.download(attachment)}
                        title="Завантажити"
                        className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {isPending
                        ? <Spinner className="h-4 w-4"/>
                        : <i className={`fa-regular ${iconByExtension(attachment.fileName?.split('.').pop() || '')} text-lg`}></i>}
                </button>
            </Tooltip>
        </Tile>
    );
});

/**
 * Компактний спільний контейнер вкладень (зображення + будь-які файли):
 * ряд маленьких плиток 48px (зображення — мініатюра+лайтбокс, інші —
 * іконка за розширенням, клік — завантаження) + така сама плитка "+" для
 * додавання в кінці ряду — вона ж зона drag&drop. Мінімальний слід у
 * компактній панелі задачі (на відміну від ImageGallery/DocumentGallery
 * з великими картками — ті лишаються для сторінок з великим вкладенням-центром).
 */
const AttachmentsGallery = ({data = [], isLoading = false, isDisabled = false, onUpdateList, onDeleteAttachment}) => {
    const maxNumber = 30;
    const downloads = useViewModel((deps) => new FileDownloadViewModel(deps));

    const handleUploadChange = (list) => {
        onUpdateList(list.filter(item => item?.file));
    };

    useEffect(() => {
        if (isDisabled || !onUpdateList) return;
        const handlePaste = (event) => {
            if (!event.clipboardData?.items) return;
            for (const item of event.clipboardData.items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = () => {
                        onUpdateList([...data, {data_url: reader.result, file, id: Date.now()}]);
                    };
                    reader.readAsDataURL(file);
                    event.preventDefault();
                    break;
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [data, onUpdateList, isDisabled]);

    return (
        <Gallery withDownloadButton withCaption>
            <div className="flex flex-wrap items-start gap-1.5">
                {data.map(attachment => (
                    <div key={attachment.id} className="flex w-14 flex-col items-center gap-0.5">
                        {isImageFile(attachment.fileName)
                            ? <ImageThumb attachment={attachment}
                                          onDelete={isDisabled ? undefined : onDeleteAttachment}/>
                            : <DocumentThumb attachment={attachment} downloads={downloads}
                                             onDelete={isDisabled ? undefined : onDeleteAttachment}/>}
                        <span title={attachment.fileName}
                              className="max-w-full truncate text-center text-[9px] leading-tight text-slate-500 dark:text-slate-400">
                            {attachment.fileName}
                        </span>
                    </div>
                ))}
                {!isDisabled &&
                    <ImageUploading
                        multiple
                        allowNonImageType
                        value={data}
                        onChange={handleUploadChange}
                        maxNumber={maxNumber}
                        dataURLKey="data_url"
                    >
                        {({isDragging, onImageUpload, dragProps}) => (
                            <Tooltip content="Додати файл (можна перетягнути або вставити з буфера)">
                                <button type="button"
                                        onClick={onImageUpload}
                                        disabled={isLoading}
                                        {...dragProps}
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed transition ${isDragging
                                            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-slate-300 hover:border-blue-400 hover:text-blue-500 dark:border-slate-600"}`}>
                                    {isLoading
                                        ? <Spinner className="h-4 w-4"/>
                                        : <i className="fa-regular fa-plus text-slate-400"></i>}
                                </button>
                            </Tooltip>
                        )}
                    </ImageUploading>
                }
                {!data.length && isDisabled &&
                    <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                }
            </div>
        </Gallery>
    );
};

export default AttachmentsGallery;
