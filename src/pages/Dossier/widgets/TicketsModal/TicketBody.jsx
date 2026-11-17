import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { TicketBodyViewModel } from "../../viewmodel/DossierViewModels.js";

import {Spinner} from "@material-tailwind/react";
import MetaRow from "../../../../components/MetaRow.jsx";
import {entityLabel, entityUrl, isOpen, stateMeta} from "../../entities/dossierTicket/model.js";
import AddLinkFields from "./AddLinkFields.jsx";

const formatDate = (value) => (value ? new Date(value).toLocaleString("uk-UA") : "—");

// Вміст ОДНОГО тікета (текст, привʼязки з додаванням/видаленням, резолв) — без обгортки
// Dialog/aside, щоб той самий блок переюзали і SingleTicketModal (картка/звʼязок на
// /dossier), і TicketDetailPanel (дашборд /dossier/tickets). `onChanged` — колбек
// інвалідації кешу, різний у викликачів (entity-scoped список vs дашборд-список).
/** Монтується з key={ticket.id} (VM дій — на один тікет). */
const TicketBody = ({ticket, canManage, onChanged}) => {
    const vm = useViewModel((deps) => new TicketBodyViewModel({ ...deps, ticketId: ticket.id, onChanged }));
    const { resolving, resolutionNote } = vm;
    const setResolving = vm.setResolving;
    const setResolutionNote = vm.setResolutionNote;
    const resolveMutation = { mutate: vm.resolve, isPending: vm.cmd.resolve.isPending };
    const addLinkMutation = { mutate: vm.addLink, isPending: vm.cmd.addLink.isPending };
    const removeLinkMutation = { mutate: vm.removeLink, isPending: vm.cmd.removeLink.isPending };

    const status = stateMeta(ticket.state);
    const links = ticket.links ?? [];
    const canRemove = links.length > 1;

    return (
        <div data-i-doc="component:dossier-ticket-body">
            <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold ${status.classes}`}>
                    <i className={`${status.icon} text-[10px]`}></i>{status.label}
                </span>
            </div>

            <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {ticket.text}
            </div>

            <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/60 px-3 dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-800/40">
                <MetaRow icon="fa-regular fa-user-pen" label="Створив">
                    Користувач #{ticket.created_by}
                </MetaRow>
                <MetaRow icon="fa-regular fa-clock" label="Створено">
                    {formatDate(ticket.created_at)}
                </MetaRow>
                {!isOpen(ticket) && (
                    <>
                        <MetaRow icon="fa-regular fa-user-check" label="Вирішив">
                            Користувач #{ticket.resolved_by} · {formatDate(ticket.resolved_at)}
                        </MetaRow>
                        {ticket.resolution_note && (
                            <MetaRow icon="fa-regular fa-comment" label="Коментар">
                                {ticket.resolution_note}
                            </MetaRow>
                        )}
                    </>
                )}
            </div>

            <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Привʼязки ({links.length})
                </p>
                <div className="flex flex-col gap-1.5">
                    {links.map((link) => {
                        const url = entityUrl(link);
                        const label = `${entityLabel(link.type)} #${link.id}`;

                        return (
                            <div
                                key={`${link.type}-${link.id}`}
                                className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-800/60"
                            >
                                {url ? (
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    >
                                        {label}
                                    </a>
                                ) : (
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                                )}
                                {canRemove && (
                                    <button
                                        type="button"
                                        title="Прибрати привʼязку"
                                        disabled={removeLinkMutation.isPending}
                                        onClick={() => removeLinkMutation.mutate({type: link.type, id: link.id})}
                                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        <i className="fa-solid fa-xmark text-[10px]"></i>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-2">
                    <AddLinkFields onAdd={(link) => addLinkMutation.mutate(link)} isPending={addLinkMutation.isPending}/>
                </div>
            </div>

            {isOpen(ticket) && canManage && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {resolving ? (
                        <div className="flex flex-col gap-1.5">
                            <textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Коментар до вирішення (необовʼязково)…"
                                rows={2}
                                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11.5px] dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />
                            <div className="flex justify-end gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setResolving(false)}
                                    className="text-[11px] font-semibold text-slate-500 px-2 py-1 hover:text-slate-700 dark:text-slate-400"
                                >
                                    Скасувати
                                </button>
                                <button
                                    type="button"
                                    disabled={resolveMutation.isPending}
                                    onClick={() => resolveMutation.mutate(resolutionNote.trim() || null)}
                                    className="text-[11px] font-semibold text-white bg-green-600 rounded-md px-2.5 py-1 hover:brightness-95 disabled:opacity-50"
                                >
                                    {resolveMutation.isPending ? <Spinner className="h-3 w-3"/> : "Підтвердити"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setResolving(true)}
                            className="text-[11px] font-semibold text-green-700 hover:text-green-800 dark:text-green-400"
                        >
                            <i className="fa-solid fa-check text-[10px] mr-1"></i>Вирішити
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default observer(TicketBody);
