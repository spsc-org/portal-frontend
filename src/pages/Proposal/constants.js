export const PROPOSAL_STATE_COLORS = {
    "Проєкт": { bg: "rgba(79,142,247,0.12)", color: "#4f8ef7", dot: "#4f8ef7" },
    "Готово": { bg: "rgba(79,142,247,0.12)", color: "#4f8ef7", dot: "#4f8ef7" },
    "Проголосовано": { bg: "rgba(52,211,153,0.12)", color: "#34d399", dot: "#34d399" },
    "Направлено": { bg: "rgba(52,211,153,0.12)", color: "#34d399", dot: "#34d399" },
    "Реалізовано": { bg: "rgba(52,211,153,0.12)", color: "#34d399", dot: "#34d399" },
    "Не актуально": { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", dot: "#fbbf24" },
    "Повернуто": { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", dot: "#fbbf24" },
};

export const PROJECT_STATE_COLORS = {
    "Готово": { bg: "rgba(52,211,153,0.12)", color: "#34d399", dot: "#34d399" },
    "Новий пакет": { bg: "rgba(25,83,200,0.12)", color: "#214fba", dot: "#214fba" },
    "Є питання": { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", dot: "#fbbf24" },
    "на опрацюванні": { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", dot: "#3b82f6" },
    "направлено до РНБО": { bg: "rgba(249,115,22,0.12)", color: "#f97316", dot: "#f97316" },
    "Недоцільно": { bg: "rgba(239,68,68,0.12)", color: "#ef4444", dot: "#ef4444" },
    "Ні": { bg: "rgba(185,28,28,0.12)", color: "#b91c1c", dot: "#b91c1c" },
    "Повернуто без врахування": { bg: "rgba(236,72,153,0.12)", color: "#ec4899", dot: "#ec4899" },
    "Додано": { bg: "rgba(139,145,163,0.12)", color: "#8b91a3", dot: "#8b91a3" },
};


export const getStateStyle = (caption, map) => {
    return (
        map[caption] || {
            bg: "rgba(139,145,163,0.12)",
            color: "#8b91a3",
            dot: "#8b91a3",
        }
    );
};
