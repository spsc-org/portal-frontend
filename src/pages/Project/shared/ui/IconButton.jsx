
// Квадратна кнопка-іконка (Portal UI kit: radius-lg, border-default, ink-muted, primary на hover)
const IconButton = ({ icon, title, onClick, disabled = false, tone = "default", className = "" }) => {
    const tones = {
        default: "text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:text-blue-300",
        danger: "text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:border-red-400 dark:hover:text-red-400",
    };

    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 ${tones[tone]} ${className}`}
        >
            <i className={`${icon} pointer-events-none`} />
        </button>
    );
};

export default IconButton;
