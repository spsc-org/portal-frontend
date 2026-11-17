import {isOpen} from "../../entities/dossierTicket/model.js";

// Компактний рядок тікета для лівого списку дашборду /dossier/tickets (за макетом
// TaskList: крапка стану, #id, обрізаний текст, кількість привʼязок, дата) — той самий
// принцип "рядок замість картки в списку", повна картка — у детальній панелі праворуч.
const TicketListRow = ({ticket, isSelected, onClick}) => {
    const open = isOpen(ticket);
    const linksCount = (ticket.links ?? []).length;

    return (
        <div data-i-doc="component:dossier-tickets-list-row"
            onClick={onClick}
            className={`group flex cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3 py-2 transition dark:border-slate-800 ${
                isSelected ? "bg-blue-50 dark:bg-blue-900/25" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
        >
            <span
                title={open ? "відкритий" : "вирішено"}
                className={`h-2 w-2 shrink-0 rounded-full ${open ? "bg-orange-400" : "bg-green-500"}`}
            />
            <span className="shrink-0 font-mono text-[11px] text-slate-400">#{ticket.id}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
                {ticket.text}
            </span>
            {linksCount > 0 && (
                <span className="hidden shrink-0 items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 sm:inline-flex">
                    <i className="fa-solid fa-link"></i>{linksCount}
                </span>
            )}
            <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">
                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("uk-UA") : ""}
            </span>
        </div>
    );
};

export default TicketListRow;
