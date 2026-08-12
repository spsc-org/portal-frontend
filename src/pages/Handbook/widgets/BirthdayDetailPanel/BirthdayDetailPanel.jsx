import React, {useEffect, useState} from "react";
import {usePage} from "@inertiajs/react";
import {Chip, IconButton, Spinner, Tooltip} from "@material-tailwind/react";
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import ConfirmModal from "../../../../Components/Modal/ConfirmModal.jsx";
import SharePicker from "../../shared/ui/SharePicker.jsx";
import {useBirthdayQuery, useDeleteBirthdayMutation, useShareBirthdayMutation, useUpdateBirthdayMutation} from "../../entities/birthday/queries.js";
import {canManageBirthdayEntry, canShareBirthdayEntry} from "../../shared/lib/permissions.js";

// Sticky-панель швидкого перегляду/редагування (той самий принцип, що й
// ReactPages/Task/Components/TaskViewPanel.jsx) — праворуч від списку, у
// звичайному потоці сторінки (не h-screen split, як у Announcement).
const BirthdayDetailPanel = ({entryId, onClose, onDeleted}) => {
    const {auth} = usePage().props;
    const {data: entry, isLoading} = useBirthdayQuery(entryId);

    const [isEditing, setIsEditing] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [dateDraft, setDateDraft] = useState("");
    const [noteDraft, setNoteDraft] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => setIsEditing(false), [entryId]);
    useEffect(() => {
        if (entry) {
            setNameDraft(entry.name || "");
            setDateDraft(entry.date_of_birth || "");
            setNoteDraft(entry.note || "");
        }
    }, [entry]);

    const updateMutation = useUpdateBirthdayMutation(entryId);
    const deleteMutation = useDeleteBirthdayMutation();
    const shareMutation = useShareBirthdayMutation(entryId);

    if (!entryId) return null;

    if (isLoading || !entry) {
        return (
            <aside className="flex w-[24rem] shrink-0 items-center justify-center self-start rounded-xl border border-slate-200 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <Spinner className="h-8 w-8"/>
            </aside>
        );
    }

    const canManage = canManageBirthdayEntry(auth, entry);
    const canShare = canShareBirthdayEntry(auth, entry);

    const handleSave = () => {
        updateMutation.mutate(
            {name: nameDraft.trim(), dateOfBirth: dateDraft, note: noteDraft.trim()},
            {onSuccess: () => setIsEditing(false)},
        );
    };

    const handleDelete = () => {
        deleteMutation.mutate(entryId, {
            onSuccess: () => {
                setConfirmDelete(false);
                onDeleted?.();
            },
        });
    };

    return (
        <aside data-i-doc="widget:handbook-birthday-detail-panel" className="w-[24rem] shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] flex flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
                <Chip size="sm" variant="ghost" color={entry.is_default ? "blue" : "gray"}
                      className={`py-0.5 text-[9px] ${entry.is_default ? "dark:!bg-blue-500/30 dark:!text-blue-300" : "dark:!bg-slate-500/20 dark:!text-slate-300"}`}
                      value={entry.is_default ? "Спільний список" : "Особистий список"}/>
                <div className="flex items-center gap-1">
                    {canManage && !isEditing &&
                        <IconButton size="sm" variant="text" color="blue-gray" onClick={() => setIsEditing(true)} title="Редагувати">
                            <i className="fa-regular fa-pen"></i>
                        </IconButton>
                    }
                    {canManage &&
                        <IconButton size="sm" variant="text" color="red" onClick={() => setConfirmDelete(true)} title="Видалити">
                            <i className="fa-regular fa-trash-can"></i>
                        </IconButton>
                    }
                    <IconButton size="sm" variant="text" color="blue-gray" onClick={onClose} title="Закрити">
                        <i className="fa-solid fa-xmark"></i>
                    </IconButton>
                </div>
            </div>

            <div className="flex-1 p-4">
                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Ім'я</label>
                            <input type="text" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)}
                                   className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"/>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Дата народження</label>
                            <input type="date" value={dateDraft} onChange={(e) => setDateDraft(e.target.value)}
                                   className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"/>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Примітка</label>
                            <textarea rows={3} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
                                      className="w-full resize-y rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"/>
                        </div>
                        <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={() => setIsEditing(false)}
                                    className="rounded px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                Скасувати
                            </button>
                            <LoadingButton size="sm" color="green" isLoading={updateMutation.isPending} onClick={handleSave}>
                                Зберегти
                            </LoadingButton>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{entry.name}</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <i className="fa-solid fa-cake-candles mr-1.5 text-amber-500"></i>
                            {entry.date_of_birth ? format(new Date(entry.date_of_birth), "d MMMM yyyy", {locale: uk}) : "—"}
                        </p>
                        {entry.note &&
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                {entry.note}
                            </p>
                        }
                        {!entry.is_default &&
                            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                                Власник: {entry.owner?.name || "—"}
                            </p>
                        }
                    </>
                )}

                {!entry.is_default &&
                    <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <SharePicker
                            value={entry.shared_groups || []}
                            disabled={!canShare || shareMutation.isPending}
                            onChange={(selected) => shareMutation.mutate(selected.map((g) => g.id))}
                        />
                        {!canShare &&
                            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                                Розшарювати може лише власник запису
                            </p>
                        }
                    </div>
                }
            </div>

            <ConfirmModal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
                title="Видалити запис?"
                message="Запис буде видалено безповоротно."
            />
        </aside>
    );
};

export default BirthdayDetailPanel;
