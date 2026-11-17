import { observer } from "mobx-react-lite";
import { useVM } from "../../../shared/mvvm/index.js";

/** "Новий тікет" / "Редагувати тікет" (порт modal-ticket.blade.php). Стан — TicketFormViewModel. */
const TicketModal = () => {
    const vm = useVM().ticketForm;
    if (!vm.isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[1060] overflow-y-auto bg-black/45"
            data-testid="project-ticket-modal"
        >
            <div className="flex min-h-full items-center justify-center p-4" onMouseDown={(event) => event.target === event.currentTarget && vm.close()}>
                <div className="flex w-full max-w-lg flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-neutral-700">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                <i className="fa-regular fa-message-plus text-sm text-blue-500 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">{vm.isEdit ? "Редагувати тікет" : "Новий тікет"}</h3>
                                <p className="mt-0.5 text-xs leading-tight text-gray-400 dark:text-gray-500">
                                    {vm.projectName ? `${vm.projectName} · #${vm.projectId}` : `#${vm.projectId}`}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={vm.close} aria-label="Закрити" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-neutral-700 dark:hover:text-gray-300">
                            <i className="fa-solid fa-xmark pointer-events-none text-base" />
                        </button>
                    </div>

                    <form className="space-y-4 px-5 py-4" onSubmit={vm.submit}>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label htmlFor="ticket-text" className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                    Опис тікету
                                </label>
                                <span className="text-xs text-red-500 dark:text-red-400">{vm.errors.text}</span>
                            </div>
                            <textarea
                                id="ticket-text"
                                name="text"
                                rows={4}
                                spellCheck
                                autoFocus
                                autoComplete="off"
                                value={vm.text}
                                onChange={(event) => vm.setText(event.target.value)}
                                placeholder="Опишіть проблему або залиште коментар…"
                                className={`w-full resize-none rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:text-gray-100 dark:placeholder-gray-600 dark:focus:ring-blue-600 ${vm.errors.text ? "border-red-400 dark:border-red-600" : "border-gray-200 dark:border-neutral-600"}`}
                            />
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Вкладення</span>
                                <span className="text-xs text-red-500 dark:text-red-400">{vm.errors.attachment}</span>
                            </div>
                            {vm.file ? (
                                <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 dark:border-blue-800 dark:bg-blue-900/20">
                                    <i className="fa-regular fa-file shrink-0 text-sm text-blue-500 dark:text-blue-400" />
                                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-200">{vm.file.name}</span>
                                    {vm.file.href && (
                                        <a href={vm.file.href} target="_blank" rel="noreferrer" title="Завантажити" className="shrink-0 text-xs text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                            <i className="fa-solid fa-download" />
                                        </a>
                                    )}
                                    <button type="button" title="Видалити вкладення" onClick={vm.dropFile} className="shrink-0 text-gray-400 transition hover:text-red-500 dark:hover:text-red-400">
                                        <i className="fa-solid fa-xmark text-sm" />
                                    </button>
                                </div>
                            ) : (
                                <label className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 px-3.5 py-2.5 transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-neutral-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10">
                                    <i className="fa-regular fa-paperclip text-sm text-gray-400 transition group-hover:text-blue-500 dark:text-gray-500" />
                                    <span className="select-none text-sm text-gray-400 transition group-hover:text-blue-500 dark:text-gray-500">Прикріпити файл</span>
                                    {vm.uploading && (
                                        <span className="ml-auto whitespace-nowrap text-xs text-blue-500 dark:text-blue-400">
                                            <i className="fa-solid fa-spinner fa-spin mr-1" />
                                            Завантаження…
                                        </span>
                                    )}
                                    <input type="file" className="hidden" onChange={(event) => (vm.pickFile(event.target.files?.[0]), (event.target.value = ""))} />
                                </label>
                            )}
                        </div>

                        {vm.message && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{vm.message}</div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                            <button type="button" onClick={vm.close} className="px-3 py-2 text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                Скасувати
                            </button>
                            <button
                                type="submit"
                                disabled={vm.saving || vm.uploading}
                                data-testid="ticket-submit"
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-neutral-900"
                            >
                                {vm.saving && <i className="fa-solid fa-spinner fa-spin text-sm" />}
                                {vm.isEdit ? "Зберегти зміни" : "Додати"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default observer(TicketModal);
