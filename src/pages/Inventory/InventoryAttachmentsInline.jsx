import {Tooltip} from "@material-tailwind/react";

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

const isImage = (fileName) => {
    const ext = (fileName ?? '').split('.').pop().toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
};

const getFileIcon = (fileName) => {
    const ext = (fileName ?? '').split('.').pop().toLowerCase();
    if (['pdf'].includes(ext))                  return 'fa-regular fa-file-pdf text-red-500';
    if (['doc', 'docx'].includes(ext))          return 'fa-regular fa-file-word text-blue-500';
    if (['xls', 'xlsx', 'csv'].includes(ext))   return 'fa-regular fa-file-excel text-green-600';
    if (['zip', 'rar', '7z'].includes(ext))     return 'fa-regular fa-file-zipper text-yellow-500';
    return 'fa-regular fa-file text-gray-400';
};

const InventoryAttachmentsInline = ({attachments = []}) => {
    if (!attachments.length) return null;

    return (
        <div
            className="flex flex-wrap gap-1 items-center"
            onClick={e => e.stopPropagation()}
        >
            {attachments.map(att => (
                isImage(att.fileName) ? (
                    <Tooltip key={att.id} content={att.fileName}>
                        <a href={att.fileUrl} target="_blank" rel="noreferrer">
                            <img
                                src={att.fileUrl}
                                alt={att.fileName}
                                loading="lazy"
                                className="h-8 w-8 object-cover rounded border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                            />
                        </a>
                    </Tooltip>
                ) : (
                    <Tooltip key={att.id} content={att.fileName}>
                        <a href={att.fileUrl} target="_blank" rel="noreferrer" className="flex items-center">
                            <i className={`${getFileIcon(att.fileName)} text-xl leading-none`}/>
                        </a>
                    </Tooltip>
                )
            ))}
        </div>
    );
};

export default InventoryAttachmentsInline;
