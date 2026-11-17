
// Візуально впізнаваний блок дій модератора — ОДНАКОВИЙ вигляд у всіх місцях модуля Досьє
// (Картка досьє, Картка звʼязку, панель фільтрів реєстру тощо), щоб одразу було видно, де
// саме зосереджені дії над конкретним обʼєктом (профіль/звʼязок/фільтри) — не розкидані
// по сторінці. canManage-гейт централізовано тут: прибрати для звичайних користувачів =
// один компонент, а не розкидані перевірки в кожному місці виклику.
const ModeratorBlock = ({canManage, label = "Дії модератора", children, className = ""}) => {
    if (!canManage) return null;

    return (
        <div data-i-doc="component:dossier-moderator-block" className={`border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/10 rounded-[10px] px-3 py-2.5 ${className}`}>
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-blue-500 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                <i className="fa-solid fa-user-shield text-[9px]"></i>{label}
            </div>
            <div className="flex items-center flex-wrap gap-2">
                {children}
            </div>
        </div>
    );
};

export default ModeratorBlock;
