
// Локальний список файлів, обраних до збереження форми (ще не завантажені
// на бекенд) — з хрестиком видалення й кнопкою "Додати файл". Раніше
// продубльований буква в букву в CreateAnnouncementModal і
// CreateDeveloperPostModal. Для ВЖЕ завантажених вкладень існуючого запису —
// `Components/AttachmentsGallery.jsx`, це інший, простіший кейс (без
// прев'ю/видалення на сервері).
const PendingFilesList = ({files, onAdd, onRemove}) => (
    <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Файли{files.length > 0 ? ` (${files.length})` : ""}
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
            {files.map((file, index) => (
                <div key={`${file.name}-${index}`}
                     className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <i className="fa-regular fa-paperclip text-slate-400"></i>
                    <span className="max-w-[160px] truncate" title={file.name}>{file.name}</span>
                    <button type="button" onClick={() => onRemove(index)} title="Прибрати файл"
                            className="text-slate-400 transition hover:text-red-500">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            ))}
            <label className="flex h-8 items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2.5 text-xs text-slate-500 cursor-pointer transition hover:border-blue-400 hover:text-blue-500 dark:border-slate-600">
                <i className="fa-regular fa-plus"></i>
                Додати файл
                <input type="file" multiple onChange={onAdd} className="hidden"/>
            </label>
        </div>
    </div>
);

export default PendingFilesList;
