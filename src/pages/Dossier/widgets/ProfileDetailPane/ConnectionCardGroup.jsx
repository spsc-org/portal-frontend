import {sourceType} from "../../shared/config/sourceTypes.js";
import {
    canDelete,
    canToggleConfirm,
    canVoid,
    connectionStatus,
    criteriaChipClasses,
    criteriaLabel,
    criteriaList,
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

const iconActionButton = "inline-flex items-center justify-center w-[28px] h-[28px] rounded-[8px] cursor-pointer transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed";

// "Віртуальна картка": одне ДЖЕРЕЛО (model_class+model_id), збіг з яким зафіксовано
// одразу кількома реальними звʼязками (кожен критерій — окремий рядок sanction_profiles_
// connections, див. groupConnectionsBySource). Спільні дані джерела (підпис, деталі)
// показуються один раз; нижче — розбивка по кожному реальному звʼязку зі своїм критерієм
// і своїми діями (confirm/void/unlink лишаються per-connection, бо це окремі рядки БД).
// Кнопку перенесення (move) прибрано 2026-08-05, як і в ConnectionCard.jsx.
const ConnectionCardGroup = ({connections, canManage, currentUserId, onConfirm, onUnconfirm, onVoid, onUnlink, onUpdateNote, isNotePending, isPending}) => {
    const primary = connections[0];
    const source = sourceType(primary.model_class);
    const cardUrl = source.cardUrl?.(primary.model_id);

    const conflicts = [];
    const seenConflictConnections = new Set();
    connections.forEach((connection) => {
        (connection.conflicts_with ?? []).forEach((opponent) => {
            if (!seenConflictConnections.has(opponent.connection_id)) {
                seenConflictConnections.add(opponent.connection_id);
                conflicts.push(opponent);
            }
        });
    });

    return (
        <div data-i-doc="component:sanction-profiles-connection-card-group" className="bg-white border border-gray-200 border-l-4 border-l-blue-400 rounded-xl shadow-sm px-[18px] py-4 dark:bg-gray-900 dark:border-gray-700">
            <div className="flex items-center gap-[9px] flex-wrap">
                <span className={`flex-none inline-flex items-center gap-[7px] text-[11.5px] font-semibold px-[11px] py-[5px] rounded-lg ${source.badgeClasses}`}>
                    <i className={`${source.icon} text-[11px]`}></i>{source.label}
                </span>
                <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                    {primary.source_caption ?? `#${primary.model_id}`}
                </span>
                <span
                    title="Одне джерело, підтверджене кількома критеріями збігу"
                    className="flex-none inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-[3px] rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                >
                    <i className="fa-solid fa-layer-group text-[10px]"></i>{connections.length} звʼязки
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
                {source.table} #{primary.model_id}
            </div>

            {conflicts.length > 0 && (
                <div className="flex items-center gap-[7px] flex-wrap mt-[11px]">
                    <span className="text-[10.5px] font-semibold text-red-500">конфлікт з:</span>
                    {conflicts.map((opponent) => (
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

            <SearchIndexToggle value={primary.search_index}/>
            <ConnectionSourceDetails modelClass={primary.model_class} modelId={primary.model_id}/>

            <div className="mt-[13px] pt-[13px] border-t border-gray-100 dark:border-gray-800">
                <div className="text-[10.5px] font-semibold text-gray-400 mb-2">
                    Складові звʼязки ({connections.length}):
                </div>
                <div className="flex flex-col gap-2">
                    {connections.map((connection) => {
                        const origin = originMeta(connection.origin);
                        const status = connectionStatus(connection);
                        const criteria = criteriaList(connection.matched_criteria);
                        const isDeletable = canDelete(connection, currentUserId);
                        const confirmed = isConfirmed(connection);

                        return (
                            <div
                                key={connection.id}
                                className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60"
                            >
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-[10.5px] font-mono text-gray-300 dark:text-gray-500">
                                        conn #{connection.id}
                                    </span>
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
                                    <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold ${origin.classes}`}>
                                        <i className={`${origin.icon} text-[9px]`}></i>{origin.label}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold ${status.classes}`}>
                                        <i className={`${status.icon} text-[9px]`}></i>{status.label}
                                    </span>
                                </div>

                                <NoteBlock
                                    value={connection.note}
                                    onSave={(note) => onUpdateNote(connection.id, note)}
                                    isPending={isNotePending}
                                    canEdit={canManage}
                                />

                                <div className="flex flex-wrap items-start gap-3 mt-2">
                                    <TicketsBlock className="flex-auto min-w-[200px]">
                                        <TicketsButton
                                            entityType={ENTITY_CONNECTION}
                                            entityId={connection.id}
                                            entityLabel={`Звʼязок #${connection.id}`}
                                            canManage={canManage}
                                        />
                                    </TicketsBlock>

                                    <ModeratorBlock canManage={canManage} label="Дії зі звʼязком" className="flex-auto min-w-[200px]">
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
                                                <i className={`fa-solid ${confirmed ? "fa-rotate-left" : "fa-check"} text-[11px]`}></i>
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
                                                <i className="fa-solid fa-ban text-[11px]"></i>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={isPending || !isDeletable}
                                            onClick={() => onUnlink(connection)}
                                            title={isDeletable ? "Вилучити звʼязок" : "Видалити може лише той, хто створив цей звʼязок"}
                                            className={`${iconActionButton} border border-red-200 bg-white text-red-600 dark:bg-gray-800 dark:border-red-800 dark:text-red-400`}
                                        >
                                            <i className="fa-solid fa-link-slash text-[11px]"></i>
                                        </button>
                                    </ModeratorBlock>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ConnectionCardGroup;
