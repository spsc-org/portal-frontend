import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const activeEntries = payload
            .map(p => ({
                name: p.payload[`stack_${p.dataKey.split('_')[1]}_name`],
                value: p.value,
                color: p.payload[`stack_${p.dataKey.split('_')[1]}_color`]
            }))
            .filter(entry => entry.value > 0);

        if (activeEntries.length === 0) return null;

        return (
            <div className="rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95 min-w-[220px] transition-opacity duration-200">
                <p className="mb-1 border-b border-slate-100 pb-1 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {label}
                </p>
                <div className="grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2">
                    {[...activeEntries].sort((a, b) => b.value - a.value).map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="truncate text-[9px] text-slate-700 dark:text-slate-300">{entry.name}:</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-900 dark:text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const ActivityChart = () => {
    const [days, setDays] = useState(() => {
        const saved = localStorage.getItem('welcome_chart_days');
        return saved ? parseInt(saved) : 30;
    });

    useEffect(() => {
        localStorage.setItem('welcome_chart_days', days.toString());
    }, [days]);

    const { data: result, isLoading } = useQuery({
        queryKey: ["project-activity", days],
        queryFn: async () => {
            const response = await axios.get(`/api/activity/projects?days=${days}`);
            return response?.data?.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const rawData = result?.chartData || [];
    const actionsInfo = result?.actions || [];

    const { transformedData, maxSegments } = useMemo(() => {
        if (!rawData.length) return { transformedData: [], maxSegments: 0 };

        let maxCount = 0;
        const transformed = rawData.map(day => {
            const newDay = { ...day };

            const dayActions = actionsInfo
                .map(a => ({
                    key: a.dataKey,
                    name: a.name,
                    color: a.color,
                    value: day[a.dataKey] || 0
                }))
                .filter(a => a.value > 0)
                .sort((a, b) => b.value - a.value);

            maxCount = Math.max(maxCount, dayActions.length);

            dayActions.forEach((action, index) => {
                newDay[`stack_${index}_val`] = action.value;
                newDay[`stack_${index}_name`] = action.name;
                newDay[`stack_${index}_color`] = action.color;
            });

            return newDay;
        });

        return { transformedData: transformed, maxSegments: maxCount };
    }, [rawData, actionsInfo]);

    return (
        <div data-i-doc="widget:welcome-activity-chart" className="mb-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20 dark:ring-0">
            <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Активність по проєктах</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Дії, відсортовані за кількістю</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                        {[30, 60, 90].map((v) => (
                            <button
                                key={v}
                                onClick={() => setDays(v)}
                                className={`px-3 py-1 text-[10px] font-semibold transition-colors ${
                                    days === v
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                            >
                                {v} дн.
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[390px] w-full">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={transformedData}
                            margin={{ top: 10, right: 10, left: -25, bottom: 90 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 9 }}
                                dy={5}
                                interval={days > 30 ? (days > 60 ? 4 : 2) : 0}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 9 }}
                            />

                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                                position={{ y: 280 }}
                                isAnimationActive={false} // ВИМКНУТО ПОВНІСТЮ політ з кута
                                offset={0}
                            />

                            {Array.from({ length: maxSegments }).map((_, index) => (
                                <Bar
                                    key={index}
                                    dataKey={`stack_${index}_val`}
                                    stackId="a"
                                    barSize={days > 60 ? 12 : 20}
                                    isAnimationActive={true}
                                    animationDuration={1200}
                                    animationBegin={index * 100}
                                    animationEasing="ease-out"
                                >
                                    {transformedData.map((entry, entryIdx) => (
                                        <Cell
                                            key={`cell-${entryIdx}`}
                                            fill={entry[`stack_${index}_color`] || 'transparent'}
                                        />
                                    ))}
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ActivityChart;
