import { observer } from "mobx-react-lite";
import { formatDate } from "date-fns";
import { useVM } from "../../../shared/mvvm/viewModelHooks.js";
import StatCard from "./components/StatCard.jsx";
import StatCardSkeleton from "./components/StatCardSkeleton.jsx";
import BirthdaySection from "./components/BrithdaySection.jsx";
import ActivityChart from "./components/ActivityChart.jsx";
import AnnouncementsSection from "./components/AnnouncementsSection.jsx";
import MyTasksSection from "./components/MyTasksSection.jsx";
import RecentProjectsSection from "./components/RecentProjectsSection.jsx";
import WelcomeHero from "./components/WelcomeHero.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton, HeaderIconButton } from "../../../layouts/app/HeaderButtons.jsx";

const KPI_CARDS = [
    { key: "projects", icon: "fa-solid fa-diagram-project", label: "Проєкти", href: "/project" },
    { key: "proposals", icon: "fa-solid fa-folder-tree", label: "Подання", href: "/proposal" },
    { key: "documents", icon: "fa-solid fa-file-lines", label: "Документи", href: "/document" },
    { key: "decrees", icon: "fa-solid fa-gavel", label: "Укази", href: "/decree" },
    { key: "inventoryMine", icon: "fa-solid fa-box-archive", label: "Мій інвентар", href: "/inventory" },
];

const KpiStats = observer(({ vm }) => {
    const { period } = vm;
    return (
        <section data-i-doc="widget:welcome-kpi-stats" aria-label="Статистика" className="flex flex-col gap-2">
            {period && (
                <p className="m-0 text-sm text-gray-800 dark:text-gray-100">
                    Статистика за період: {period.label || "Останні 7 днів"}{" "}
                    <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                        з {formatDate(period.from, "dd.MM.yyyy HH:mm:ss")} по {formatDate(period.to, "dd.MM.yyyy HH:mm:ss")}
                    </span>
                </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {KPI_CARDS.map((card) =>
                    vm.isDashboardLoading ? (
                        <StatCardSkeleton key={card.key} />
                    ) : (
                        <StatCard key={card.key} icon={card.icon} label={card.label} value={vm.summary[card.key] ?? 0} href={card.href} />
                    ),
                )}
            </div>
        </section>
    );
});

const WelcomeView = () => {
    const vm = useVM();

    return (
        <div data-i-doc="page:welcome" className="px-3 pb-6 pt-4 sm:px-6 sm:pt-6">
            <PageHeader
                title="Головна"
                actions={
                    <>
                        {vm.canCreateProject && (
                            <HeaderButton to="/project?create=1" icon="fa-solid fa-plus">Створити проєкт</HeaderButton>
                        )}
                        <HeaderIconButton icon="fa-solid fa-refresh" title="Оновити" onClick={vm.refresh} />
                    </>
                }
            />

            <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
                <WelcomeHero />

                {vm.showKPI && <KpiStats vm={vm} />}

                <ActivityChart />

                <div className="flex flex-wrap items-start gap-4">
                    {vm.canSeeProjects && <RecentProjectsSection />}
                    <AnnouncementsSection />
                </div>

                <div className="flex flex-wrap items-start gap-4">
                    <MyTasksSection />
                    <BirthdaySection />
                </div>
            </div>
        </div>
    );
};

export default observer(WelcomeView);
