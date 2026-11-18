import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { TicketsButtonViewModel } from "../../viewmodel/DossierViewModels.js";

import { Typography, Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import TicketBody from "./TicketBody.jsx";

// Один тікет — одна модалка (навмисно НЕ список: попередня версія показувала всі
// тікети сутності одним прокручуваним блоком разом із формою нового — плутало
// "готовий тікет" із чорновиком нового). Кожна іконка в TicketsButton відкриває свій
// SingleTicketModal із конкретним ticketId.
const SingleTicketModal = ({open, onClose, ticketId, entityType, entityId, canManage}) => {
    const vm = useViewModel((deps) => new TicketsButtonViewModel({ ...deps, entityType, entityId }));
    const tickets = vm.tickets;
    const isFetching = vm.isFetching;
    const ticket = (tickets ?? []).find((t) => t.id === ticketId) ?? null;
    const invalidate = vm.invalidate;

    return (
        <Modal data-i-doc="modal:dossier-single-ticket"
            open={open}
            handler={onClose}
            size="sm"
            className="border"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}>
            <ModalHeader className="flex items-center gap-2">
                <i className="fa-solid fa-ticket text-base"></i>
                <Typography variant="h5">Тікет #{ticketId}</Typography>
            </ModalHeader>
            <ModalBody className="max-h-[70vh] overflow-y-auto">
                {isFetching && !ticket && (
                    <div className="flex justify-center py-10"><Spinner className="h-7 w-7"/></div>
                )}
                {!isFetching && !ticket && (
                    <div className="py-10 text-center text-sm text-gray-600">Тікет не знайдено</div>
                )}
                {ticket && <TicketBody key={ticket.id} ticket={ticket} canManage={canManage} onChanged={invalidate}/>}
            </ModalBody>
            <ModalFooter>
                <Button variant="text" color="gray" onClick={onClose}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(SingleTicketModal);
