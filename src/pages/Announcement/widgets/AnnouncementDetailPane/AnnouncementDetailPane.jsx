import React, {useState} from "react";
import {usePage} from "@inertiajs/react";
import {Spinner} from "@material-tailwind/react";
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import AttachmentsGallery from "../../../../Components/AttachmentsGallery.jsx";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import UserAvatars from "../../../../Components/UserAvatars.jsx";
import ConfirmModal from "../../../../Components/Modal/ConfirmModal.jsx";
import CreateAnnouncementModal from "../../features/create-announcement/CreateAnnouncementModal.jsx";
import {
    useAcknowledgeAnnouncementMutation,
    useAnnouncementQuery,
    useDeleteAnnouncementMutation,
    usePublishAnnouncementMutation,
} from "../../entities/announcement/queries.js";
import {canManageAnnouncement} from "../../shared/lib/permissions.js";

// Панель перегляду оголошення (master-detail, праворуч від списку) — відкриття
// цієї картки й фіксує прочитання на бекенді (AnnouncementService::getById),
// окрім requires_acknowledgement=true, де для цього є окрема кнопка "Я прочитав".
// Чистий перегляд + швидкі дії: ІНШИХ користувачів (підтвердження прочитання) й
// автора (публікація чернетки, видалення) — усе РЕДАГУВАННЯ контенту (заголовок/
// деталі/аудиторія/вкладення) винесено в CreateAnnouncementModal (проп `announcement`).
const AnnouncementDetailPane = ({announcementId, onDeleted}) => {
    const {auth} = usePage().props;
    const {data, isLoading} = useAnnouncementQuery(announcementId);
    const announcement = data;

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);

    const deleteMutation = useDeleteAnnouncementMutation();
    const acknowledgeMutation = useAcknowledgeAnnouncementMutation(announcementId);
    const publishMutation = usePublishAnnouncementMutation(announcementId);

    if (!announcementId) {
        return (
            <div className="flex h-screen flex-1 items-center justify-center text-slate-400 dark:text-slate-600">
                <div className="text-center">
                    <i className="fa-regular fa-bullhorn mb-2 text-3xl"></i>
                    <p className="text-sm">Оберіть оголошення зі списку</p>
                </div>
            </div>
        );
    }

    if (isLoading || !announcement) {
        return (
            <div className="flex h-screen flex-1 items-center justify-center">
                <Spinner className="h-8 w-8"/>
            </div>
        );
    }

    const canManage = canManageAnnouncement(auth, announcement);

    const handleDelete = () => {
        deleteMutation.mutate(announcementId, {
            onSuccess: () => {
                setConfirmDelete(false);
                onDeleted?.();
            },
        });
    };

    const showAcknowledgeButton = announcement.requires_acknowledgement && !announcement.is_read;

    return (
        <div data-i-doc="widget:announcement-detail-pane" className="flex h-screen flex-1 flex-col overflow-y-auto bg-white dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
                <div className="min-w-0 flex-1">
                    <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {announcement.title}
                        {announcement.is_draft &&
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                Чернетка
                            </span>
                        }
                    </h1>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {announcement.author?.name || "—"} · {announcement.created_at ? format(new Date(announcement.created_at), "d MMMM yyyy, HH:mm", {locale: uk}) : ""}
                    </p>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <i className={`fa-solid ${announcement.audience_type === "selected" ? "fa-user-check" : "fa-users"}`}></i>
                        {announcement.audience_type === "selected"
                            ? `Адресати: ${(announcement.recipients || []).map((r) => r.name).join(", ") || "нікого не обрано"}`
                            : "Видимо всім користувачам"}
                    </span>
                </div>

                {canManage &&
                    <div className="flex shrink-0 items-center gap-1.5">
                        {announcement.is_draft &&
                            <LoadingButton size="sm" color="blue" isLoading={publishMutation.isPending}
                                           onClick={() => publishMutation.mutate()}>
                                <i className="fa-solid fa-paper-plane mr-1.5"></i>Опублікувати
                            </LoadingButton>
                        }
                        <button type="button" onClick={() => setOpenEdit(true)} title="Редагувати"
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                            <i className="fa-regular fa-pen"></i>
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(true)} title="Видалити"
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-900/20">
                            <i className="fa-regular fa-trash"></i>
                        </button>
                    </div>
                }
            </div>

            <div className="flex-1 p-5">
                {!announcement.is_draft && announcement.requires_acknowledgement &&
                    <div className={`mb-4 flex items-center justify-between rounded-lg border p-3 text-sm ${
                        announcement.is_read
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                    }`}>
                        <span>
                            <i className="fa-solid fa-circle-check mr-1.5"></i>
                            {announcement.is_read ? "Ви підтвердили прочитання" : "Це оголошення потребує підтвердження прочитання"}
                        </span>
                        {showAcknowledgeButton &&
                            <LoadingButton size="sm" color="amber" isLoading={acknowledgeMutation.isPending}
                                           onClick={() => acknowledgeMutation.mutate()}>
                                Я прочитав
                            </LoadingButton>
                        }
                    </div>
                }

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {announcement.details}
                </p>

                <div className="mt-6">
                    <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Вкладення{announcement.attachments?.length ? ` (${announcement.attachments.length})` : ""}
                    </p>
                    <AttachmentsGallery data={announcement.attachments || []} isDisabled/>
                </div>

                {!announcement.is_draft &&
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="mb-1.5 flex items-center gap-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Прочитали{announcement.reads_count ? ` (${announcement.reads_count})` : ""}
                        </p>
                        {announcement.recipients_count > 0 &&
                            (announcement.is_fully_read ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <i className="fa-solid fa-check-double"></i>Прочитали всі адресати
                                </span>
                            ) : (
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                    Адресати: {announcement.recipients_read_count}/{announcement.recipients_count}
                                </span>
                            ))
                        }
                    </div>
                    <UserAvatars users={announcement.readers || []} max={12}/>
                </div>
                }
            </div>

            {openEdit &&
                <CreateAnnouncementModal
                    open={openEdit}
                    onClose={() => setOpenEdit(false)}
                    announcement={announcement}
                />
            }

            <ConfirmModal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
                title="Видалити оголошення?"
                message="Оголошення та всі його вкладення буде видалено безповоротно."
            />
        </div>
    );
};

export default AnnouncementDetailPane;
