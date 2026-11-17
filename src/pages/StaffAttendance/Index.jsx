import { observer } from 'mobx-react-lite';

import AttendanceFilters from "./components/AttendanceFilters.jsx";
import AttendanceHeader from "./components/AttendanceHeader.jsx";
import AttendanceLegend from "./components/AttendanceLegend.jsx";
import AddEditAbsenceModal from "./components/modals/AddEditAbsenceModal.jsx";
import DocumentsModal from "./components/modals/DocumentsModal.jsx";
import StatisticsModal from "./components/modals/StatisticsModal.jsx";
import SummaryModal from "./components/modals/SummaryModal.jsx";
import CalendarView from "./components/views/CalendarView.jsx";
import TableView from "./components/views/TableView.jsx";
import Page from "../../components/Page.jsx";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { AttendanceViewModel } from "./viewmodel/AttendanceViewModel.js";

const Index = () => {
    const vm = useViewModel((deps) => new AttendanceViewModel(deps));
    const { options } = vm;

    return (
        <Page>
            <div data-i-doc="page:staff-attendance">
                <AttendanceHeader
                    onOpenCreate={vm.openCreate}
                    onOpenStatistics={vm.openStatistics}
                    onOpenSummary={vm.openSummary}
                    onOpenVacationSchedule={vm.openVacationSchedule}
                    viewMode={vm.viewMode}
                    onViewModeChange={vm.setViewMode}
                />
                <AttendanceFilters
                    dateInterval={vm.dateInterval}
                    rangeType={vm.rangeType}
                    setRangeType={vm.setRangeType}
                    filters={vm.filters}
                    setFilters={vm.setFilters}
                    currentDate={vm.currentDate}
                    setCurrentDate={vm.setCurrentDate}
                    options={options}
                />
                {vm.viewMode === 'calendar' ? (
                    <>
                        <CalendarView
                            days={vm.days}
                            dateInterval={vm.dateInterval}
                            calendarData={vm.calendarData}
                            isLoading={vm.isCalendarLoading}
                            holidays={vm.holidays}
                            getTypeColor={vm.getTypeColor}
                            absenceTypes={options.absence_types}
                            onCellClick={vm.cellClick}
                            onEdit={vm.edit}
                            onDelete={vm.requestDelete}
                            onManageDocuments={vm.manageDocuments}
                            workingDays={options.working_days}
                            zpValue={vm.zpValue}
                            onToggleZp={vm.toggleZp}
                        />
                        <AttendanceLegend absenceTypes={options.absence_types} />
                    </>
                ) : (
                    <TableView
                        calendarData={vm.calendarData}
                        isLoading={vm.isCalendarLoading}
                        onEdit={vm.edit}
                        onDelete={vm.requestDelete}
                        onManageDocuments={vm.manageDocuments}
                        absenceTypes={options.absence_types}
                    />
                )}

                <AddEditAbsenceModal vm={vm} />

                <ConfirmModal
                    open={vm.isDeleteConfirmOpen}
                    onClose={vm.closeDeleteConfirm}
                    onConfirm={vm.confirmDelete}
                    title="Видалення запису"
                    message="Ви впевнені, що хочете видалити цей запис?"
                    isLoading={vm.cmd.deleteAbsence.isPending}
                />

                <DocumentsModal
                    isOpen={vm.isDocumentsDialogOpen}
                    onClose={vm.closeDocuments}
                    absence={vm.absenceForDocuments}
                />

                <StatisticsModal
                    isOpen={vm.isStatisticsDialogOpen}
                    onClose={vm.closeStatistics}
                />

                <SummaryModal
                    isOpen={vm.isSummaryModalOpen}
                    onClose={vm.closeSummary}
                    initialFilters={vm.summaryInitialFilters}
                    absenceTypes={options.absence_types}
                />
            </div>
        </Page>
    );
};

export default observer(Index);
