import React from "react";
import {Tooltip} from "@material-tailwind/react";

// Іконка + м’який колір для кожного модуля (ключ = permissions.pages.*).
// Лише наявність ключа в pages означає «доступ підключений»; глибина — в картці.
const MODULE_META = {
    "admin-users": {icon: "fa-solid fa-user-shield", label: "admin-users", tone: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300"},
    task: {icon: "fa-solid fa-list-check", label: "task", tone: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300"},
    announcement: {icon: "fa-solid fa-bullhorn", label: "announcement", tone: "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300"},
    "developer-posts": {icon: "fa-solid fa-code-branch", label: "developer-posts", tone: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"},
    "developer-debug": {icon: "fa-solid fa-bug", label: "developer-debug", tone: "bg-purple-100 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400"},
    project: {icon: "fa-solid fa-folder", label: "project", tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"},
    proposal: {icon: "fa-solid fa-file-signature", label: "proposal", tone: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300"},
    dossier: {icon: "fa-solid fa-id-card", label: "dossier", tone: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"},
    sanctions: {icon: "fa-solid fa-shield-halved", label: "sanctions", tone: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"},
    inventory: {icon: "fa-solid fa-boxes-stacked", label: "inventory", tone: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300"},
    dictionary: {icon: "fa-solid fa-book", label: "dictionary", tone: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"},
    handbook: {icon: "fa-solid fa-address-book", label: "handbook", tone: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"},
    "admin-groups": {icon: "fa-solid fa-people-group", label: "admin-groups", tone: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"},
    document: {icon: "fa-solid fa-file-lines", label: "document", tone: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"},
    decree: {icon: "fa-solid fa-gavel", label: "decree", tone: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"},
    staff: {icon: "fa-solid fa-users", label: "staff", tone: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-300"},
    integrations: {icon: "fa-solid fa-plug", label: "integrations", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"},
    audit: {icon: "fa-solid fa-clipboard-list", label: "audit", tone: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"},
    report: {icon: "fa-solid fa-chart-column", label: "report", tone: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"},
    statistic: {icon: "fa-solid fa-chart-pie", label: "statistic", tone: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"},
    search: {icon: "fa-solid fa-magnifying-glass", label: "search", tone: "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"},
};

const FALLBACK = {
    icon: "fa-solid fa-cube",
    tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const OFF_TONE = "bg-transparent text-slate-300 dark:text-slate-600";

/**
 * Графічний індикатор модулів: фіксована смуга іконок у стабільному порядку схеми.
 * Увімкнений модуль — кольорова іконка; вимкнений — приглушена (для порівняння рядків).
 */
const AccessModulesIcons = ({pages = {}, schemaKeys = []}) => {
    const enabled = pages && typeof pages === "object" ? pages : {};
    const enabledSet = new Set(Object.keys(enabled));

    const orderedKeys = schemaKeys.length
        ? schemaKeys
        : Object.keys(MODULE_META);

    // Модулі юзера, яких немає у схемі (легасі) — в кінець, лише якщо увімкнені.
    const extraEnabled = Object.keys(enabled).filter((key) => !orderedKeys.includes(key));
    const keys = [...orderedKeys, ...extraEnabled];

    if (!keys.length) {
        return <span className="text-[11px] text-slate-400">—</span>;
    }

    return (
        <div className="flex flex-wrap items-center gap-1 py-0.5">
            {keys.map((key) => {
                const meta = MODULE_META[key] ?? {...FALLBACK, label: key};
                const isOn = enabledSet.has(key);

                return (
                    <Tooltip key={key} content={isOn ? meta.label : `${meta.label} (вимкнено)`}>
                        <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] transition ${
                                isOn ? meta.tone : OFF_TONE
                            }`}
                        >
                            <i className={meta.icon}></i>
                        </span>
                    </Tooltip>
                );
            })}
        </div>
    );
};

export default AccessModulesIcons;
