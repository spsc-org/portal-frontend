import {usePage} from "@inertiajs/react";
import {useQuery} from "@tanstack/react-query";
import StatCard from "./components/StatCard.jsx";
import BirthdaySection from "./components/BrithdaySection.jsx";
import StatCardSkeleton from "./components/StatCardSkeleton.jsx";
import SectionSkeleton from "./components/SectionSkeleton.jsx";
import {IconButton} from "@material-tailwind/react";
import {formatDate} from "date-fns";
import ActivityChart from "./components/ActivityChart.jsx";
import AnnouncementsSection from "./components/AnnouncementsSection.jsx";
import MyTasksSection from "./components/MyTasksSection.jsx";


const Index = () => {
    const isDebug = Boolean(import.meta.env.VITE_APP_DEBUG);
    const {auth} = usePage().props;
    const isShowKPI = Boolean(auth?.user?.showKPI);
    const userId = auth?.user?.id;

    const {data, isLoading, refetch, isRefetching} = useQuery({
        queryKey: ["welcome-dashboard", userId],
        queryFn: async () => {
            const response = await axios.get("/api/welcome/dashboard", {
                headers: {
                    "Content-Type": "application/json",
                    userId,
                },
            });
            return response?.data?.data;
        },
        enabled: Boolean(userId),
        staleTime: 60 * 1000,
    });

    return (
        <div data-i-doc="page:welcome" className=" px-3 pb-6 pt-3 sm:px-4">
            <div
                className="mb-5 rounded-2xl border border-slate-300 bg-gradient-to-r from-white to-blue-50 p-5 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 dark:shadow-black/20 dark:ring-0">
                <div className="space-x-3 items-center flex">
                    <h1 className="inline-block text-2xl font-bold text-slate-900 dark:text-white">
                        Вітаємо в системі, {auth?.user?.name || "користувачу"}
                    </h1>
                    <IconButton onClick={() => refetch()} color="blue" size="sm" variant="outlined" title="Оновити">
                        <i className="fa-solid fa-refresh"></i>
                    </IconButton>
                </div>

                {isDebug ? (
                    <span
                        className="mt-3 inline-flex rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white dark:bg-blue-700">
                        Режим розробки
                    </span>
                ) : null}
            </div>

            {/* Графік активності на всю ширину */}
            <ActivityChart />

            {
                isShowKPI  &&
                <div data-i-doc="widget:welcome-kpi-stats">
                    {
                        Boolean(data?.period) &&
                        <h5 className="mt-1  text-slate-900 dark:text-white">
                            Статистика за період: {data?.period?.label || "Останні 7 днів"} <span
                            className="text-xs ml-1"> з {formatDate(data?.period?.from, "dd.MM.yyyy HH:mm:ss")} по {formatDate(data?.period?.to, "dd.MM.yyyy HH:mm:ss")}</span>
                        </h5>
                    }
                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {(isLoading || isRefetching) ? (
                            <>
                                <StatCardSkeleton/>
                                <StatCardSkeleton/>
                                <StatCardSkeleton/>
                                <StatCardSkeleton/>
                                <StatCardSkeleton/>
                            </>
                        ) : (
                            <>

                                <StatCard icon="fa-solid fa-diagram-project" label="Проєкти "
                                          value={data?.summary?.projects ?? 0} href="/project"/>
                                <StatCard icon="fa-solid fa-folder-tree" label="Подання"
                                          value={data?.summary?.proposals ?? 0} href="/proposal"/>
                                <StatCard icon="fa-solid fa-file-lines" label="Документи"
                                          value={data?.summary?.documents ?? 0} href="/document"/>
                                <StatCard icon="fa-solid fa-gavel" label="Укази" value={data?.summary?.decrees ?? 0}
                                          href="/decree"/>
                                <StatCard icon="fa-solid fa-box-archive" label="Мій інвентар"
                                          value={data?.summary?.inventoryMine ?? 0} href="/inventory"/>
                            </>
                        )}
                    </div>
                </div>

            }


            <div className="grid grid-cols-1 gap-4">
                {(isLoading || isRefetching) ? (
                    <SectionSkeleton/>
                ) : (
                    <BirthdaySection birthdays={data?.birthdays || {}}/>
                )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <MyTasksSection/>
                <AnnouncementsSection/>
            </div>
        </div>
    );
};

export default Index;
