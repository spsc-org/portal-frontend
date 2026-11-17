import { Typography } from "@material-tailwind/react";

// Кольори та іконки для типів рішень РНБО
const ACTION_TYPE_CONFIG = {
    'застосування санкцій': { color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: 'ti ti-shield-check' },
    'зміна санкцій':        { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',  icon: 'ti ti-edit' },
    'скасування санкцій':   { color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',    icon: 'ti ti-shield-x' },
    'зупинення санкцій':    { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', icon: 'ti ti-pause' },
};

const getActionTypeConfig = (actionType) => {
    if (!actionType) return { color: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300', icon: 'ti ti-file-text' };
    const key = actionType.toLowerCase();
    for (const [pattern, config] of Object.entries(ACTION_TYPE_CONFIG)) {
        if (key.includes(pattern)) return config;
    }
    return { color: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300', icon: 'ti ti-file-text' };
};

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
        // Handle YYYY-MM-DD format
        const [y, m, d] = dateStr.split('-');
        if (y && m && d) return `${d}.${m}.${y}`;
    } catch {
        // некоректна дата — показуємо як є
    }
    return dateStr;
};

const NsdcActionsTab = ({ actions }) => {
    if (!actions || actions.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-gray-400 dark:text-slate-500">
                <Typography className="text-sm">Рішення відсутні</Typography>
            </div>
        );
    }

    // Сортуємо: спочатку новіші (по decree_date або по decree номеру)
    const sorted = [...actions].sort((a, b) => {
        const dateA = a.original_data?.decree_date || '';
        const dateB = b.original_data?.decree_date || '';
        if (dateA && dateB) return dateB.localeCompare(dateA);
        return 0;
    });

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
                <i className="ti ti-history text-blue-500 dark:text-blue-400 text-lg"></i>
                <Typography variant="h6" className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                    Рішення РНБО ({actions.length})
                </Typography>
            </div>

            <div className="space-y-2">
                {sorted.map((action, idx) => {
                    const od = action.original_data || {};
                    const cfg = getActionTypeConfig(od.action_type);
                    const decreeDate = formatDate(od.decree_date);
                    const endDate = formatDate(od.sanctions_end_date);
                    const term = od.sanctions_term;

                    return (
                        <div
                            key={action.id || idx}
                            className="flex gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
                        >
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center gap-1 pt-0.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                                    <i className={`${cfg.icon} text-sm`}></i>
                                </div>
                                {idx < sorted.length - 1 && (
                                    <div className="w-px flex-1 min-h-2 bg-gray-200 dark:bg-slate-600"></div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Action type + decree */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                                        {od.action_type || 'Невідомо'}
                                    </span>
                                    {od.decree && (
                                        <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                                            <i className="ti ti-file-certificate text-xs"></i>
                                            {od.decree}
                                        </span>
                                    )}
                                    {od.decree_appendix && (
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                            дод. {od.decree_appendix}
                                            {od.position_in_appendix ? `, п. ${od.position_in_appendix}` : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Captions */}
                                {action.captions && (
                                    <div className="text-sm text-gray-800 dark:text-slate-200 font-medium mb-1">
                                        {action.captions}
                                    </div>
                                )}

                                {/* Identifiers */}
                                {action.identifiers && (
                                    <div className="text-xs text-gray-500 dark:text-slate-400 font-mono mb-2">
                                        <i className="ti ti-id-badge mr-1"></i>
                                        {action.identifiers}
                                    </div>
                                )}

                                {/* Dates row */}
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-slate-400">
                                    {decreeDate && (
                                        <span className="flex items-center gap-1">
                                            <i className="ti ti-calendar-event"></i>
                                            Дата рішення: <span className="font-medium text-gray-700 dark:text-slate-300">{decreeDate}</span>
                                        </span>
                                    )}
                                    {term && (
                                        <span className="flex items-center gap-1">
                                            <i className="ti ti-clock"></i>
                                            {term}
                                        </span>
                                    )}
                                    {endDate && (
                                        <span className="flex items-center gap-1">
                                            <i className="ti ti-calendar-x"></i>
                                            До: <span className="font-medium text-gray-700 dark:text-slate-300">{endDate}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Sanctions list */}
                                {od.sanctions && (
                                    <div className="mt-1.5 text-xs text-gray-600 dark:text-slate-400 line-clamp-2">
                                        {od.sanctions}
                                    </div>
                                )}

                                {/* Appendix link */}
                                {od.appendix_link && (
                                    <div className="mt-1">
                                        <a
                                            href={od.appendix_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            <i className="ti ti-external-link text-xs"></i>
                                            Посилання
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* AID badge */}
                            {od.aid && (
                                <div className="flex-shrink-0 text-right">
                                    <span className="text-xs font-mono text-gray-400 dark:text-slate-500">
                                        #{od.aid}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NsdcActionsTab;
