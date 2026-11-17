import {Tooltip} from "@material-tailwind/react";

// Іконка модуля — лаконічний маркер у квадратику; fallback для невідомих сторінок.
const MODULE_ICONS = {
    "admin-users": "fa-solid fa-user-shield",
    task: "fa-solid fa-list-check",
    announcement: "fa-solid fa-bullhorn",
    "developer-posts": "fa-solid fa-code-branch",
    "developer-debug": "fa-solid fa-bug",
    project: "fa-solid fa-folder",
    dossier: "fa-solid fa-id-card",
    sanctions: "fa-solid fa-id-card",
    inventory: "fa-solid fa-boxes-stacked",
    dictionary: "fa-solid fa-book",
    handbook: "fa-solid fa-address-book",
    "admin-groups": "fa-solid fa-people-group",
    proposal: "fa-solid fa-file-signature",
    document: "fa-solid fa-file-lines",
    staff: "fa-solid fa-users",
    integrations: "fa-solid fa-plug",
    audit: "fa-solid fa-clipboard-list",
    search: "fa-solid fa-magnifying-glass",
    decree: "fa-solid fa-gavel",
    report: "fa-solid fa-chart-column",
    statistic: "fa-solid fa-chart-pie",
    documentation: "fa-solid fa-book-open",
    welcome: "fa-solid fa-house",
    settings: "fa-solid fa-gear",
    notifications: "fa-solid fa-bell",
};

const moduleIcon = (page) => MODULE_ICONS[page] ?? "fa-solid fa-cube";

/**
 * Графічний індикатор доступів: квадратик на кожен модуль зі схеми.
 * Зафарбований = сторінка є в user.permissions.pages (доступ підключений).
 * Порожній/сірий = модуля немає. Деталі прав — лише в картці редагування.
 */
const AccessModulesCell = ({schemaPages = [], userPages = {}}) => {
    const enabled = new Set(Object.keys(userPages ?? {}));
    const pages = schemaPages.length
        ? schemaPages
        : Object.keys(userPages ?? {});

    if (!pages.length) {
        return <span className="text-[10px] text-slate-400">—</span>;
    }

    return (
        <div className="flex flex-wrap items-center gap-px py-0.5">
            {pages.map((page) => {
                const on = enabled.has(page);
                return (
                    <Tooltip key={page} content={page} placement="top">
                        <span
                            aria-label={`${page}: ${on ? "доступ є" : "немає доступу"}`}
                            className={`inline-flex h-4 w-4 items-center justify-center rounded-[3px] border text-[8px] leading-none transition ${
                                on
                                    ? "border-emerald-400/70 bg-emerald-100 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
                                    : "border-slate-200 bg-transparent text-slate-300 dark:border-slate-700 dark:text-slate-600"
                            }`}
                        >
                            <i className={moduleIcon(page)}></i>
                        </span>
                    </Tooltip>
                );
            })}
        </div>
    );
};

export default AccessModulesCell;
