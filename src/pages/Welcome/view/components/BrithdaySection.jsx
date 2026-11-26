import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";
import { initials } from "../../model/welcomeModel.js";
import { CARD, MUTED, SECTION_TITLE } from "../styles.js";
import SectionSkeleton from "./SectionSkeleton.jsx";

const UPCOMING_LIMIT = 6;

/** Дні народження: сьогоднішні — виділені, далі найближчі (поточний і наступний місяць). */
const BirthdaySection = () => {
    const vm = useVM();
    if (vm.isDashboardLoading) return <SectionSkeleton />;

    const today = vm.birthdaysToday;
    const upcoming = vm.upcomingBirthdays.slice(0, UPCOMING_LIMIT);

    return (
        <section data-i-doc="widget:welcome-birthday-section" aria-labelledby="w-bdays" className={`${CARD} min-w-0 flex-[1_1_280px] overflow-hidden`}>
            <div className="flex min-h-10 items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
                <i className="fa-solid fa-cake-candles text-gray-600 dark:text-gray-400" aria-hidden="true" />
                <h2 id="w-bdays" className={SECTION_TITLE}>Дні народження</h2>
            </div>
            <div className="flex flex-col gap-3 px-4 py-3">
                {today.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/30">
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-blue-600 text-[13px] font-bold text-white">
                            {initials(user.name)}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-bold text-blue-800 dark:text-blue-200">{user.name}</span>
                            <span className="text-xs text-blue-800 dark:text-blue-200">Сьогодні</span>
                        </div>
                    </div>
                ))}
                {upcoming.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 px-1">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700 dark:bg-neutral-700 dark:text-gray-200">
                            {user.initials}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm text-gray-800 dark:text-gray-100">{user.name}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{user.label}</span>
                        </div>
                    </div>
                ))}
                {today.length === 0 && upcoming.length === 0 && <p className={`m-0 ${MUTED}`}>Найближчим часом немає</p>}
            </div>
        </section>
    );
};

export default observer(BirthdaySection);
