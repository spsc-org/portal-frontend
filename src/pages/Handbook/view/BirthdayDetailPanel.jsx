import { observer } from "mobx-react-lite";
import { Chip, Spinner } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { BirthdayDetailViewModel } from "../viewmodel/BirthdayViewModels.js";
import SharePicker from "./SharePicker.jsx";

// Sticky-панель швидкого перегляду/редагування (той самий принцип, що й
// ReactPages/Task/Components/TaskViewPanel.jsx) — праворуч від списку, у
// звичайному потоці сторінки (не h-screen split, як у Announcement).
const BirthdayDetailPanel = ({ entryId, onClose, onDeleted }) => {
    const vm = useViewModel((deps) => new BirthdayDetailViewModel({ ...deps, entryId }));
    const entry = vm.entry;
    const isEditing = vm.isEditing;

    if (!entry) {
        return (
            <aside className="flex w-[24rem] shrink-0 items-center justify-center self-start rounded-xl border border-gray-200 bg-white py-16 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <Spinner className="h-8 w-8"/>
            </aside>
        );
    }

    const { canManage, canShare } = vm;
    const handleDelete = () => vm.remove().then((deleted) => deleted && onDeleted?.());

    return (
        <aside data-i-doc="widget:handbook-birthday-detail-panel" className="w-[24rem] shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] flex flex-col overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2.5 dark:border-neutral-700">
                <Chip size="sm" variant="ghost" color={entry.is_default ? "blue" : "gray"}
                      className={`py-0.5 text-[9px] ${entry.is_default ? "dark:!bg-blue-500/30 dark:!text-blue-300" : "dark:!bg-neutral-400/20 dark:!text-gray-300"}`}
                      value={entry.is_default ? "Спільний список" : "Особистий список"}/>
                <div className="flex items-center gap-1">
                    {canManage && !isEditing &&
                        <IconButton size="sm" variant="text" color="blue-gray" onClick={vm.startEdit} title="Редагувати">
                            <i className="fa-regular fa-pen"></i>
                        </IconButton>
                    }
                    {canManage &&
                        <IconButton size="sm" variant="text" color="red" onClick={vm.askDelete} title="Видалити">
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
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Ім'я</label>
                            <input type="text" value={vm.nameDraft} onChange={(e) => vm.setNameDraft(e.target.value)}
                                   className="w-full rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-900 focus:border-blue-300 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100"/>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Дата народження</label>
                            <input type="date" value={vm.dateDraft} onChange={(e) => vm.setDateDraft(e.target.value)}
                                   className="w-full rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-900 focus:border-blue-300 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100"/>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Примітка</label>
                            <textarea rows={3} value={vm.noteDraft} onChange={(e) => vm.setNoteDraft(e.target.value)}
                                      className="w-full resize-y rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-700 focus:border-blue-300 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-300"/>
                        </div>
                        <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={vm.cancelEdit}
                                    className="rounded px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:hover:bg-neutral-700">
                                Скасувати
                            </button>
                            <LoadingButton size="sm" color="green" isLoading={vm.cmd.update.isPending} onClick={vm.save}>
                                Зберегти
                            </LoadingButton>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{entry.name}</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <i className="fa-solid fa-cake-candles mr-1.5 text-amber-500"></i>
                            {entry.date_of_birth ? format(new Date(entry.date_of_birth), "d MMMM yyyy", {locale: uk}) : "—"}
                        </p>
                        {entry.note &&
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                {entry.note}
                            </p>
                        }
                        {!entry.is_default &&
                            <p className="mt-3 text-xs text-gray-600 dark:text-gray-500">
                                Власник: {entry.owner?.name || "—"}
                            </p>
                        }
                    </>
                )}

                {!entry.is_default &&
                    <div className="mt-5 border-t border-gray-100 pt-4 dark:border-neutral-700">
                        <SharePicker
                            value={entry.shared_groups || []}
                            disabled={!canShare || vm.cmd.share.isPending}
                            onChange={vm.share}
                        />
                        {!canShare &&
                            <p className="mt-1 text-[10px] text-gray-600 dark:text-gray-500">
                                Розшарювати може лише власник запису
                            </p>
                        }
                    </div>
                }
            </div>

            <ConfirmModal
                open={vm.confirmDelete}
                onClose={vm.cancelDelete}
                onConfirm={handleDelete}
                isLoading={vm.cmd.remove.isPending}
                title="Видалити запис?"
                message="Запис буде видалено безповоротно."
            />
        </aside>
    );
};

export default observer(BirthdayDetailPanel);
