import { observer } from "mobx-react-lite";
import { Chip, Spinner, Tooltip } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import { format } from "date-fns";
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { PhoneDetailViewModel } from "../viewmodel/PhoneViewModels.js";
import PhoneFormModal from "./PhoneFormModal.jsx";
import PhoneAuditModal from "./PhoneAuditModal.jsx";
import PhoneCommentsThread from "./PhoneCommentsThread.jsx";
import PhoneNumberBadge from "./PhoneNumberBadge.jsx";

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
const PhoneDetailPanel = ({ entryId, onClose, onDeleted }) => {
    const vm = useViewModel((deps) => new PhoneDetailViewModel({ ...deps, entryId }));
    const entry = vm.entry;

    if (!entry) {
        return (
            <aside className="flex w-[24rem] shrink-0 items-center justify-center self-start rounded-xl border border-gray-200 bg-white py-16 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <Spinner className="h-8 w-8"/>
            </aside>
        );
    }

    const handleDelete = () => vm.remove().then((deleted) => deleted && onDeleted?.());

    return (
        <aside data-i-doc="widget:handbook-phone-detail-panel" className="w-[24rem] shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] flex flex-col overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2.5 dark:border-neutral-700">
                <div className="flex items-center gap-1.5">
                    {entry.is_archived &&
                        <Chip size="sm" variant="ghost" color="gray" className="py-0.5 text-[9px] dark:!bg-neutral-400/20 dark:!text-gray-300" value="Архів"/>
                    }
                </div>
                <div className="flex items-center gap-1">
                    <IconButton size="sm" variant="text" disabled={vm.cmd.toggleFavorite.isPending}
                                className={entry.is_favorite ? "text-amber-400" : "dark:text-gray-300"}
                                onClick={vm.toggleFavorite}
                                title={entry.is_favorite ? "Прибрати з обраного" : "Додати в обране"}>
                        <i className={`${entry.is_favorite ? "fa-solid" : "fa-regular"} fa-star`}></i>
                    </IconButton>
                    {!entry.is_archived &&
                        <IconButton size="sm" variant="text" color="blue-gray" disabled={vm.cmd.duplicate.isPending}
                                    onClick={vm.duplicate} title="Дублювати картку">
                            <i className={vm.cmd.duplicate.isPending ? "fa-solid fa-spinner fa-spin" : "fa-regular fa-copy"}></i>
                        </IconButton>
                    }
                    {vm.canArchive &&
                        (entry.is_archived ? (
                            <IconButton size="sm" variant="text" color="blue-gray" disabled={vm.cmd.restore.isPending}
                                        onClick={vm.restore} title="Розархівувати">
                                <i className={vm.cmd.restore.isPending ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-box-open"}></i>
                            </IconButton>
                        ) : (
                            <IconButton size="sm" variant="text" color="blue-gray" disabled={vm.cmd.archive.isPending}
                                        onClick={vm.archive} title="Архівувати">
                                <i className={vm.cmd.archive.isPending ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-box-archive"}></i>
                            </IconButton>
                        ))
                    }
                    {vm.canUpdate && !entry.is_archived &&
                        <IconButton size="sm" variant="text" color="blue-gray" onClick={vm.openEdit} title="Редагувати">
                            <i className="fa-regular fa-pen"></i>
                        </IconButton>
                    }
                    {vm.canDelete &&
                        <IconButton size="sm" variant="text" color="red" onClick={vm.askDelete} title="Видалити">
                            <i className="fa-regular fa-trash-can"></i>
                        </IconButton>
                    }
                    {vm.canAudit &&
                        <IconButton size="sm" variant="text" color="blue-gray" onClick={vm.openAudit} title="Історія змін">
                            <i className="fa-regular fa-clock-rotate-left"></i>
                        </IconButton>
                    }
                    <IconButton size="sm" variant="text" color="blue-gray" onClick={onClose} title="Закрити">
                        <i className="fa-solid fa-xmark"></i>
                    </IconButton>
                </div>
            </div>

            <div className="flex-1 p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{entry.name}</h2>
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
                                        <span className="block pl-5 font-sans text-xs text-gray-600 dark:text-gray-500">{p.note}</span>
                                    }
                                </div>
                                <Tooltip content={confirmTooltip}>
                                    <button type="button" disabled={vm.cmd.confirmNumber.isPending}
                                            onClick={() => vm.confirmNumber(p.id)}
                                            className={`shrink-0 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition ${count > 0
                                                ? "border-green-200 text-green-600 dark:border-green-900/50 dark:text-green-400"
                                                : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600 dark:border-neutral-700 dark:text-gray-500"}`}>
                                        <i className="fa-regular fa-circle-check"></i>
                                        {count > 0 && count}
                                    </button>
                                </Tooltip>
                            </div>
                        );
                    })}
                </div>
                {entry.department &&
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">
                        <i className="fa-regular fa-building mr-1.5"></i>{entry.department}
                    </p>
                }
                {entry.note &&
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {entry.note}
                    </p>
                }
                <p className="mt-3 text-xs text-gray-600 dark:text-gray-500">
                    Власник: {entry.owner?.name || "—"}
                    <span className="ml-3"><i className="fa-regular fa-eye mr-1"></i>{entry.views_count ?? 0}</span>
                </p>

                <PhoneCommentsThread entryId={entryId} readOnly={entry.is_archived}/>
            </div>

            {vm.editOpen &&
                <PhoneFormModal entry={entry} onClose={vm.closeEdit}/>
            }

            {vm.auditOpen &&
                <PhoneAuditModal entryId={entryId} onClose={vm.closeAudit}/>
            }

            <ConfirmModal
                open={vm.confirmDelete}
                onClose={vm.cancelDelete}
                onConfirm={handleDelete}
                isLoading={vm.cmd.remove.isPending}
                title="Видалити запис?"
                message="Запис і всі його коментарі буде видалено безповоротно."
            />
        </aside>
    );
};

export default observer(PhoneDetailPanel);
