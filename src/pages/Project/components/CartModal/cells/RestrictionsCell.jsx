
// Порт TableManager.js:#renderCellRestrictions() — та сама логіка
// (лічильник, кольори по code, санкція 6 з r6Text-прев'ю), але як JSX:
// текст іде через звичайні children, не innerHTML, тож екранування XSS
// не потрібне (React сам екранує текстові вузли).
const RESTRICT_CLASS = {
    g: "text-black-700 dark:text-gray-400",
    o: "bg-orange-200 dark:bg-orange-900 rounded pl-1 pr-1",
    r: "bg-red-300 dark:bg-red-900 rounded pl-1 pr-1",
};

const RestrictionsCell = ({ precomputedData }) => {
    const restrictions = precomputedData?.restrictions;
    if (!Array.isArray(restrictions) || restrictions.length === 0) {
        return <span className="italic text-gray-600">Немає обмежень</span>;
    }

    return (
        <>
            <span className="m-1 rounded-full bg-gray-300 p-0.5 dark:bg-neutral-500">{restrictions.length}</span>{" "}
            {restrictions.map(({ num, color, value }, i) => {
                const isR6Text = value !== undefined && String(num) === "6";
                const preview = isR6Text && value.length > 6 ? `${value.slice(0, 6)}…` : value;
                return (
                    <span key={`${num}-${i}`} className={RESTRICT_CLASS[color] || ""}>
                        {num}
                        {isR6Text ? (
                            <span
                                className="ml-1 rounded bg-amber-200 px-1 font-semibold text-amber-900 dark:bg-amber-700/60 dark:text-amber-100"
                                title={value}
                            >
                                ({preview})
                            </span>
                        ) : value !== undefined ? (
                            ` (${value})`
                        ) : null}
                        ,{" "}
                    </span>
                );
            })}
        </>
    );
};

export default RestrictionsCell;
