
// Візуально впізнаваний контейнер для тікетів — той самий принцип "одразу видно, де що",
// що й ModeratorBlock, але для геть іншої аудиторії: тікети мають низький бар'єр доступу
// (dossier.profileView — створення бачить і звичайний користувач, не лише модератор),
// тому це НЕ canManage-гейтований блок, а завжди видимий, просто впізнаваний контейнер.
const TicketsBlock = ({label = "Тікети", children, className = ""}) => (
    <div data-i-doc="component:dossier-tickets-block" className={`border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10 rounded-[10px] px-3 py-2.5 ${className}`}>
        <div className="text-[9.5px] font-bold uppercase tracking-wide text-amber-500 dark:text-amber-400 mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-ticket text-[9px]"></i>{label}
        </div>
        <div className="flex items-center flex-wrap gap-2">
            {children}
        </div>
    </div>
);

export default TicketsBlock;
