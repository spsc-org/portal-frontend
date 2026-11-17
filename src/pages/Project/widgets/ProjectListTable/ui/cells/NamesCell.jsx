import Highlight from "../../../../shared/ui/Highlight.jsx";

// Порт колонки "Назви/ДН" з TableManager.renderTableContent()
const FIX_FIELDS = ["fix_action_id", "fix_decree", "fix_annex", "fix_index"];

const NamesCell = ({ row }) => (
    <>
        {row.nameUk && (
            <div className="font-semibold text-gray-800 dark:text-gray-300">
                <i className="fa-light fa-input-text mr-1" />
                <Highlight text={row.nameUk} />
            </div>
        )}
        {row.nameRu && (
            <div>
                <i className="fa-light fa-input-text mr-1" />
                <Highlight text={row.nameRu} />
            </div>
        )}
        {row.nameEn && (
            <div>
                <i className="fa-light fa-input-text mr-1" />
                <Highlight text={row.nameEn} />
            </div>
        )}
        {row.birthDate && (
            <div>
                <i className="fa-solid fa-calendar-days mr-1" />
                <Highlight text={row.birthDate} />
            </div>
        )}
        {row.drsId && (
            <div className="text-green-600 dark:text-green-500" title="Номер в реєстрі">
                <i className="fa-solid fa-solar-system mr-1" />
                <Highlight text={String(row.drsId)} />
            </div>
        )}
        {FIX_FIELDS.filter((field) => row[field]).map((field) => (
            <div key={field} className="text-blue-600 dark:text-blue-400">
                {field}: {row[field]}
            </div>
        ))}
        {row.originalId && (
            <div className="text-gray-400" title="originalId">
                [origId#{row.originalId}]
            </div>
        )}
        {row.subjectId && (
            <div className="text-blue-700 dark:text-blue-400" title="subjectId">
                [sid#{row.subjectId}]
            </div>
        )}
    </>
);

export default NamesCell;
