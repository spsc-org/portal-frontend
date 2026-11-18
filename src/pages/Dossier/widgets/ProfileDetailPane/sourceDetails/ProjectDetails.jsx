import {Field, ListField} from "./fieldPrimitives.jsx";
import DictValue from "../../../shared/ui/DictValue.jsx";

// Вкладення живуть на диску 'public' (не config('app.app_storage')) — той самий шлях
// перегляду, що й у самих проєктів (ProjectAttachmentService), не Storage::disk()->url().
const attachmentUrl = (filePath) => `/public-file?path=${encodeURIComponent(filePath)}`;

const AttachmentValue = ({attachment}) => (
    <a
        href={attachmentUrl(attachment.filePath)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400"
    >
        <i className={`fa-solid ${attachment.isImage ? "fa-image" : "fa-file"} text-xs`}></i>
        {attachment.originalName ?? attachment.filename}
        <span className="text-gray-600 dark:text-gray-500">({attachment.formattedSize})</span>
    </a>
);

const DecreeValue = ({decree}) => {
    if (!decree) {
        return null;
    }
    const iconColor = decree.isActive ? "text-red-500 dark:text-red-400" : "text-gray-600 dark:text-gray-500";
    const date = decree.date ? decree.date.substring(0, 10) : null;

    return (
        <span className="inline-flex items-center gap-1.5">
            <i className={`fa-solid fa-file-certificate ${iconColor}`}></i>
            {decree.code}
            {date && <span className="text-xs text-gray-600 dark:text-gray-400">{date}</span>}
        </span>
    );
};

// Шаблон подання джерела project (код 1, чернетка) — читомий куратований набір полів
// (референс modalProjectCard/tab-general.blade.php, звужено до ключових для звірки
// дублікатів на прохання користувача, 2026-07-17). На відміну від дій НРБ/РНБО —
// тут навмисно НЕ "максимально все", а саме цей куратований підбір.
// drsId/subjectId/дата народження/ідентифікатори (тег/реєстраційний/паспорт) додано
// 2026-07-22 — потрібні для порівняння з ідентифікаторами конфліктуючих досьє (розбір
// конфліктів вимагає бачити ті самі "сирі" значення, що зберігаються у profile.identity_data).
const ProjectDetails = ({data, subjectTypes = [], projectActionType = [], projectState = [], identifierTypes = []}) => {
    const subjectType = subjectTypes.find((item) => item.id === data.subjectTypeId);
    const actionType = projectActionType.find((item) => item.id === data.actionType);
    const state = projectState.find((item) => item.id === data.stateId);

    return (
        <div className="flex flex-col gap-2">
            <Field label="Суб'єкт" value={<DictValue item={subjectType} fallback={data.subjectTypeId}/>}/>
            <Field label="Дія" value={<DictValue item={actionType} fallback={data.actionType}/>}/>
            <Field label="Стан" value={<DictValue item={state} fallback={data.stateId}/>}/>
            <Field label="Указ" value={<DecreeValue decree={data.decree}/>}/>
            <Field label="Назва українською" value={data.nameUk}/>
            <Field label="Назва російською" value={data.nameRu}/>
            <Field label="Мовою оригіналу" value={data.nameEn}/>
            <Field label="ДРС id (drsId)" value={data.drsId}/>
            <Field label="Дата народження" value={data.birthDate}/>
            <ListField
                label="Ідентифікатори"
                items={data.identifiers}
                renderItem={(identifier) => {
                    const type = identifierTypes.find((item) => item.id === identifier.identifierId);
                    return `${type?.caption ?? `тип #${identifier.identifierId}`}: ${identifier.value ?? "—"}`;
                }}
            />
            {data.attachments?.length > 0 && (
                <ListField
                    label="Вкладення"
                    items={data.attachments}
                    renderItem={(attachment) => <AttachmentValue attachment={attachment}/>}
                />
            )}
        </div>
    );
};

export default ProjectDetails;
