import Button from "../Buttons/Button.jsx";

/** Пагінація історії аудиту (Portal UI kit: кнопки secondary xs, лічильник ink-muted). */
const AuditPager = ({ page, pages, onChange, disabled = false, prevLabel = "‹ Новіші", nextLabel = "Старіші ›" }) => {
    if (!pages || pages <= 1) return null;
    return (
        <div className="mt-3 flex items-center justify-center gap-2">
            <Button size="xs" color="secondary" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
                {prevLabel}
            </Button>
            <span className="text-xs text-gray-600 dark:text-gray-400">
                {page} / {pages}
            </span>
            <Button size="xs" color="secondary" disabled={disabled || page >= pages} onClick={() => onChange(page + 1)}>
                {nextLabel}
            </Button>
        </div>
    );
};

export default AuditPager;
