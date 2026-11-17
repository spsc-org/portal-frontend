import { observer } from "mobx-react-lite";
import { formatDate } from "date-fns";
import { useVM } from "../../../shared/mvvm/viewModelHooks.js";
import StatCard from "./components/StatCard.jsx";
import BirthdaySection from "./components/BrithdaySection.jsx";
import StatCardSkeleton from "./components/StatCardSkeleton.jsx";
import SectionSkeleton from "./components/SectionSkeleton.jsx";
import ActivityChart from "./components/ActivityChart.jsx";
import AnnouncementsSection from "./components/AnnouncementsSection.jsx";
import MyTasksSection from "./components/MyTasksSection.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderIconButton } from "../../../layouts/app/HeaderButtons.jsx";

const KPI_CARDS = [
    { key: "projects", icon: "fa-solid fa-diagram-project", label: "Проєкти ", href: "/project" },
    { key: "proposals", icon: "fa-solid fa-folder-tree", label: "Подання", href: "/proposal" },
    { key: "documents", icon: "fa-solid fa-file-lines", label: "Документи", href: "/document" },
    { key: "decrees", icon: "fa-solid fa-gavel", label: "Укази", href: "/decree" },
    { key: "inventoryMine", icon: "fa-solid fa-box-archive", label: "Мій інвентар", href: "/inventory" },
];

const WelcomeView = () => {
    const vm = useVM();
    const { period } = vm;

    return (
        <div data-i-doc="page:welcome" className=" px-3 pb-6 pt-3 sm:px-4">
            <PageHeader title="Головна" actions={<HeaderIconButton icon="fa-solid fa-refresh" title="Оновити" onClick={vm.refresh} />} />
            <div className="mb-5 rounded-2xl border border-slate-300 bg-gradient-to-r from-white to-blue-50 p-5 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 dark:shadow-black/20 dark:ring-0">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Вітаємо в системі, {vm.userName}</p>

                {vm.isDebug && (
                    <span className="mt-3 inline-flex rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white dark:bg-blue-700">
                        Режим розробки
                    </span>
                )}
            </div>

            <ActivityChart />

            {vm.showKPI && (
                <div data-i-doc="widget:welcome-kpi-stats">
                    {period && (
                        <h5 className="mt-1  text-slate-900 dark:text-white">
                            Статистика за період: {period.label || "Останні 7 днів"}{" "}
                            <span className="text-xs ml-1">
                                з {formatDate(period.from, "dd.MM.yyyy HH:mm:ss")} по {formatDate(period.to, "dd.MM.yyyy HH:mm:ss")}
                            </span>
                        </h5>
                    )}
                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {KPI_CARDS.map((card) =>
                            vm.isDashboardLoading
                                ? <StatCardSkeleton key={card.key}/>
                                : <StatCard key={card.key} icon={card.icon} label={card.label}
                                            value={vm.summary[card.key] ?? 0} href={card.href}/>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {vm.isDashboardLoading ? <SectionSkeleton/> : <BirthdaySection birthdays={vm.birthdays}/>}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <MyTasksSection/>
                <AnnouncementsSection/>
            </div>
        </div>
    );
};

export default observer(WelcomeView);
