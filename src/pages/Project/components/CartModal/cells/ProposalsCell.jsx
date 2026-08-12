import React from "react";

// Порт TableManager.js:#renderCellProposals() — легасі будує посилання
// через myApp.globals["appUrl"] (абсолютний URL); тут відносний "/proposal/{id}"
// того самого походження (сторінка й API — той самий origin), без залежності
// від легасі глобалу.
const PROPOSAL_CLASS = {
    1: "text-gray-700 dark:text-gray-300", 2: "text-gray-700 dark:text-gray-300", 3: "text-blue-500",
    4: "text-blue-500", 5: "text-green-500", 6: "text-gray-700 dark:text-gray-300", 7: "text-gray-700 dark:text-gray-300",
};

const ProposalsCell = ({ precomputedData }) => {
    const proposals = precomputedData?.proposals;
    if (!Array.isArray(proposals) || proposals.length === 0) {
        return (
            <>
                <span className="italic text-gray-400">Немає подань</span>
                <hr />
            </>
        );
    }

    return (
        <>
            {proposals.map(({ stateId, caption, id }, i) => (
                <React.Fragment key={id}>
                    <a href={`/proposal/${id}`} target="_blank" rel="noreferrer">
                        <i className={`fa-solid fa-briefcase ${PROPOSAL_CLASS[stateId] || ""}`} title={`Подання: ${caption}`} />{" "}
                        {caption.slice(0, 25)}..
                    </a>
                    {i < proposals.length - 1 && <br />}
                </React.Fragment>
            ))}
            <hr />
        </>
    );
};

export default ProposalsCell;
