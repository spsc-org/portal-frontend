import React from "react";
import {Dialog, DialogBody, DialogFooter, DialogHeader, Button, Typography, Spinner} from "@material-tailwind/react";
import {useQueryClient} from "@tanstack/react-query";
import {useTicketsQuery} from "../../entities/dossierTicket/queries.js";
import {dossierTicketKeys} from "../../shared/lib/queryKeys.js";
import TicketBody from "./TicketBody.jsx";

// Один тікет — одна модалка (навмисно НЕ список: попередня версія показувала всі
// тікети сутності одним прокручуваним блоком разом із формою нового — плутало
// "готовий тікет" із чорновиком нового). Кожна іконка в TicketsButton відкриває свій
// SingleTicketModal із конкретним ticketId.
const SingleTicketModal = ({open, onClose, ticketId, entityType, entityId, canManage}) => {
    const queryClient = useQueryClient();
    // Той самий queryKey, що й TicketsButton (список сутності) — тікет уже в кеші,
    // повторний фетч на відкриття не потрібен.
    const {data: tickets, isFetching} = useTicketsQuery(entityType, entityId, {enabled: open});
    const ticket = (tickets ?? []).find((t) => t.id === ticketId) ?? null;

    const invalidate = () => queryClient.invalidateQueries({queryKey: dossierTicketKeys.list(entityType, entityId)});

    return (
        <Dialog data-i-doc="modal:dossier-single-ticket"
            open={open}
            handler={onClose}
            size="sm"
            className="dark:bg-slate-900 border dark:border-slate-800"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}
        >
            <DialogHeader className="dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-ticket text-base"></i>
                <Typography variant="h5">Тікет #{ticketId}</Typography>
            </DialogHeader>
            <DialogBody className="max-h-[70vh] overflow-y-auto">
                {isFetching && !ticket && (
                    <div className="flex justify-center py-10"><Spinner className="h-7 w-7"/></div>
                )}
                {!isFetching && !ticket && (
                    <div className="py-10 text-center text-sm text-gray-400">Тікет не знайдено</div>
                )}
                {ticket && <TicketBody ticket={ticket} canManage={canManage} onChanged={invalidate}/>}
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="gray" onClick={onClose}>
                    Закрити
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default SingleTicketModal;
