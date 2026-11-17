import { observer } from "mobx-react-lite";
import { Spinner } from "@material-tailwind/react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import AttachmentsGallery from "../../../components/AttachmentsGallery.jsx";
import MarkdownRenderer from "../../../components/MarkdownRenderer.jsx";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";
import DeveloperPostFormModal from "./DeveloperPostFormModal.jsx";
import { statusBadge, tagBadge } from "./badges.js";

// Панель перегляду поста (master-detail, праворуч від списку) — відкриття цієї
// картки й фіксує прочитання на бекенді (DeveloperPostService::getById()).
// Чистий перегляд + швидкі дії (Опублікувати/Видалити) — усе РЕДАГУВАННЯ
// (текст/версія/тег/стан/вкладення) винесено в CreateDeveloperPostModal
// (проп `post`), за прямою вимогою користувача.
const DeveloperPostDetailPane = ({ vm, onDeleted }) => {
    const post = vm.detail;

    if (!vm.activeId) {
        return (
            <div className="flex h-full flex-1 items-center justify-center text-slate-400 dark:text-slate-600">
                <div className="text-center">
                    <i className="fa-regular fa-code-branch mb-2 text-3xl"></i>
                    <p className="text-sm">Оберіть пост зі списку</p>
                </div>
            </div>
        );
    }

    if (vm.isDetailLoading) {
        return (
            <div className="flex h-full flex-1 items-center justify-center">
                <Spinner className="h-8 w-8"/>
            </div>
        );
    }

    const isPublished = post.status === "published";
    const postTags = post.tags || [];
    const status = statusBadge(post.status);

    const handleDelete = () => vm.deleteActive().then((deleted) => deleted && onDeleted?.());

    return (
        <div data-i-doc="widget:developer-post-detail-pane" className="flex h-full flex-1 flex-col overflow-y-auto bg-white dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="min-w-0 flex-1">
                    <h1 className="flex flex-wrap items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {post.title}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            v{post.version}
                        </span>
                        {postTags.map((t) => {
                            const badge = tagBadge(t);
                            return badge &&
                                <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
                                    {badge.label}
                                </span>;
                        })}
                        {!isPublished &&
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                                {status.label}
                            </span>
                        }
                    </h1>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {post.author?.name || "—"} · {post.created_at ? format(new Date(post.created_at), "d MMMM yyyy, HH:mm", {locale: uk}) : ""}
                    </p>
                    {post.status === "scheduled" && post.publish_at &&
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            <i className="fa-regular fa-clock mr-1"></i>
                            Заплановано на {format(new Date(post.publish_at), "d MMMM yyyy, HH:mm", {locale: uk})}
                        </p>
                    }
                </div>

                {vm.canManage &&
                    <div className="flex shrink-0 items-center gap-1.5">
                        {!isPublished &&
                            <LoadingButton size="sm" color="blue" isLoading={vm.publishMutation.isPending}
                                           onClick={vm.publishActive}>
                                <i className="fa-solid fa-paper-plane mr-1.5"></i>Опублікувати
                            </LoadingButton>
                        }
                        <button type="button" onClick={vm.openEdit} title="Редагувати"
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                            <i className="fa-regular fa-pen"></i>
                        </button>
                        <button type="button" onClick={vm.askDelete} title="Видалити"
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-900/20">
                            <i className="fa-regular fa-trash"></i>
                        </button>
                    </div>
                }
            </div>

            <div className="flex-1 p-5">
                {/* @tailwindcss/typography не підключений у проєкті (prose-класи без
                    ефекту) — стилізуємо markdown-теги вручну через arbitrary variants. */}
                <div className="max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300
                    [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:first:mt-0
                    [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:first:mt-0
                    [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-bold
                    [&_p]:mb-3 [&_p]:last:mb-0
                    [&_strong]:font-semibold [&_em]:italic
                    [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5
                    [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400
                    [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs dark:[&_code]:bg-slate-800
                    [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-slate-700
                    [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:text-slate-400">
                    <MarkdownRenderer content={post.body || ""}/>
                </div>

                <div className="mt-6">
                    <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Вкладення{post.attachments?.length ? ` (${post.attachments.length})` : ""}
                    </p>
                    <AttachmentsGallery data={post.attachments || []} isDisabled/>
                </div>

                {isPublished &&
                    <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                        Переглянули: {post.reads_count || 0}
                    </p>
                }
            </div>

            {vm.editOpen &&
                <DeveloperPostFormModal board={vm} post={post} onClose={vm.closeEdit}/>
            }

            <ConfirmModal
                open={vm.confirmDelete}
                onClose={vm.cancelDelete}
                onConfirm={handleDelete}
                isLoading={vm.deleteMutation.isPending}
                title="Видалити пост?"
                message="Пост та всі його вкладення буде видалено безповоротно."
            />
        </div>
    );
};

export default observer(DeveloperPostDetailPane);
