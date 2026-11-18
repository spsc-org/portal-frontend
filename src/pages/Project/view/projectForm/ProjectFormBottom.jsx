import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/index.js";
import { FieldNote } from "./controls.jsx";
import { CELL, LABEL, TEXTAREA, TH, TOOL_BUTTON, borderFor } from "./formStyles.js";
import { AddRowButton, RemoveRowButton, RowSelect } from "./ProjectFormLeft.jsx";

const DocumentsTable = observer(() => {
    const vm = useVM().projectForm;
    const { options } = vm;
    const error = (row, field) => vm.rowError("documents", row._key, field);
    const text = (row, field, type = "text") => (
        <input
            type={type}
            autoComplete="off"
            className={`${CELL} ${borderFor(error(row, field))}`}
            title={error(row, field)?.message}
            value={row[field] ?? ""}
            onChange={(event) => vm.updateRow("documents", row._key, { [field]: event.target.value })}
        />
    );
    return (
        <div className="mb-4">
            <span className={`${LABEL} mb-1.5 block`}>Документи</span>
            <table className="w-full overflow-hidden rounded-md border border-gray-200 text-sm dark:border-neutral-700">
                <thead className="bg-gray-50 dark:bg-neutral-900/60">
                    <tr>
                        <td className={`${TH} w-8`} />
                        <td className={`${TH} w-1/12`}>Вид</td>
                        <td className={`${TH} w-1/6`}>Реєстр.№</td>
                        <td className={`${TH} w-1/6`}>Дата</td>
                        <td className={`${TH} w-1/12`}>Пункт</td>
                        <td className={`${TH} w-1/12`}>Підрозділ</td>
                        <td className={TH}>Тека з матеріалами</td>
                        <td className={TH}>
                            Примітки <AddRowButton onClick={() => vm.addRow("documents")} />
                        </td>
                    </tr>
                </thead>
                <tbody>
                    {vm.form.documents.map((row) => (
                        <tr key={row._key} className="border-t border-gray-200 dark:border-neutral-700">
                            <td className="whitespace-nowrap p-1">
                                <RemoveRowButton onClick={() => vm.removeRow("documents", row._key)} />
                            </td>
                            <td className="p-1">
                                <RowSelect value={row.typeId} options={options.documentType} issue={error(row, "typeId")} empty={false} onChange={(value) => vm.updateRow("documents", row._key, { typeId: value })} />
                            </td>
                            <td className="p-1">{text(row, "regNum")}</td>
                            <td className="p-1">{text(row, "regDate", "date")}</td>
                            <td className="p-1">{text(row, "listItem")}</td>
                            <td className="relative p-1">
                                {vm.unitLookups[row._key] && <i className="fa-solid fa-spinner fa-spin absolute -left-1 top-3 text-xs text-gray-500" title="Пошук підрозділу" />}
                                <RowSelect value={row.unitId} options={options.initiator} issue={error(row, "unitId")} onChange={(value) => vm.updateRow("documents", row._key, { unitId: value })} />
                            </td>
                            <td className="p-1">{text(row, "path")}</td>
                            <td className="p-1">{text(row, "caption")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

const formatSize = (bytes) => {
    const size = Number(bytes)
    if (!size) return "";
    if (size < 1024) return `${size} Б`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
    return `${(size / 1024 / 1024).toFixed(1)} МБ`;
};

const photoUrl = (attachment) => attachment.fileUrl || `/public-file?path=${encodeURIComponent(attachment.file_path || attachment.filePath || "")}`;

const AttachmentItem = observer(({ attachment }) => {
    const vm = useVM().projectForm;
    const name = attachment.originalName || attachment.filename || "";
    const isPhoto = attachment.type === "photo";
    return (
        <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 transition-colors hover:border-gray-300 dark:border-gray-600 dark:bg-neutral-800 dark:hover:border-neutral-500">
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    {isPhoto ? (
                        <img src={photoUrl(attachment)} alt="" className="h-10 w-8 shrink-0 rounded border border-gray-200 object-cover dark:border-gray-600" />
                    ) : (
                        <i className="fa-regular fa-file w-5 shrink-0 text-center text-base text-gray-500 dark:text-gray-500" />
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-gray-700 dark:text-gray-300" title={name}>
                            {name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-500">
                            {isPhoto && <span className="shrink-0 text-violet-500 dark:text-violet-400">(фото)</span>}
                            {formatSize(attachment.size)}
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <button type="button" title="Завантажити" className="p-1 text-gray-600 hover:text-blue-500" onClick={() => vm.downloadAttachment(attachment)}>
                        <i className="fa-solid fa-download pointer-events-none" />
                    </button>
                    <button type="button" title="Видалити" className="p-1 text-gray-600 hover:text-red-500" onClick={() => vm.removeAttachment(attachment.id)}>
                        <i className="fa-solid fa-trash-can pointer-events-none" />
                    </button>
                </div>
            </div>
            <input
                type="text"
                placeholder="Коментар"
                defaultValue={attachment.comment ?? ""}
                onBlur={(event) => vm.saveAttachmentComment(attachment.id, event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), event.currentTarget.blur())}
                className="mt-1 h-6 w-full rounded border border-gray-200 bg-transparent px-1 text-xs text-gray-700 focus:border-blue-400 focus:outline-none dark:border-neutral-600 dark:text-gray-300"
            />
        </div>
    );
});

const Attachments = observer(() => {
    const vm = useVM().projectForm;
    const onDrop = (event) => {
        event.preventDefault();
        vm.upload(event.dataTransfer.files);
    };
    return (
        <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
                <span className={LABEL}>Вкладення</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-500">{vm.attachments.length ? `${vm.attachments.length} шт.` : ""}</span>
                    {vm.isEdit && (
                        <button type="button" className={TOOL_BUTTON} title="Додати фото або файл до суб'єкта" onClick={vm.toggleUpload}>
                            <i className="fa-solid fa-paperclip pointer-events-none" />
                            {vm.uploadOpen ? "Сховати" : "Додати вкладення"}
                        </button>
                    )}
                </div>
            </div>
            <div className="mb-1.5 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {vm.attachments.length === 0 ? (
                    <div className="py-1 text-xs text-gray-600 dark:text-gray-500">{vm.isEdit ? "Вкладень немає" : "Вкладення можна додати після створення проєкту"}</div>
                ) : (
                    vm.attachments.map((attachment) => <AttachmentItem key={attachment.id} attachment={attachment} />)
                )}
            </div>
            {vm.isEdit && vm.uploadOpen && (
                <div className="mt-2">
                    <div className="mb-2 flex items-center gap-4 text-xs text-gray-700 dark:text-gray-300">
                        <span className="text-gray-600 dark:text-gray-400">Тип:</span>
                        {[
                            ["file", "Файл"],
                            ["photo", "Ідентифікуюче фото"],
                        ].map(([type, title]) => (
                            <label key={type} className="flex cursor-pointer select-none items-center gap-1.5">
                                <input type="radio" name="attachmentType" className="cursor-pointer accent-blue-500 dark:[color-scheme:dark]" checked={vm.attachmentType === type} onChange={() => vm.setAttachmentType(type)} />
                                {title}
                            </label>
                        ))}
                    </div>
                    <label
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={onDrop}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-600 hover:border-blue-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-400"
                    >
                        <i className={`fa-solid ${vm.uploading ? "fa-spinner fa-spin" : "fa-cloud-arrow-up"}`} />
                        Перетягніть файли сюди або <span className="text-blue-500 underline">оберіть</span> (до 10 МБ)
                        <input type="file" multiple className="hidden" onChange={(event) => (vm.upload(event.target.files), (event.target.value = ""))} />
                    </label>
                </div>
            )}
        </div>
    );
});

/** Низ форми: документи, вкладення, примітки. */
const ProjectFormBottom = () => {
    const vm = useVM().projectForm;
    return (
        <>
            <DocumentsTable />
            <Attachments />
            <div className="mb-4">
                <label className="mb-1.5 block">
                    <span className={LABEL}>Примітки та проблемні питання</span> <FieldNote issue={vm.fieldError("notes")} />
                </label>
                <textarea
                    spellCheck
                    name="notes"
                    className={`${TEXTAREA} h-20 ${borderFor(vm.fieldError("notes"))}`}
                    placeholder="Коментарі та проблемні питання, пов'язані з пропозицією"
                    value={vm.form.notes ?? ""}
                    onChange={(event) => vm.setField("notes", event.target.value)}
                />
            </div>
        </>
    );
};

export default observer(ProjectFormBottom);
