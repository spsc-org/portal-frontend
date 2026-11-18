
const ExpiryDateBadge = ({ date, highlightText, filters, label = "До:" }) => {
    if (!date) return null;

    // Спробуємо розпарсити дату
    const targetDate = new Date(date);

    // Перевірка на валідність дати
    if (isNaN(targetDate.getTime())) {
        // Якщо дата невалідна, просто виводимо як текст без логіки кольорів
        return (
            <div className="flex items-center gap-1.5 mt-0.5 text-gray-600 dark:text-gray-400 text-[11px]">
                <i className="fa-regular fa-calendar text-[10px]"></i>
                <span>
                    {label} <span className="font-medium">{highlightText ? highlightText(date, filters?.search) : date}</span>
                </span>
            </div>
        );
    }

    const today = new Date();
    // Скидаємо час, щоб порівнювати тільки дні
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    // Різниця в мілісекундах
    const diffTime = targetDate - today;
    // Різниця в днях
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let containerClass = "text-gray-600 dark:text-gray-400";
    let iconClass = "fa-regular fa-calendar-check";
    let statusLabel = label;

    // Логіка кольорів
    if (diffDays < 0) {
        // Вже закінчився
        containerClass = "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30";
        iconClass = "fa-solid fa-calendar-xmark";
        statusLabel = "Закінчився:";
    } else if (diffDays <= 30) {
        // Закінчується скоро (менше 30 днів)
        containerClass = "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30";
        iconClass = "fa-solid fa-hourglass-half";
        statusLabel = "Спливає:";
    }

    return (
        <div className={`flex items-center gap-1.5 mt-0.5 text-[11px] w-fit ${containerClass}`}>
            <i className={`${iconClass} text-[10px]`}></i>
            <span>
                {statusLabel} <span className="font-bold">{highlightText ? highlightText(date, filters?.search) : date}</span>
            </span>
        </div>
    );
};

export default ExpiryDateBadge;
