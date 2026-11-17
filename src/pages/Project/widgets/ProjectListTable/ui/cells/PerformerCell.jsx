
// Порт колонки "Вик.": ініціали виконавця (повна інформація — у підказці) + вкладення (крім фото).
// onDownload — команда ViewModel (attachmentId, filename).
const fileIcon = (mimeType = "") => {
    if (mimeType.includes("pdf")) return "fa-file-pdf text-red-500";
    if (mimeType.includes("image")) return "fa-file-image text-blue-500";
    if (mimeType.includes("word") || mimeType.includes("document")) return "fa-file-word text-blue-600";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "fa-file-excel text-green-600";
    return "fa-file text-gray-500";
};

const PerformerCell = ({ row, precomputedData, users, onDownload }) => {
    const byId = (id) => users.find((u) => u.id === id);
    const performer = byId(row.performerId);
    const validator = byId(row.validatorId);
    const creator = byId(row.createdUserId);
    const files = (Array.isArray(precomputedData?.attachments) ? precomputedData.attachments : []).filter((a) => a.type !== "photo");

    return (
        <>
            <span className="break-words" title={`Вик.:${performer?.caption} Валід.:${validator?.caption} Додав:${creator?.caption || "--"}`}>
                {performer?.initials || "---"}
            </span>
            {files.map(({ id, original_name: name, mime_type: mimeType, uploaded_by: uploadedBy }) => {
                const uploader = byId(uploadedBy);
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onDownload(id, name)}
                        title={`${name}${uploader ? ` | Завантажив: ${uploader.caption}` : ""}`}
                        className="mt-1 flex max-w-full items-center gap-1 text-left hover:text-blue-600 hover:underline dark:hover:text-blue-300"
                    >
                        <i className={`fa-regular ${fileIcon(mimeType)}`} />
                        <span className="truncate text-xs text-gray-600 dark:text-gray-400">{name?.length > 15 ? `${name.slice(0, 15)}...` : name}</span>
                    </button>
                );
            })}
        </>
    );
};

export default PerformerCell;
