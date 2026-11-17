import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { TaskDiscussionViewModel } from "../viewmodel/TaskViewModels.js";
import {IconButton, Spinner} from "@material-tailwind/react";
import {useEffect, useRef} from "react";
import {format} from "date-fns";

// Обговорення задачі (чат учасників): власник + пов'язані особи можуть
// писати незалежно від того, чи власник у списку учасників. М'яке
// автооновлення списку кожні 20с (без Reverb — окрема майбутня задача).
// Винесено з TaskViewPanel.jsx.
const TaskDiscussion = ({taskId, createdUserId, assignedUsers = [], auth}) => {
    const vm = useViewModel((deps) => new TaskDiscussionViewModel({ ...deps, taskId }));
    const comments = vm.comments;
    const canComment = vm.canComment(createdUserId, assignedUsers);
    const commentDraft = vm.commentDraft;
    const setCommentDraft = vm.setCommentDraft;
    const sendComment = vm.send;
    const addCommentMutation = vm.addCmd;
    const commentsEndRef = useRef(null);

    // Автоскрол стрічки обговорення до останнього повідомлення (DOM — у View).
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({block: "nearest"});
    }, [comments.length]);

    return (
        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Обговорення{comments.length > 0 ? ` (${comments.length})` : ""}
            </p>
            <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
                {comments.length === 0 &&
                    <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                        Ще немає повідомлень
                    </p>
                }
                {comments.map(comment => {
                    const isOwn = comment.userId === auth?.user?.id;
                    return (
                        <div key={comment.id}
                             className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${isOwn
                                 ? "self-end bg-blue-50 dark:bg-blue-900/30"
                                 : "self-start bg-slate-100 dark:bg-slate-800"}`}>
                            <div className="flex items-center gap-1.5">
                                {Boolean(comment.userAvatar) &&
                                    <img src={`/files?path=${comment.userAvatar}`} alt=""
                                         className="h-4 w-4 shrink-0 rounded-full object-cover"/>
                                }
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                    {isOwn ? "Ви" : comment.userName}
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                    {comment.created_at ? format(comment.created_at, "yyyy-MM-dd HH:mm") : ""}
                                </span>
                            </div>
                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-800 dark:text-slate-300">
                                {comment.body}
                            </p>
                        </div>
                    );
                })}
                <div ref={commentsEndRef}/>
            </div>
            {canComment ? (
                <div className="mt-2 flex items-end gap-2">
                    <textarea
                        rows={2}
                        value={commentDraft}
                        placeholder="Написати повідомлення…"
                        onChange={(e) => setCommentDraft(e.target.value)}
                        onKeyDown={(e) => {
                            // Ctrl+Enter (або Cmd+Enter) — надіслати; звичайний Enter — новий рядок
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                sendComment();
                            }
                            if (e.key === 'Escape') {
                                e.stopPropagation();
                            }
                        }}
                        className="flex-1 resize-none rounded-md border border-slate-200 bg-white p-2 text-xs leading-relaxed text-slate-700 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <IconButton size="sm" color="blue"
                                disabled={addCommentMutation.isPending || !commentDraft.trim()}
                                onClick={sendComment}
                                title="Надіслати (Ctrl+Enter)">
                        {addCommentMutation.isPending
                            ? <Spinner className="h-3 w-3"/>
                            : <i className="fa-regular fa-paper-plane"></i>}
                    </IconButton>
                </div>
            ) : (
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                    Писати можуть власник задачі та учасники
                </p>
            )}
        </div>
    );
};

export default observer(TaskDiscussion);
