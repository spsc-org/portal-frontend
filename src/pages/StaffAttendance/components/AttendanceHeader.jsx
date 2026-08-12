import React from 'react';
import { Typography, Button } from "@material-tailwind/react";

const AttendanceHeader = ({
    onOpenCreate,
    onOpenStatistics,
    onOpenSummary,
    onOpenVacationSchedule,
    viewMode,
    onViewModeChange
}) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <Typography variant="h4" className="text-slate-800 dark:text-slate-100 font-black tracking-tight">
                Облік перебування персоналу
            </Typography>
        </div>
        <div className="flex gap-2">
            <div className="flex w-fit">
                <Button
                    type="button"
                    variant={viewMode === 'calendar' ? "filled" : "outlined"}
                    color={viewMode === 'calendar' ? "blue" : "blue-gray"}
                    onClick={() => onViewModeChange('calendar')}
                    size="sm"
                    className="rounded-l-lg rounded-r-none px-3 py-2 flex items-center gap-2"
                >
                    <i className="fa-solid fa-calendar text-xs"></i>
                    <span className="text-xs">Сітка</span>
                </Button>
                <Button
                    type="button"
                    variant={viewMode === 'table' ? "filled" : "outlined"}
                    color={viewMode === 'table' ? "blue" : "blue-gray"}
                    onClick={() => onViewModeChange('table')}
                    size="sm"
                    className="rounded-r-lg rounded-l-none px-3 py-2 flex items-center gap-2"
                >
                    <i className="fa-solid fa-list text-xs"></i>
                    <span className="text-xs">Таблиця</span>
                </Button>
            </div>
            <Button color="teal" size="sm" className="flex items-center gap-2 shadow-teal-200" onClick={onOpenVacationSchedule}>
                <i className="fa-solid fa-calendar-days text-xs"></i> Графік відпусток
            </Button>
            <Button color="amber" size="sm" className="flex items-center gap-2 shadow-amber-200" onClick={onOpenSummary}>
                <i className="fa-solid fa-table-list text-xs"></i> Зведена таблиця
            </Button>
            <Button color="gray" size="sm" className="flex items-center gap-2 shadow-gray-200" onClick={onOpenStatistics}>
                <i className="fa-solid fa-chart-bar text-xs"></i> Стройовка
            </Button>
            <Button color="blue" size="sm" className="flex items-center gap-2 shadow-blue-200" onClick={onOpenCreate}>
                <i className="fa-solid fa-plus text-xs"></i> Створити заявку
            </Button>
        </div>
    </div>
);

export default AttendanceHeader;
