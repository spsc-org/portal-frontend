import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths } from 'date-fns';
import Page from "@/Components/Page.jsx";
import { DictionaryProvider } from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import ConfirmModal from "@/Components/Modal/ConfirmModal.jsx";
import AttendanceFilters from "./components/AttendanceFilters.jsx";
import AttendanceHeader from "./components/AttendanceHeader.jsx";
import AttendanceLegend from "./components/AttendanceLegend.jsx";
import AddEditAbsenceModal from "./components/modals/AddEditAbsenceModal.jsx";
import DocumentsModal from "./components/modals/DocumentsModal.jsx";
import StatisticsModal from "./components/modals/StatisticsModal.jsx";
import SummaryModal from "./components/modals/SummaryModal.jsx";
import CalendarView from "./components/views/CalendarView.jsx";
import TableView from "./components/views/TableView.jsx";
import {
    useAttendancePreferences,
    useStaffOptions,
    useStaffCalendar,
    useDeleteAbsenceMutation,
} from "./hooks/index.js";

const Index = () => {
    const queryClient = useQueryClient();
    const { rangeType, setRangeType, filters, setFilters, viewMode, setViewMode, currentDate, setCurrentDate } = useAttendancePreferences();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
    const [isStatisticsDialogOpen, setIsStatisticsDialogOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [editingAbsence, setEditingAbsence] = useState(null);
    const [absenceForDocuments, setAbsenceForDocuments] = useState(null);

    const { data: optionsResponse } = useStaffOptions();

    const options = optionsResponse?.data || { absence_types: [], statuses: [], working_days: [1, 2, 3, 4, 5], users: [], report_types: { groups: [], types: [] } };
    
    const dateInterval = useMemo(() => {
        const start = startOfMonth(currentDate);
        let end;
        switch (rangeType) {
            case '2m': end = endOfMonth(addMonths(start, 1)); break;
            case '3m': end = endOfMonth(addMonths(start, 2)); break;
            case '6m': end = endOfMonth(addMonths(start, 5)); break;
            case '1y': end = endOfMonth(addMonths(start, 11)); break;
            default: end = endOfMonth(start);
        }
        return { start, end };
    }, [currentDate, rangeType]);

    const { data: calendarResponse, isLoading: isCalendarLoading } = useStaffCalendar(
        dateInterval,
        filters,
        rangeType,
        optionsResponse
    );

    const calendarData = useMemo(() => {
        const data = calendarResponse?.data || [];
        return data.map(row => ({
            ...row,
            zp: Boolean(row.zp)
        }));
    }, [calendarResponse?.data]);
    const holidays = calendarResponse?.holidays || [];

    const { data, setData, reset } = useForm({
        id: '', user_id: '', type: 'remote', status: 'approved', start_date: '', end_date: '', reason: '', travel_days: 0
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Insert') {
                e.preventDefault();
                setEditingAbsence(null);
                reset();
                setIsCreateModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleCellClick = (employeeId, date) => {
        setEditingAbsence(null);
        const dateStr = format(date, 'yyyy-MM-dd');
        setData({ id: '', user_id: String(employeeId), type: 'remote', status: 'approved', start_date: dateStr, end_date: dateStr, reason: '', travel_days: 0 });
        setIsCreateModalOpen(true);
    };

    const handleEdit = (absence) => {
        setEditingAbsence(absence);
        setData({
            id: String(absence.id),
            user_id: String(absence.user_id),
            type: absence.type_slug,
            status: absence.status_slug || 'pending',
            start_date: absence.start_date,
            end_date: absence.end_date || '',
            reason: absence.reason || '',
            travel_days: absence.travel_days || 0
        });
        setIsCreateModalOpen(true);
    };

    const { token } = usePage().props;

    const handleDeleteSuccess = () => {
        setIsDeleteConfirmOpen(false);
        setIsCreateModalOpen(false);
        reset();
    };

    const deleteMutation = useDeleteAbsenceMutation(handleDeleteSuccess);

    const handleDelete = (absence) => {
        setEditingAbsence(absence);
        setIsDeleteConfirmOpen(true);
    };

    const handleManageDocuments = (absence) => {
        setAbsenceForDocuments(absence);
        setIsDocumentsDialogOpen(true);
    };

    const deleteRequest = () => {
        if (editingAbsence?.id) {
            deleteMutation.mutate(editingAbsence.id);
        }
    };

    const handleVacationSchedule = () => {
        window.open('/staff/vacation-schedule', '_blank');
    };

    const handleOpenCreate = () => {
        setEditingAbsence(null);
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        setData({
            id: '',
            user_id: '',
            type: options.absence_types[0]?.value || '',
            status: 'pending',
            start_date: dateStr,
            end_date: dateStr,
            reason: '',
            travel_days: 0
        });
        setIsCreateModalOpen(true);
    };

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:staff-attendance">
                <Head title="Облік персоналу" />
                <AttendanceHeader
                    onOpenCreate={handleOpenCreate}
                    onOpenStatistics={() => setIsStatisticsDialogOpen(true)}
                    onOpenSummary={() => setIsSummaryModalOpen(true)}
                    onOpenVacationSchedule={handleVacationSchedule}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
                <AttendanceFilters
                    dateInterval={dateInterval}
                    rangeType={rangeType}
                    setRangeType={setRangeType}
                    filters={filters}
                    setFilters={setFilters}
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    options={options}
                />
                {viewMode === 'calendar' ? (
                    <>
                        <CalendarView
                            days={eachDayOfInterval({ start: dateInterval.start, end: dateInterval.end })}
                            dateInterval={dateInterval}
                            calendarData={calendarData}
                            isLoading={isCalendarLoading}
                            holidays={holidays}
                            getTypeColor={(val) => options.absence_types.find(t => t.value === val)?.color || '#ccc'}
                            absenceTypes={options.absence_types}
                            onCellClick={handleCellClick}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onManageDocuments={handleManageDocuments}
                            token={token}
                            queryClient={queryClient}
                            workingDays={options.working_days}
                        />
                        <AttendanceLegend absenceTypes={options.absence_types} />
                    </>
                ) : (
                    <TableView
                        calendarData={calendarData}
                        isLoading={isCalendarLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onManageDocuments={handleManageDocuments}
                        absenceTypes={options.absence_types}
                    />
                )}

                <AddEditAbsenceModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    editingAbsence={editingAbsence}
                    data={data}
                    setData={setData}
                    reset={reset}
                    options={options}
                    onOpenDelete={() => setIsDeleteConfirmOpen(true)}
                />

                <ConfirmModal
                    open={isDeleteConfirmOpen}
                    onClose={() => setIsDeleteConfirmOpen(false)}
                    onConfirm={deleteRequest}
                    title="Видалення запису"
                    message="Ви впевнені, що хочете видалити цей запис?"
                    isLoading={deleteMutation.isPending}
                />

                <DocumentsModal
                    isOpen={isDocumentsDialogOpen}
                    onClose={() => setIsDocumentsDialogOpen(false)}
                    absence={absenceForDocuments}
                />

                <StatisticsModal
                    isOpen={isStatisticsDialogOpen}
                    onClose={() => setIsStatisticsDialogOpen(false)}
                />

                <SummaryModal
                    isOpen={isSummaryModalOpen}
                    onClose={() => setIsSummaryModalOpen(false)}
                    initialFilters={{
                        startDate: format(dateInterval.start, 'yyyy-MM-dd'),
                        endDate: format(dateInterval.end, 'yyyy-MM-dd'),
                        users: filters.users.map(u => u.id || u.value),
                        types: filters.types.map(t => t.value || t),
                        statuses: ['approved'],
                    }}
                    absenceTypes={options.absence_types}
                />
                </div>
            </Page>
        </DictionaryProvider>
    );
};

export default Index;
