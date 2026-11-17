import { observer } from "mobx-react-lite";
import { IconButton, Spinner } from "@material-tailwind/react";
import { format } from "date-fns";
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { PhoneCommentsViewModel } from "../viewmodel/PhoneViewModels.js";

// Коментарі окремих користувачів до телефонного запису — видимі всім, хто
// бачить сам запис; редагувати/видаляти може ЛИШЕ автор (PhoneEntryCommentPolicy,
// та сама непорушна власність, що й на бекенді). Стилістика бульбашок — за
// зразком ReactPages/Task/Components/TaskDiscussion.jsx.
const PhoneCommentsThread = ({ entryId, readOnly = false }) => {
    const vm = useViewModel((deps) => new PhoneCommentsViewModel({ ...deps, entryId }));
    const comments = vm.comments;
    const isLoading = vm.query.isLoading;

    return (
        <span data-i-doc="widget:handbook-phone-comments-thread" style={{display: "contents"}}>
        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Коментарі{comments.length > 0 ? ` (${comments.length})` : ""}
            </p>

            {isLoading &&
                <div className="flex justify-center py-3"><Spinner className="h-5 w-5"/></div>
            }

            <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
                {!isLoading && comments.length === 0 &&
                    <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                        Ще немає коментарів
                    </p>
                }
                {comments.map((comment) => {
                    const isOwn = vm.isOwn(comment);
                    const isEditing = vm.editingId === comment.id;
                    return (
                        <div key={comment.id}
                             className={`group max-w-[90%] rounded-lg px-2.5 py-1.5 ${isOwn
                                 ? "self-end bg-blue-50 dark:bg-blue-900/30"
                                 : "self-start bg-slate-100 dark:bg-slate-800"}`}>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                    {isOwn ? "Ви" : comment.user?.name || "—"}
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                    {comment.created_at ? format(new Date(comment.created_at), "yyyy-MM-dd HH:mm") : ""}
                                </span>
                                {isOwn && !isEditing &&
                                    <span className="ml-auto flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                                        <button type="button" onClick={() => vm.startEdit(comment)} title="Редагувати"
                                                className="text-slate-400 transition hover:text-blue-500">
                                            <i className="fa-regular fa-pen text-[10px]"></i>
                                        </button>
                                        <button type="button" onClick={() => vm.askDelete(comment.id)} title="Видалити"
                                                className="text-slate-400 transition hover:text-red-500">
                                            <i className="fa-regular fa-trash-can text-[10px]"></i>
                                        </button>
                                    </span>
                                }
                            </div>
                            {isEditing ? (
                                <div className="mt-1 flex items-end gap-1.5">
                                    <textarea
                                        rows={2}
                                        autoFocus
                                        value={vm.editDraft}
                                        onChange={(e) => vm.setEditDraft(e.target.value)}
                                        className="flex-1 resize-none rounded-md border border-slate-200 bg-white p-1.5 text-xs leading-relaxed text-slate-700 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <IconButton size="sm" color="green" disabled={vm.cmd.update.isPending || !vm.editDraft.trim()}
                                                    onClick={() => vm.saveEdit(comment.id)} title="Зберегти">
                                            <i className="fa-solid fa-check text-[10px]"></i>
                                        </IconButton>
                                        <IconButton size="sm" variant="text" color="blue-gray" onClick={vm.cancelEdit} title="Скасувати">
                                            <i className="fa-solid fa-xmark text-[10px]"></i>
                                        </IconButton>
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-800 dark:text-slate-300">
                                    {comment.body}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {!readOnly &&
                <div className="mt-2 flex items-end gap-2">
                    <textarea
                        rows={2}
                        value={vm.draft}
                        placeholder="Написати коментар… (Enter — надіслати, Ctrl+Enter — новий рядок)"
                        onChange={(e) => vm.setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            // Ctrl/Cmd+Enter — перенос рядка (типова behavior textarea,
                            // нічого не робимо); голий Enter — надіслати.
                            if (e.ctrlKey || e.metaKey) return;
                            e.preventDefault();
                            vm.send();
                        }}
                        className="flex-1 resize-none rounded-md border border-slate-200 bg-white p-2 text-xs leading-relaxed text-slate-700 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <IconButton size="sm" color="blue" disabled={vm.cmd.add.isPending || !vm.draft.trim()}
                                onClick={vm.send} title="Надіслати (Enter)">
                        {vm.cmd.add.isPending ? <Spinner className="h-3 w-3"/> : <i className="fa-regular fa-paper-plane"></i>}
                    </IconButton>
                </div>
            }
        </div>
        <ConfirmModal
            open={vm.confirmDeleteId != null}
            onClose={vm.cancelDelete}
            onConfirm={vm.confirmDelete}
            isLoading={vm.cmd.remove.isPending}
            title="Видалити коментар?"
            message="Коментар буде видалено безповоротно."
        />
        </span>
    );
};

export default observer(PhoneCommentsThread);
