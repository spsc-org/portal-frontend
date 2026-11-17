import Highlight from "../../../../shared/ui/Highlight.jsx";
import EmptyNote from "./EmptyNote.jsx";
import DecreeCell from "../../../../components/CartModal/cells/DecreeCell.jsx";
import ProposalsCell from "../../../../components/CartModal/cells/ProposalsCell.jsx";

// Порт колонки "Документи": указ + подання (спільні з React-кошиком комірки) + документи
const DOC_ICONS = {
    1: "fa-regular fa-file-import",
    2: "fa-regular fa-file-plus",
    3: "fa-regular fa-file-xmark",
    4: "fa-regular fa-file-exclamation",
    5: "fa-regular fa-file-check",
    7: "fa-regular fa-file-check",
    8: "fa-regular fa-file-check",
};

const DocumentsCell = ({ row, precomputedData }) => {
    const documents = precomputedData?.documents;

    return (
        <>
            <DecreeCell decreeCode={row.decreeCode} expiredAt={row.expiredAt} decree={precomputedData?.decree} />
            <ProposalsCell precomputedData={precomputedData} />
            {Array.isArray(documents) && documents.length > 0 ? (
                documents.map(({ typeId, regNum, regDate, listItem, unitCaption }, i) => (
                    <div key={i}>
                        {DOC_ICONS[typeId] && <i className={`${DOC_ICONS[typeId]} mr-1`} />}
                        <Highlight text={`${regNum}${listItem ? ` [${listItem}]` : ""} ${regDate} ${unitCaption};`} />
                    </div>
                ))
            ) : (
                <EmptyNote>Немає документів</EmptyNote>
            )}
        </>
    );
};

export default DocumentsCell;
