
import BirthdayList from "./BirthdayList.jsx";

const BirthdaySection = ({birthdays = {}}) => (
    <section data-i-doc="widget:welcome-birthday-section" className="rounded-2xl border border-gray-300 bg-white p-4 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/60 dark:border-neutral-700 dark:bg-neutral-800/70 dark:shadow-black/20 dark:ring-0">
        <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100">Дні народження</h3>
        <div className="space-y-3">
            <div className="rounded-lg border border-gray-300 bg-white p-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-700/40">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Сьогодні</p>
                <BirthdayList users={birthdays.today || []} emptyText="Немає" />
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-700/40">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Цей місяць</p>
                <BirthdayList users={birthdays.currentMonth || []} emptyText="Немає" />
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-700/40">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Наступний місяць</p>
                <BirthdayList users={birthdays.nextMonth || []} emptyText="Немає" />
            </div>
        </div>
    </section>
);

export default BirthdaySection;
