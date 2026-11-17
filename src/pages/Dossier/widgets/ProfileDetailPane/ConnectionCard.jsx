import {sourceType} from "../../shared/config/sourceTypes.js";
import {
    canDelete,
    canToggleConfirm,
    canVoid,
    connectionAccentClasses,
    connectionStatus,
    criteriaChipClasses,
    criteriaLabel,
    criteriaList,
    isAnchor,
    isConfirmed,
    matchedValue,
    originMeta,
} from "../../entities/dossierConnection/model.js";
import SearchIndexToggle from "../../shared/ui/SearchIndexToggle.jsx";
import ConnectionSourceDetails from "./ConnectionSourceDetails.jsx";
import ModeratorBlock from "../../shared/ui/ModeratorBlock.jsx";
import NoteBlock from "../../shared/ui/NoteBlock.jsx";
import TicketsBlock from "../../shared/ui/TicketsBlock.jsx";
import TicketsButton from "../TicketsModal/TicketsButton.jsx";
import {ENTITY_CONNECTION} from "../../entities/dossierTicket/model.js";

const iconActionButton = "inline-flex items-center justify-center w-[34px] h-[34px] rounded-[9px] cursor-pointer transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed";

// Картка зв'язку профіль↔джерело (за макетом): accent-бар, бейдж джерела, статуси
// origin/needs_review/confirmed/void, чипи matched_criteria, дії confirm/void/unlink,
// банер якірного truth-запису. Кнопку перенесення (move) прибрано 2026-08-05 — модель
// модерації тепер void() + новий звʼязок замість перенесення (див. DossierConnectionService).
const ConnectionCard = ({connection, canManage, currentUserId, onConfirm, onUnconfirm, onVoid, onUnlink, onUpdateNote, isNotePending, isPending}) => {
    const source = sourceType(connection.model_class);
    const cardUrl = source.cardUrl?.(connection.model_id);
    const origin = originMeta(connection.origin);
    const status = connectionStatus(connection);
    const anchor = isAnchor(connection);
    const criteria = criteriaList(connection.matched_criteria);
    const isDeletable = canDelete(connection, currentUserId);
    const confirmed = isConfirmed(connection);
    const borderClasses = connection.needs_review && connection.review_reason === "conflict"
        ? "border-red-200 dark:border-red-800"
        : connection.needs_review
            ? "border-orange-200 dark:border-orange-800"
            : "border-gray-200 dark:border-gray-700";

    return (
        <div data-i-doc="component:sanction-profiles-connection-card" className={`bg-white border ${borderClasses} border-l-4 ${connectionAccentClasses(connection)} rounded-xl shadow-sm px-[18px] py-4 dark:bg-gray-900`}>
            <div className="flex items-center gap-[9px] flex-wrap">
                <span className={`flex-none inline-flex items-center gap-[7px] text-[11.5px] font-semibold px-[11px] py-[5px] rounded-lg ${source.badgeClasses}`}>
                    <i className={`${source.icon} text-[11px]`}></i>{source.label}
                </span>
                <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                    {connection.source_caption ?? `#${connection.model_id}`}
                </span>
                {cardUrl && (
                    <a
                        href={cardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Переглянути картку проєкту"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                        <i className="fa-regular fa-rectangle-history text-[11px]"></i>
                        Відкрити картку проєкту
                    </a>
                )}
            </div>
            <div className="text-[11px] font-mono text-gray-300 dark:text-gray-500 mt-1.5">
                {source.table} #{connection.model_id} · conn #{connection.id}
            </div>

            <div className="flex items-center gap-4 flex-wrap mt-2">
                {!anchor && (
                    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold ${origin.classes}`}>
                        <i className={`${origin.icon} text-[10px]`}></i>{origin.label}
                    </span>
                )}
                <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold ${status.classes}`}>
                    <i className={`${status.icon} text-[10px]`}></i>{status.label}
                </span>
            </div>
            {!anchor && criteria.length > 0 && (
                <div className="flex items-center gap-[7px] flex-wrap mt-[11px]">
                    <span className="text-[10.5px] font-semibold text-gray-400">matched_criteria:</span>
                    {criteria.map((key) => (
                        <span key={key} className={`text-[10.5px] font-semibold px-2 py-[3px] rounded-md ${criteriaChipClasses(key)}`}>
                            {criteriaLabel(key)}
                        </span>
                    ))}
                    {matchedValue(connection) && (
                        <span className="text-[10.5px] font-mono text-gray-500 dark:text-gray-400" title="Значення, яке збіглося">
                            = {matchedValue(connection)}
                        </span>
                    )}
                </div>
            )}
            {connection.conflicts_with?.length > 0 && (
                <div className="flex items-center gap-[7px] flex-wrap mt-[11px]">
                    <span className="text-[10.5px] font-semibold text-red-500">конфлікт з:</span>
                    {connection.conflicts_with.map((opponent) => (
                        <a
                            key={opponent.connection_id}
                            href={`/dossier?view=${opponent.profile_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Відкрити досьє #${opponent.profile_id} у новій вкладці`}
                            className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-[3px] rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/70"
                        >
                            <i className="fa-solid fa-up-right-from-square text-[9px]"></i>
                            {opponent.profile_caption ?? `Досьє #${opponent.profile_id}`} (звʼязок #{opponent.connection_id})
                        </a>
                    ))}
                </div>
            )}
            <SearchIndexToggle value={connection.search_index}/>
            <ConnectionSourceDetails modelClass={connection.model_class} modelId={connection.model_id}/>

            <NoteBlock
                value={connection.note}
                onSave={(note) => onUpdateNote(connection.id, note)}
                isPending={isNotePending}
                canEdit={canManage}
            />

            <div className="flex flex-wrap items-start gap-3 mt-[11px]">
                <TicketsBlock className="flex-auto min-w-[220px]">
                    <TicketsButton
                        entityType={ENTITY_CONNECTION}
                        entityId={connection.id}
                        entityLabel={`Звʼязок #${connection.id}`}
                        canManage={canManage}
                    />
                </TicketsBlock>

                <ModeratorBlock canManage={canManage && !anchor} label="Дії зі звʼязком" className="flex-auto min-w-[220px]">
                    {canToggleConfirm(connection) && (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => (confirmed ? onUnconfirm(connection.id) : onConfirm(connection.id))}
                            title={confirmed ? "Скасувати підтвердження" : "Підтвердити звʼязок"}
                            className={confirmed
                                ? `${iconActionButton} border border-green-300 bg-green-50 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300`
                                : `${iconActionButton} border-none bg-green-600 text-white`}
                        >
                            <i className={`fa-solid ${confirmed ? "fa-rotate-left" : "fa-check"} text-[13px]`}></i>
                        </button>
                    )}
                    {!connection.is_void && (
                        <button
                            type="button"
                            disabled={isPending || !canVoid(connection)}
                            onClick={() => onVoid(connection)}
                            title={canVoid(connection) ? "Позначити звʼязок нікчемним (помилковим)" : "Звʼязок підтверджено — спершу скасуйте підтвердження"}
                            className={`${iconActionButton} border border-gray-300 bg-white text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300`}
                        >
                            <i className="fa-solid fa-ban text-[13px]"></i>
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={isPending || !isDeletable}
                        onClick={() => onUnlink(connection)}
                        title={isDeletable ? "Вилучити звʼязок" : "Видалити може лише той, хто створив цей звʼязок"}
                        className={`${iconActionButton} border border-red-200 bg-white text-red-600 dark:bg-gray-800 dark:border-red-800 dark:text-red-400`}
                    >
                        <i className="fa-solid fa-link-slash text-[13px]"></i>
                    </button>
                </ModeratorBlock>
            </div>
        </div>
    );
};

export default ConnectionCard;
