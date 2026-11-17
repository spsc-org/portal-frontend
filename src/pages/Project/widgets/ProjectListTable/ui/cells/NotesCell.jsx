import Highlight from "../../../../shared/ui/Highlight.jsx";
import EmptyNote from "./EmptyNote.jsx";
import TicketsList from "./TicketsList.jsx";

// Порт колонки "Дод. інформація, примітки": атрибути, місцезнаходження (юрособи), примітки, тікети
const ADDRESS_FIELDS = [
    { prefix: "УКР", field: "adrUk" },
    { prefix: "РОС", field: "adrRu" },
    { prefix: "АНГ", field: "adrEn" },
];

const NotesCell = ({ row, precomputedData, users, commands }) => {
    const attributes = precomputedData?.attributes;
    const addresses = row.subjectTypeId === 2 ? ADDRESS_FIELDS.filter(({ field }) => row[field]) : [];

    return (
        <>
            {Array.isArray(attributes) && attributes.length > 0 ? (
                attributes.map(({ caption, value }, i) => (
                    <div key={i}>
                        <span className="text-blue-600 underline dark:text-blue-400">{caption}:</span> <Highlight text={value} />;
                    </div>
                ))
            ) : (
                <EmptyNote>Немає атрибутів</EmptyNote>
            )}
            {addresses.length > 0 && (
                <div className="mt-1">
                    <span className="underline">Місцезнаходження:</span>
                    {addresses.map(({ prefix, field }) => (
                        <div key={field}>
                            <b>{prefix}:</b> <Highlight text={row[field]} />;
                        </div>
                    ))}
                </div>
            )}
            {row.notes && (
                <div className="mt-1">
                    <u className="text-green-600 dark:text-green-500">Примітки:</u> <Highlight text={row.notes} />
                </div>
            )}
            <TicketsList projectId={row.id} tickets={precomputedData?.tickets} users={users} commands={commands} />
        </>
    );
};

export default NotesCell;
