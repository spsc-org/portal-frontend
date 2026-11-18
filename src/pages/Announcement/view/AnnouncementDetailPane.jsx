import { observer } from "mobx-react-lite";
import { Spinner } from "@material-tailwind/react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import AttachmentsGallery from "../../../components/AttachmentsGallery.jsx";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import UserAvatars from "../../../components/UserAvatars.jsx";
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";
import AnnouncementFormModal from "./AnnouncementFormModal.jsx";

// Панель перегляду оголошення (master-detail, праворуч від списку) — відкриття
// цієї картки й фіксує прочитання на бекенді (AnnouncementService::getById),
// окрім requires_acknowledgement=true, де для цього є окрема кнопка "Я прочитав".
// Чистий перегляд + швидкі дії: ІНШИХ користувачів (підтвердження прочитання) й
// автора (публікація чернетки, видалення) — усе РЕДАГУВАННЯ контенту (заголовок/
// деталі/аудиторія/вкладення) винесено в CreateAnnouncementModal (проп `announcement`).
const AnnouncementDetailPane = ({ vm, onDeleted }) => {
    const announcement = vm.detail;

    if (!vm.activeId) {
        return (
            <div className="flex h-full flex-1 items-center justify-center text-gray-600 dark:text-gray-600">
                <div className="text-center">
                    <i className="fa-regular fa-bullhorn mb-2 text-3xl"></i>
                    <p className="text-sm">Оберіть оголошення зі списку</p>
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

    const handleDelete = () => vm.deleteActive().then((deleted) => deleted && onDeleted?.());

    return (
        <div data-i-doc="widget:announcement-detail-pane" className="flex h-full flex-1 flex-col overflow-y-auto bg-white dark:bg-neutral-800">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5 dark:border-neutral-700">
                <div className="min-w-0 flex-1">
                    <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                        {announcement.title}
                        {announcement.is_draft &&
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:bg-neutral-600 dark:text-gray-300">
                                Чернетка
                            </span>
                        }
                    </h1>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">
                        {announcement.author?.name || "—"} · {announcement.created_at ? format(new Date(announcement.created_at), "d MMMM yyyy, HH:mm", {locale: uk}) : ""}
                    </p>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-700 dark:text-gray-400">
                        <i className={`fa-solid ${announcement.audience_type === "selected" ? "fa-user-check" : "fa-users"}`}></i>
                        {announcement.audience_type === "selected"
                            ? `Адресати: ${(announcement.recipients || []).map((r) => r.name).join(", ") || "нікого не обрано"}`
                            : "Видимо всім користувачам"}
                    </span>
                </div>

                {vm.canManage &&
                    <div className="flex shrink-0 items-center gap-1.5">
                        {announcement.is_draft &&
                            <LoadingButton size="sm" color="blue" isLoading={vm.publishMutation.isPending}
                                           onClick={vm.publishActive}>
                                <i className="fa-solid fa-paper-plane mr-1.5"></i>Опублікувати
                            </LoadingButton>
                        }
                        <button type="button" onClick={vm.openEdit} title="Редагувати"
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:hover:bg-neutral-700">
                            <i className="fa-regular fa-pen"></i>
                        </button>
                        <button type="button" onClick={vm.askDelete} title="Видалити"
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-red-900/20">
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
                        {vm.showAcknowledgeButton &&
                            <LoadingButton size="sm" color="amber" isLoading={vm.acknowledgeMutation.isPending}
                                           onClick={vm.acknowledgeActive}>
                                Я прочитав
                            </LoadingButton>
                        }
                    </div>
                }

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {announcement.details}
                </p>

                <div className="mt-6">
                    <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Вкладення{announcement.attachments?.length ? ` (${announcement.attachments.length})` : ""}
                    </p>
                    <AttachmentsGallery data={announcement.attachments || []} isDisabled/>
                </div>

                {!announcement.is_draft &&
                <div className="mt-6 border-t border-gray-100 pt-4 dark:border-neutral-700">
                    <div className="mb-1.5 flex items-center gap-2">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Прочитали{announcement.reads_count ? ` (${announcement.reads_count})` : ""}
                        </p>
                        {announcement.recipients_count > 0 &&
                            (announcement.is_fully_read ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <i className="fa-solid fa-check-double"></i>Прочитали всі адресати
                                </span>
                            ) : (
                                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-500">
                                    Адресати: {announcement.recipients_read_count}/{announcement.recipients_count}
                                </span>
                            ))
                        }
                    </div>
                    <UserAvatars users={announcement.readers || []} max={12}/>
                </div>
                }
            </div>

            {vm.editOpen &&
                <AnnouncementFormModal board={vm} announcement={announcement} onClose={vm.closeEdit}/>
            }

            <ConfirmModal
                open={vm.confirmDelete}
                onClose={vm.cancelDelete}
                onConfirm={handleDelete}
                isLoading={vm.deleteMutation.isPending}
                title="Видалити оголошення?"
                message="Оголошення та всі його вкладення буде видалено безповоротно."
            />
        </div>
    );
};

export default observer(AnnouncementDetailPane);
