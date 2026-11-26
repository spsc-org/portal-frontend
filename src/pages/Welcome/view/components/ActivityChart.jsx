import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";
import { CHART_DAY_OPTIONS } from "../../viewmodel/WelcomeViewModel.js";
import { CARD, MUTED, SECTION_TITLE, SEGMENTS, segment } from "../styles.js";

const GAP = { 30: "gap-1.5", 60: "gap-[3px]", 90: "gap-0.5" };

/** Підказка стовпчика: дата, сума й розбивка за типами дій. */
const BarTooltip = ({ bar, alignRight }) => (
    <div
        className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden min-w-[200px] rounded-lg border border-gray-200 bg-white p-2 text-left shadow-lg group-hover:block dark:border-neutral-700 dark:bg-neutral-800 ${
            alignRight ? "right-0" : "left-0"
        }`}
    >
        <p className="m-0 mb-1 border-b border-gray-200 pb-1 text-xs font-bold text-gray-800 dark:border-neutral-700 dark:text-gray-100">
            {bar.label}: {bar.total} дій
        </p>
        {bar.breakdown.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-[11px] leading-4">
                <span className="flex min-w-0 items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
            </div>
        ))}
    </div>
);

/** "Активність по проєктах": кількість дій за день у всіх проєктах (30/60/90 днів). */
const ActivityChart = () => {
    const vm = useVM();
    const days = vm.chartDays;
    const { bars, ticks, total, peak } = vm.chart;
    const gap = GAP[days] ?? "gap-0.5";

    return (
        <section data-i-doc="widget:welcome-activity-chart" aria-labelledby="w-activity" className={`${CARD} flex flex-col gap-4 p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <h2 id="w-activity" className={SECTION_TITLE}>Активність по проєктах</h2>
                    <p className={`m-0 text-[13px] ${MUTED}`}>Кількість дій за день у всіх проєктах</p>
                </div>
                <div role="group" aria-label="Період" className={SEGMENTS}>
                    {CHART_DAY_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={days === option}
                            onClick={() => vm.setChartDays(option)}
                            className={segment(days === option)}
                        >
                            {option} дн.
                        </button>
                    ))}
                </div>
            </div>

            {vm.isChartLoading ? (
                <div className="flex h-[244px] items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            ) : (
                <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-2">
                    <div className="relative h-[220px]" aria-hidden="true">
                        {ticks.map((tick) => (
                            <span
                                key={tick.topPct}
                                className="absolute right-0 -translate-y-1/2 text-xs text-gray-600 dark:text-gray-400"
                                style={{ top: `${tick.topPct}%` }}
                            >
                                {tick.value}
                            </span>
                        ))}
                    </div>
                    <div className="relative h-[220px]">
                        {ticks.map((tick) => (
                            <div
                                key={tick.topPct}
                                className={`absolute inset-x-0 border-t ${
                                    tick.value === 0
                                        ? "border-solid border-gray-300 dark:border-neutral-600"
                                        : "border-dashed border-gray-200 dark:border-neutral-700"
                                }`}
                                style={{ top: `${tick.topPct}%` }}
                            />
                        ))}
                        <div className={`absolute inset-0 flex items-end ${gap}`}>
                            {bars.map((bar, index) => (
                                <div key={bar.key} className="group relative flex h-full min-w-0 flex-1 items-end">
                                    <div
                                        className={`w-full rounded-t-[3px] ${
                                            bar.total === 0
                                                ? "h-0.5 bg-gray-200 dark:bg-neutral-700"
                                                : "bg-blue-600 group-hover:bg-blue-700 dark:bg-blue-500 dark:group-hover:bg-blue-400"
                                        }`}
                                        style={bar.total === 0 ? undefined : { height: `${bar.heightPct}%` }}
                                    />
                                    {bar.total > 0 && <BarTooltip bar={bar} alignRight={index > bars.length / 2} />}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div />
                    <div className={`flex ${gap}`} aria-hidden="true">
                        {bars.map((bar) => (
                            <span key={bar.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[11px] leading-4 text-gray-600 dark:text-gray-400">
                                {bar.showLabel ? bar.label : ""}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className={`flex flex-wrap gap-6 border-t border-gray-200 pt-3 text-[13px] dark:border-neutral-700 ${MUTED}`}>
                <span>
                    Усього дій за період: <strong className="text-gray-800 dark:text-gray-100">{total}</strong>
                </span>
                <span>
                    Найактивніший день: <strong className="text-gray-800 dark:text-gray-100">{peak}</strong>
                </span>
            </div>
        </section>
    );
};

export default observer(ActivityChart);
