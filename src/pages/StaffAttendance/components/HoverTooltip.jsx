import { observer } from 'mobx-react-lite';
import { useViewModel } from '../../../shared/mvvm/useViewModel.js';
import { AbsenceDetailsViewModel } from '../viewmodel/AttendanceModalViewModels.js';
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Typography, IconButton } from "@material-tailwind/react";

const AbsenceDetailsCard = observer(({ absence, onEdit, onDelete, onManageDocuments, hide }) => {
    const vm = useViewModel((deps) => new AbsenceDetailsViewModel({ ...deps, absenceId: absence.id }));
    const { data, isLoading } = vm;

    return (
        <Card className="p-3 text-xs flex flex-col gap-2 w-64 shadow-2xl pointer-events-auto border border-slate-200 dark:border-slate-800">
            {isLoading ? (
                <div className="p-2 text-center">Завантаження...</div>
            ) : data ? (
                <>
                    <div className="flex justify-between items-start border-b pb-1">
                        <Typography variant="small" className="font-bold">{data.user}</Typography>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <IconButton variant="text" size="sm" onClick={() => { onManageDocuments(absence); hide(); }} className="h-6 w-6"><i className="fa-solid fa-file text-[10px]"></i></IconButton>
                            <IconButton variant="text" size="sm" onClick={() => { onEdit(absence); hide(); }} className="h-6 w-6"><i className="fa-solid fa-pencil text-[10px]"></i></IconButton>
                            <IconButton variant="text" size="sm" onClick={() => { onDelete(absence); hide(); }} className="h-6 w-6 text-red-500"><i className="fa-solid fa-trash text-[10px]"></i></IconButton>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div><span className="font-semibold">Тип:</span> {data.type}</div>
                        <div><span className="font-semibold">Статус:</span> {data.status}</div>
                        <div><span className="font-semibold">Період:</span> {data.start_date} - {data.end_date || '...'}</div>
                        {data.travel_days > 0 && <div><span className="font-semibold">Днів на дорогу:</span> {data.travel_days}</div>}
                        {data.reason && <div><span className="font-semibold">Причина:</span> {data.reason}</div>}
                        {data.comment && <div><span className="font-semibold">Коментар:</span> {data.comment}</div>}
                        {data.documents && data.documents.length > 0 && (
                            <div className="border-t pt-1 mt-1">
                                <Typography className="font-semibold mb-1">Документи:</Typography>
                                <div className="flex flex-col gap-1 ml-2">
                                    {data.documents.map(doc => (
                                        <div key={doc.id} className="text-[9px]">
                                            <div className="font-semibold text-slate-700 dark:text-slate-300">№ {doc.document_number}</div>
                                            <div className="text-slate-600 dark:text-slate-400">{doc.document_date} • {doc.added_by}</div>
                                            {doc.description && <div className="text-slate-600 dark:text-slate-400">{doc.description}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </Card>
    );
});

const HoverTooltip = ({ absence, onEdit, onDelete, onManageDocuments, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const hideTimer = useRef(null);

    useEffect(() => {
        return () => {
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
            }
        };
    }, []);


    const handleMouseEnter = (e) => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
        const offsetX = 15;
        const offsetY = 15;
        setPosition({
            top: e.clientY + window.scrollY + offsetY,
            left: e.clientX + window.scrollX + offsetX
        });
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        hideTimer.current = setTimeout(() => {
            setIsVisible(false);
        }, 100);
    };


    return (
        <>
            {/* display: contents — обгортка без власного блоку, лише ловить hover дочірнього елемента */}
            <div className="contents" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {children}
            </div>
            {isVisible && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        top: position.top + 'px',
                        left: position.left + 'px'
                    }}
                    onMouseEnter={() => {
                        if (hideTimer.current) {
                            clearTimeout(hideTimer.current);
                            hideTimer.current = null;
                        }
                        setIsVisible(true);
                    }}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => e.stopPropagation()}
                >
                    <AbsenceDetailsCard absence={absence} onEdit={onEdit} onDelete={onDelete} onManageDocuments={onManageDocuments} hide={() => setIsVisible(false)} />
                </div>
            )}
        </>
    );
};

HoverTooltip.propTypes = {
    absence: PropTypes.shape({
        id: PropTypes.number,
    }).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onManageDocuments: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
};

export default HoverTooltip;
