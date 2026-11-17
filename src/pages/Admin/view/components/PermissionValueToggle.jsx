
// Семантична шкала доступу (зліва → направо):
// false (не можна) → individual (перехідний / обмежений) → true (можна).
const SEGMENT_META = {
    false: {
        label: "false",
        title: "Немає доступу",
        active: "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200/80 dark:bg-red-900/35 dark:text-red-300 dark:ring-red-800/60",
        idle: "text-slate-500 hover:bg-red-50/70 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-300",
    },
    individual: {
        label: "ind",
        title: "Обмежений доступ — між «немає» і «повний»",
        active: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200/80 dark:bg-amber-900/35 dark:text-amber-300 dark:ring-amber-800/60",
        idle: "text-slate-500 hover:bg-amber-50/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-300",
    },
    true: {
        label: "true",
        title: "Повний доступ",
        active: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200/80 dark:bg-emerald-900/35 dark:text-emerald-300 dark:ring-emerald-800/60",
        idle: "text-slate-500 hover:bg-emerald-50/70 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300",
    },
};

const normalizeValue = (value) => {
    if (value === true || value === "true") return "true";
    if (value === false || value === "false") return "false";
    if (value === "individual") return "individual";
    return String(value);
};

const toStoredValue = (key) => {
    if (key === "true") return true;
    if (key === "false") return false;
    return key;
};

// Порядок сегментів = шкала доступу: не можна → обмежено → можна.
const SEGMENT_ORDER = ["false", "individual", "true"];

const sortSegmentKeys = (keys) =>
    [...keys].sort((a, b) => SEGMENT_ORDER.indexOf(a) - SEGMENT_ORDER.indexOf(b));

/**
 * 2–3 позиційний тогл значення пермішена.
 * Ширина — 100% батьківської колонки (однакова для всіх рядків у картці),
 * сегменти ділять її порівну.
 */
const PermissionValueToggle = ({options = [], value, onChange, disabled = false}) => {
    const current = normalizeValue(value);
    const keys = sortSegmentKeys(options.map((option) => normalizeValue(option)));

    return (
        <div
            role="group"
            className={`flex w-full min-w-0 items-stretch gap-0.5 rounded-md border border-slate-200/90 bg-slate-50/70 p-0.5 dark:border-slate-600 dark:bg-slate-800/60 ${
                disabled ? "pointer-events-none opacity-50" : ""
            }`}
        >
            {keys.map((key) => {
                const meta = SEGMENT_META[key] ?? {
                    label: key,
                    title: key,
                    active: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
                    idle: "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                };
                const isActive = current === key;

                return (
                    <button
                        key={key}
                        type="button"
                        title={meta.title}
                        aria-pressed={isActive}
                        disabled={disabled}
                        onClick={() => onChange(toStoredValue(key))}
                        className={`min-w-0 flex-1 truncate rounded px-0.5 py-1 text-center text-[10px] font-semibold uppercase tracking-wide transition ${
                            isActive ? meta.active : meta.idle
                        }`}
                    >
                        {meta.label}
                    </button>
                );
            })}
        </div>
    );
};

export default PermissionValueToggle;
