import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";

const VIEW_MODES = [
    { id: "calendar", icon: "fa-solid fa-calendar", label: "Сітка" },
    { id: "table", icon: "fa-solid fa-list", label: "Таблиця" },
];

/** Назва й дії обліку персоналу — у глобальному Header (PageHeader). */
const AttendanceHeader = ({
    onOpenCreate,
    onOpenStatistics,
    onOpenSummary,
    onOpenVacationSchedule,
    viewMode,
    onViewModeChange
}) => (
    <PageHeader
        title="Облік перебування персоналу"
        documentTitle="Облік персоналу"
        actions={
            <>
                <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700" role="group" aria-label="Вигляд">
                    {VIEW_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => onViewModeChange(mode.id)}
                            aria-pressed={viewMode === mode.id}
                            className={`flex h-8 items-center gap-1.5 px-3 text-xs transition-colors ${
                                viewMode === mode.id
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
                            }`}
                        >
                            <i className={`${mode.icon} text-xs`} />
                            {mode.label}
                        </button>
                    ))}
                </div>
                <HeaderButton tone="default" icon="fa-solid fa-calendar-days" onClick={onOpenVacationSchedule}>Графік відпусток</HeaderButton>
                <HeaderButton tone="default" icon="fa-solid fa-table-list" onClick={onOpenSummary}>Зведена таблиця</HeaderButton>
                <HeaderButton tone="default" icon="fa-solid fa-chart-bar" onClick={onOpenStatistics}>Стройовка</HeaderButton>
                <HeaderButton icon="fa-solid fa-plus" onClick={onOpenCreate}>Створити заявку</HeaderButton>
            </>
        }
    />
);

export default AttendanceHeader;
