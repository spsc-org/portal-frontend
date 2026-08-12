import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Card, Typography } from "@material-tailwind/react";
import { format, isSameDay, getDay, parseISO, differenceInDays, isFirstDayOfMonth } from 'date-fns';
import { uk } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useUpdateUserZpMutation } from '../../hooks/index.js';
import { CALENDAR_DIMENSIONS } from '../../constants/attendanceConfig.js';
import HoverTooltip from "../HoverTooltip.jsx";

const CalendarView = React.memo(({ days, calendarData, isLoading, getTypeColor, onCellClick, onEdit, onDelete, onManageDocuments, dateInterval, token, queryClient, workingDays, absenceTypes }) => {
    const today = new Date();
    const { CELL_WIDTH, EMPLOYEE_NAME_COLUMN_WIDTH } = CALENDAR_DIMENSIONS;
    const [hoveredCell, setHoveredCell] = useState(null);
    // userZpStates - локальний кеш статусу ЗП для оптимістичного оновлення UI
    const [userZpStates, setUserZpStates] = useState({});
    const updateUserZpMutation = useUpdateUserZpMutation();
    const scrollContainerRef = useRef(null);

    // При завантаженні сторінки та зміні діапазону центруємо видиму область
    // на сьогоднішній даті (якщо вона входить у вибраний період)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) {
            return;
        }
        const todayIndex = days.findIndex(day => isSameDay(day, new Date()));
        if (todayIndex === -1) {
            return;
        }
        const visibleWidth = container.clientWidth - EMPLOYEE_NAME_COLUMN_WIDTH;
        const target = todayIndex * CELL_WIDTH - visibleWidth / 2;
        container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
        // days перестворюється кожен рендер, тому залежність — dateInterval
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateInterval]);

    const isWorkingDay = (day) => workingDays.includes(getDay(day));

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <Card data-i-doc="view:staff-attendance-calendar-view" className="overflow-hidden border border-slate-200 dark:border-slate-800 dark:bg-slate-950 shadow-none rounded-2xl mt-2">
            <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                <table className="w-full table-fixed text-left border-collapse border-hidden">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                            <th className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 p-2" style={{ width: `${EMPLOYEE_NAME_COLUMN_WIDTH}px` }}>Співробітник</th>
                            {days.map(day => (
                                <th key={day.toString()} className={`p-1 border border-slate-200 text-center text-[10px] w-[36px] ${!isWorkingDay(day) ? 'bg-slate-200/50 dark:bg-slate-800/80' : ''} ${isSameDay(day, today) ? 'border-r-2 border-r-blue-500' : ''}`}>
                                    {isFirstDayOfMonth(day) ? (
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-[9px] text-blue-600">{format(day, 'MMM', { locale: uk })}</span>
                                            <span>{format(day, 'd')}</span>
                                        </div>
                                    ) : (
                                        format(day, 'd')
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? <tr><td colSpan={days.length + 1} className="p-12 text-center">Завантаження...</td></tr> : calendarData.map((row) => (
                            <tr key={row.employee_id} className="group relative h-7 hover:bg-blue-50 dark:hover:bg-blue-900/25">
                                <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-blue-50 dark:group-hover:bg-slate-800 p-1 border border-slate-200 dark:border-slate-800 flex items-center gap-1 text-[10px] h-7 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={userZpStates[row.employee_id] !== undefined ? userZpStates[row.employee_id] : (row.zp || false)}
                                        onChange={(e) => {
                                            // Отримуємо нове значення безпосередньо з события
                                            const newZpValue = e.target.checked;
                                            // Зберігаємо попереднє значення для відкату при помилці
                                            const previousValue = userZpStates[row.employee_id] !== undefined
                                                ? userZpStates[row.employee_id]
                                                : (row.zp || false);

                                            // Оновлюємо UI оптимістично
                                            setUserZpStates(prev => ({ ...prev, [row.employee_id]: newZpValue }));

                                            updateUserZpMutation.mutate(
                                                { userId: row.employee_id, zpValue: newZpValue },
                                                {
                                                    onSuccess: () => {
                                                        toast.success(`${row.full_name} - ЗП ${newZpValue ? 'включено' : 'вимкнено'}`);
                                                    },
                                                    onError: (error) => {
                                                        // Відкатуємо до попереднього значення при помилці (запобігає race condition)
                                                        setUserZpStates(prev => ({ ...prev, [row.employee_id]: previousValue }));
                                                        const message = error.response?.data?.message || 'Помилка при оновленні ЗП';
                                                        toast.error(`${row.full_name}: ${message}`);
                                                    }
                                                }
                                            );
                                        }}
                                        className="w-3 h-3 cursor-pointer"
                                        title="ЗП"
                                    />
                                    <span className="truncate">{row.full_name}</span>
                                </td>
                                {days.map(day => (
                                    <td
                                        key={day.toString()}
                                        className={`p-0 border dark:border-slate-800 h-7 cursor-pointer group-hover:bg-blue-50 dark:group-hover:bg-blue-900/25 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors relative ${!isWorkingDay(day) ? 'bg-slate-100 dark:bg-slate-800/40' : ''} ${isSameDay(day, today) ? 'border-r-2 border-r-blue-500' : ''}`}
                                        onClick={() => onCellClick(row.employee_id, day)}
                                        onMouseEnter={() => setHoveredCell(`${row.employee_id}-${day.toString()}`)}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    >
                                        {hoveredCell === `${row.employee_id}-${day.toString()}` && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-blue-100/80 dark:bg-blue-800/50">
                                                <i className="fa-solid fa-plus text-blue-600 dark:text-blue-400 text-xs"></i>
                                            </div>
                                        )}
                                    </td>
                                ))}
                                {row.absences.map(abs => {
                                    const startDate = parseISO(abs.start_date);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    let endDate;

                                    if (abs.end_date) {
                                        endDate = parseISO(abs.end_date);
                                    } else if (startDate > today) {
                                        endDate = parseISO(abs.start_date);
                                    } else {
                                        endDate = today;
                                    }

                                    const showStart = startDate < dateInterval.start ? dateInterval.start : startDate;
                                    const showEnd = endDate > dateInterval.end ? dateInterval.end : endDate;
                                    if (showStart > showEnd) return null;
                                    const isOpen = !abs.end_date;
                                    const leftOffset = 180 + differenceInDays(showStart, dateInterval.start) * CELL_WIDTH;
                                    const width = (differenceInDays(showEnd, showStart) + 1) * CELL_WIDTH;
                                    const hasDocuments = abs.documents && abs.documents.length > 0;

                                    const getBorderClass = () => {
                                        switch(abs.status_slug) {
                                            case 'pending':
                                                return 'border-2 border-dashed border-slate-400';
                                            case 'approved':
                                                return 'border border-slate-600';
                                            case 'rejected':
                                                return 'border-2 border-red-500';
                                            default:
                                                return 'border border-slate-400';
                                        }
                                    };

                                    return (
                                        <td key={abs.id} className="p-0 absolute pointer-events-none" style={{ left: `${leftOffset}px`, width: `${width}px`, top: '2px' }}>
                                            <HoverTooltip absence={abs} onEdit={onEdit} onDelete={onDelete} onManageDocuments={onManageDocuments}>
                                                <div
                                                    className={`h-6 cursor-pointer flex items-center justify-between px-1 shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105 hover:z-50 pointer-events-auto text-[9px] ${isOpen ? 'rounded-l-md rounded-r-none' : 'rounded-lg'} ${getBorderClass()}`}
                                                    style={{
                                                        backgroundColor: abs.status_slug === 'pending' ? hexToRgba(getTypeColor(abs.type_slug), 0.2) : getTypeColor(abs.type_slug),
                                                        borderColor: abs.status_slug === 'pending' ? getTypeColor(abs.type_slug) : undefined,
                                                        opacity: 0.85,
                                                        boxSizing: 'border-box'
                                                    }}
                                                    onClick={() => onEdit(abs)}
                                                >
                                                    <div className="flex items-center gap-0.5">
                                                        {(() => {
                                                            const durationDays = differenceInDays(endDate, startDate) + 1;
                                                            return (
                                                                <>
                                                                    {durationDays > 1 && (
                                                                        <span className="bg-white/40 text-[8px] px-0.5 rounded-full font-black text-slate-900 border border-black/10 leading-none py-0.5" title="Тривалість">
                                                                            {durationDays}д
                                                                        </span>
                                                                    )}
                                                                    {abs.travel_days > 0 && (
                                                                        <span className="bg-white/40 text-[8px] px-0.5 rounded-full font-black text-slate-900 border border-black/10 leading-none py-0.5" title="Днів на дорогу">
                                                                            +{abs.travel_days}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                    {(() => {
                                                        const durationDays = differenceInDays(endDate, startDate) + 1;
                                                        if (durationDays > 4) {
                                                            const typeName = absenceTypes.find(t => t.value === abs.type_slug)?.caption || '';
                                                            return (
                                                                <div className="flex-1 flex items-center justify-center px-1">
                                                                    <span className="truncate text-slate-700 text-[9px]" title={typeName}>
                                                                        {typeName}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                    {hasDocuments && (
                                                        <span
                                                            className="flex items-center justify-center gap-0.5 px-0.5 h-3.5 bg-white/40 rounded-full cursor-pointer hover:bg-white/60 transition-colors border border-black/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onManageDocuments(abs);
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-paperclip text-slate-900 text-[7px]"></i>
                                                            {abs.documents.length > 1 && <span className="text-slate-900 text-[7px] font-bold">{abs.documents.length}</span>}
                                                        </span>
                                                    )}
                                                </div>
                                            </HoverTooltip>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}, (prev, next) => {
    return prev.calendarData === next.calendarData &&
           prev.days === next.days &&
           prev.isLoading === next.isLoading &&
           prev.dateInterval === next.dateInterval &&
           prev.workingDays === next.workingDays &&
           prev.absenceTypes === next.absenceTypes;
});

CalendarView.propTypes = {
    days: PropTypes.arrayOf(PropTypes.instanceOf(Date)).isRequired,
    dateInterval: PropTypes.shape({
        start: PropTypes.instanceOf(Date),
        end: PropTypes.instanceOf(Date),
    }).isRequired,
    calendarData: PropTypes.arrayOf(PropTypes.shape({
        employee_id: PropTypes.number,
        full_name: PropTypes.string,
        zp: PropTypes.bool,
        absences: PropTypes.array,
    })).isRequired,
    isLoading: PropTypes.bool.isRequired,
    holidays: PropTypes.array,
    getTypeColor: PropTypes.func.isRequired,
    absenceTypes: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string,
        caption: PropTypes.string,
        color: PropTypes.string,
    })).isRequired,
    onCellClick: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onManageDocuments: PropTypes.func.isRequired,
    token: PropTypes.string,
    queryClient: PropTypes.object,
    workingDays: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default CalendarView;
