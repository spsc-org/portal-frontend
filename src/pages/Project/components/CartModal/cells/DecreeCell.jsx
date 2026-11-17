
// Порт TableManager.js:#renderCellDecree() + core.js:formatDateExpiredAt().
// Легасі-кошик (cartManager.js) фактично викликає цю функцію НЕПРАВИЛЬНО —
// передає termId замість precomputedData.decree (об'єкта декрету), тож
// у самому кошику ця клітинка завжди деградує до гілки decreeCode+expiredAt.
// Тут викликаємо коректно, з precomputedData.decree — дані для цього вже
// є в тому самому precomputedData, просто легасі їх туди не передавав.
const formatDateExpiredAt = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("uk-UA", { year: "2-digit", month: "2-digit", day: "2-digit" });
};

const DecreeCell = ({ decreeCode, expiredAt, decree }) => {
    const code = decree?.code ?? decreeCode;
    if (!code) {
        return (
            <>
                <span className="italic text-gray-400">Немає указу</span>
                <hr />
            </>
        );
    }

    const isActive = decree ? decree.isActive : true;

    // Дата закінчення дії санкцій (дата указу + термін), а не дата самого указу.
    // decree.expiredAt рахує makePrecomputedData; project.expiredAt — запасний варіант для
    // проєктів, чий precomputedData ще не перераховано.
    const expiry = decree?.expiredAt ?? expiredAt;
    let dateNode = null;
    if (expiry) {
        const decreeDate = decree?.dateLocal ? `, указ від ${decree.dateLocal}` : "";
        dateNode = (
            <span className="text-xs" title={`Термін закінчення дії${decreeDate}`}>
                до {formatDateExpiredAt(expiry)}
            </span>
        );
    }

    return (
        <>
            <i className={`fa-solid fa-file-certificate ${isActive ? "text-red-500" : "text-gray-400"}`} /> {code} {dateNode}
            <hr />
        </>
    );
};

export default DecreeCell;
