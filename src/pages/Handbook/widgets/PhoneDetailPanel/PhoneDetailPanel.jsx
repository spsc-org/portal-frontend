import React, {useState} from "react";
import {usePage} from "@inertiajs/react";
import {Chip, IconButton, Spinner, Tooltip} from "@material-tailwind/react";
import {format} from "date-fns";
import ConfirmModal from "../../../../Components/Modal/ConfirmModal.jsx";
import EditPhoneModal from "../../features/edit-phone/EditPhoneModal.jsx";
import PhoneAuditModal from "../../features/phone-audit/PhoneAuditModal.jsx";
import PhoneCommentsThread from "../PhoneCommentsThread/PhoneCommentsThread.jsx";
import PhoneNumberBadge from "../../shared/ui/PhoneNumberBadge.jsx";
import {
    useArchivePhoneMutation,
    useConfirmPhoneNumberMutation,
    useDeletePhoneMutation,
    useDuplicatePhoneMutation,
    usePhoneQuery,
    useRestorePhoneMutation,
    useTogglePhoneFavoriteMutation,
} from "../../entities/phone/queries.js";
import {canArchivePhoneEntry, canDeletePhoneEntry, canReadPhoneAudit, canUpdatePhoneEntry} from "../../shared/lib/permissions.js";

// Sticky-панель швидких дій (перегляд, коментарі, дублювання, архівування) —
// той самий принцип, що й TaskViewPanel.jsx. Немає особистих/спільних списків —
// усі записи видимі всім; редагувати/видаляти/архівувати може лише власник
// (canUpdate/canDeletePhoneEntry/canArchivePhoneEntry — individual-scope права).
// Чужий запис можна коментувати (щоб "збагатити") або продублювати собі
// (Дублювати картку — доступно для будь-кого, копія стає власною). Саме
// редагування запису — в окремій модалці (EditPhoneModal), картка для нього
// не призначена (пряма вимога користувача). Кожен номер — кнопка "Підтвердити
// актуальність" (накопичувані відмітки, БУДЬ-ЯКИЙ користувач, не лише
// власник — PhoneEntryNumberConfirmation), лічильник + тултіп із деталями
// останнього підтвердження. Архів блокує редагування/коментування/дублювання
// (PhoneService guardNotArchived) — у цих кнопок тому й з'являється умова
// `!entry.is_archived`; видалення й сам архів/розархів
// лишаються доступні завжди.
const PhoneDetailPanel = ({entryId, onClose, onDeleted}) => {
    const {auth} = usePage().props;
    const {data: entry, isLoading} = usePhoneQuery(entryId);

    const [openEdit, setOpenEdit] = useState(false);
    const [openAudit, setOpenAudit] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const deleteMutation = useDeletePhoneMutation();
    const duplicateMutation = useDuplicatePhoneMutation();
    const archiveMutation = useArchivePhoneMutation();
    const restoreMutation = useRestorePhoneMutation();
    const toggleFavoriteMutation = useTogglePhoneFavoriteMutation();
    const confirmNumberMutation = useConfirmPhoneNumberMutation(entryId);

    if (!entryId) return null;

    if (isLoading || !entry) {
        return (
            <aside className="flex w-[24rem] shrink-0 items-center justify-center self-start rounded-xl border border-slate-200 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <Spinner className="h-8 w-8"/>
            </aside>
        );
    }

    const canUpdate = canUpdatePhoneEntry(auth, entry);
    const canDelete = canDeletePhoneEntry(auth, entry);
    const canArchive = canArchivePhoneEntry(auth, entry);
    const canAudit = canReadPhoneAudit(auth);

    const handleDelete = () => {
        deleteMutation.mutate(entryId, {
            onSuccess: () => {
                setConfirmDelete(false);
                onDeleted?.();
            },
        });
    };

    return (
        <aside data-i-doc="widget:handbook-phone-detail-panel" className="w-[24rem] shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] flex flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                    {entry.is_archived &&
                        <Chip size="sm" variant="ghost" color="gray" className="py-0.5 text-[9px] dark:!bg-slate-500/20 dark:!text-slate-300" value="Архів"/>
                    }
                </div>
                <div className="flex items-center gap-1">
                    <IconButton size="sm" variant="text" disabled={toggleFavoriteMutation.isPending}
                                className={entry.is_favorite ? "text-amber-400" : "dark:text-slate-300"}
                                onClick={() => toggleFavoriteMutation.mutate(entryId)}
                                title={entry.is_favorite ? "Прибрати з обраного" : "Додати в обране"}>
                        <i className={`${entry.is_favorite ? "fa-solid" : "fa-regular"} fa-star`}></i>
                    </IconButton>
                    {!entry.is_archived &&
                        <IconButton size="sm" variant="text" color="blue-gray" disabled={duplicateMutation.isPending}
                                    onClick={() => duplicateMutation.mutate(entryId)} title="Дублювати картку">
                            <i className={duplicateMutation.isPending ? "fa-solid fa-spinner fa-spin" : "fa-regular fa-copy"}></i>
                        </IconButton>
                    }
                    {canArchive &&
                        (entry.is_archived ? (
                            <IconButton size="sm" variant="text" color="blue-gray" disabled={restoreMutation.isPending}
                                        onClick={() => restoreMutation.mutate(entryId)} title="Розархівувати">
                                <i className={restoreMutation.isPending ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-box-open"}></i>
                            </IconButton>
                        ) : (
                            <IconButton size="sm" variant="text" color="blue-gray" disabled={archiveMutation.isPending}
                                        onClick={() => archiveMutation.mutate(entryId)} title="Архівувати">
                                <i className={archiveMutation.isPending ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-box-archive"}></i>
                            </IconButton>
                        ))
                    }
                    {canUpdate && !entry.is_archived &&
                        <IconButton size="sm" variant="text" color="blue-gray" onClick={() => setOpenEdit(true)} title="Редагувати">
                            <i className="fa-regular fa-pen"></i>
                        </IconButton>
                    }
                    {canDelete &&
                        <IconButton size="sm" variant="text" color="red" onClick={() => setConfirmDelete(true)} title="Видалити">
                            <i className="fa-regular fa-trash-can"></i>
                        </IconButton>
                    }
                    {canAudit &&
                        <IconButton size="sm" variant="text" color="blue-gray" onClick={() => setOpenAudit(true)} title="Історія змін">
                            <i className="fa-regular fa-clock-rotate-left"></i>
                        </IconButton>
                    }
                    <IconButton size="sm" variant="text" color="blue-gray" onClick={onClose} title="Закрити">
                        <i className="fa-solid fa-xmark"></i>
                    </IconButton>
                </div>
            </div>

            <div className="flex-1 p-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{entry.name}</h2>
                <div className="mt-1 flex flex-col gap-1.5">
                    {(entry.phones || []).map((p) => {
                        const count = p.confirmations_count || 0;
                        const latest = p.latest_confirmation;
                        const confirmTooltip = latest
                            ? `Підтверджень: ${count}. Востаннє: ${latest.user?.name || "—"}, ${format(new Date(latest.created_at), "yyyy-MM-dd HH:mm")}`
                            : "Ще не підтверджено — станете першим";
                        return (
                            <div key={p.id} className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <PhoneNumberBadge phone={p.phone} note={p.note}/>
                                    {p.note &&
                                        <span className="block pl-5 font-sans text-xs text-slate-400 dark:text-slate-500">{p.note}</span>
                                    }
                                </div>
                                <Tooltip content={confirmTooltip}>
                                    <button type="button" disabled={confirmNumberMutation.isPending}
                                            onClick={() => confirmNumberMutation.mutate(p.id)}
                                            className={`shrink-0 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition ${count > 0
                                                ? "border-green-200 text-green-600 dark:border-green-900/50 dark:text-green-400"
                                                : "border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-600 dark:border-slate-700 dark:text-slate-500"}`}>
                                        <i className="fa-regular fa-circle-check"></i>
                                        {count > 0 && count}
                                    </button>
                                </Tooltip>
                            </div>
                        );
                    })}
                </div>
                {entry.department &&
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        <i className="fa-regular fa-building mr-1.5"></i>{entry.department}
                    </p>
                }
                {entry.note &&
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {entry.note}
                    </p>
                }
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    Власник: {entry.owner?.name || "—"}
                    <span className="ml-3"><i className="fa-regular fa-eye mr-1"></i>{entry.views_count ?? 0}</span>
                </p>

                <PhoneCommentsThread entryId={entryId} readOnly={entry.is_archived}/>
            </div>

            {openEdit &&
                <EditPhoneModal open={openEdit} onClose={() => setOpenEdit(false)} entry={entry}/>
            }

            {openAudit &&
                <PhoneAuditModal entryId={entryId} onClose={() => setOpenAudit(false)}/>
            }

            <ConfirmModal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
                title="Видалити запис?"
                message="Запис і всі його коментарі буде видалено безповоротно."
            />
        </aside>
    );
};

export default PhoneDetailPanel;
