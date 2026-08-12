import React from "react";
import {IconButton, Tooltip} from "@material-tailwind/react";
import {useQueryClient} from "@tanstack/react-query";
import TicketBody from "./TicketBody.jsx";

// Панель деталей ОДНОГО обраного тікета праворуч (master-detail за зразком
// TaskViewPanel): одинарний клік по рядку зліва підвантажує сюди. Вміст — TicketBody
// (той самий, що й у SingleTicketModal на /dossier — не дублюємо логіку привʼязок/резолву).
const TicketDetailPanel = ({ticket, canManage, onClose}) => {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({queryKey: ["dossier-tickets-all"]});

    if (!ticket) {
        return (
            <aside className="w-[26rem] 2xl:w-[30rem] shrink-0 sticky top-14 self-start flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-gray-100 py-16 text-slate-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-500">
                <i className="fa-regular fa-hand-pointer text-2xl"></i>
                <span className="text-sm">Оберіть тікет зі списку зліва</span>
            </aside>
        );
    }

    return (
        <aside data-i-doc="view:dossier-tickets-detail-panel" className="w-[26rem] 2xl:w-[30rem] shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">#{ticket.id}</span>
                <Tooltip content="Закрити">
                    <IconButton size="sm" variant="text" className="text-slate-500 dark:text-slate-300" onClick={onClose}>
                        <i className="fa-regular fa-xmark text-base"></i>
                    </IconButton>
                </Tooltip>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
                <TicketBody ticket={ticket} canManage={canManage} onChanged={invalidate}/>
            </div>
        </aside>
    );
};

export default TicketDetailPanel;
