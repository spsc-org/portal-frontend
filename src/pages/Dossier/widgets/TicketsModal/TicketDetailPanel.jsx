
import { Tooltip } from "@material-tailwind/react"
import IconButton from "../../../../components/Buttons/IconButton.jsx"
import TicketBody from "./TicketBody.jsx";

// Панель деталей ОДНОГО обраного тікета праворуч (master-detail за зразком
// TaskViewPanel): одинарний клік по рядку зліва підвантажує сюди. Вміст — TicketBody
// (той самий, що й у SingleTicketModal на /dossier — не дублюємо логіку привʼязок/резолву).
/** onChanged — інвалідує список усіх тікетів (TicketsPageViewModel). */
const TicketDetailPanel = ({ticket, canManage, onClose, onChanged}) => {
    const invalidate = onChanged;

    if (!ticket) {
        return (
            <aside className="w-[26rem] 2xl:w-[30rem] shrink-0 sticky top-14 self-start flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-100 py-16 text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-500">
                <i className="fa-regular fa-hand-pointer text-2xl"></i>
                <span className="text-sm">Оберіть тікет зі списку зліва</span>
            </aside>
        );
    }

    return (
        <aside data-i-doc="view:dossier-tickets-detail-panel" className="w-[26rem] 2xl:w-[30rem] shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2.5 dark:border-neutral-700">
                <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">#{ticket.id}</span>
                <Tooltip content="Закрити">
                    <IconButton size="sm" variant="text" className="text-gray-600 dark:text-gray-300" onClick={onClose}>
                        <i className="fa-regular fa-xmark text-base"></i>
                    </IconButton>
                </Tooltip>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
                <TicketBody key={ticket.id} ticket={ticket} canManage={canManage} onChanged={invalidate}/>
            </div>
        </aside>
    );
};

export default TicketDetailPanel;
