import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { TicketsButtonViewModel } from "../../viewmodel/DossierViewModels.js";

import {Tooltip} from "@material-tailwind/react";
import {isOpen} from "../../entities/dossierTicket/model.js";
import SingleTicketModal from "./SingleTicketModal.jsx";
import CreateTicketModal from "./CreateTicketModal.jsx";

// Кластер іконок тікетів для картки/рядка (профіль або звʼязок): ОДНА іконка на ОДИН
// тікет (колір за станом), клік відкриває SingleTicketModal саме для нього — навмисно
// не єдина модалка зі списком усіх (плутала перегляд готового тікета з чорновиком
// нового). Окрема іконка "+" (або "чернетка", якщо є незбережений драфт) — CreateTicketModal.
const TicketsButton = ({entityType, entityId, entityLabel, canManage, className = ""}) => {
    const vm = useViewModel((deps) => new TicketsButtonViewModel({ ...deps, entityType, entityId }));
    const { openTicketId, creating, draftPending } = vm;
    const setOpenTicketId = vm.setOpenTicketId;
    const setCreating = vm.setCreating;
    const list = vm.tickets;

    return (
        <div data-i-doc="component:dossier-tickets-button" className={`inline-flex items-center gap-1 ${className}`}>
            {list.map((ticket) => {
                const open = isOpen(ticket);

                return (
                    <Tooltip key={ticket.id} content={`Тікет #${ticket.id} — ${open ? "відкритий" : "вирішено"}`}>
                        <button
                            type="button"
                            onClick={() => setOpenTicketId(ticket.id)}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-semibold transition ${
                                open
                                    ? "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300"
                                    : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
                            }`}
                        >
                            <i className="fa-solid fa-ticket"></i>
                        </button>
                    </Tooltip>
                );
            })}
            <Tooltip content={draftPending ? "Є незбережена чернетка тікета" : "Новий тікет"}>
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className={`inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-semibold transition ${
                        draftPending
                            ? "bg-blue-50 text-blue-700 border border-dashed border-blue-300 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-600"
                    }`}
                >
                    <i className="fa-solid fa-ticket"></i>
                    {draftPending ? "чернетка" : "новий"}
                </button>
            </Tooltip>

            {openTicketId && (
                <SingleTicketModal
                    open={Boolean(openTicketId)}
                    onClose={() => setOpenTicketId(null)}
                    ticketId={openTicketId}
                    entityType={entityType}
                    entityId={entityId}
                    canManage={canManage}
                />
            )}
            {creating && <CreateTicketModal
                open={creating}
                onClose={() => setCreating(false)}
                entityType={entityType}
                entityId={entityId}
                entityLabel={entityLabel}
                onCreated={(ticket) => setOpenTicketId(ticket.id)}
            />}
        </div>
    );
};

export default observer(TicketsButton);
