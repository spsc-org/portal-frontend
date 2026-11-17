import {useState} from "react";

// Згорнутий/розгорнутий блок сирого search_index (профілю або зв'язку) — щоб бачити,
// який саме текст брав участь у FULLTEXT-матчингу, поруч із matched_criteria.
const SearchIndexToggle = ({value}) => {
    const [expanded, setExpanded] = useState(false);

    if (!value) {
        return null;
    }

    return (
        <div data-i-doc="component:sanction-profiles-search-index-toggle" className="mt-[11px]">
            <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-400 cursor-pointer dark:text-gray-500"
            >
                <i className={`fa-solid ${expanded ? "fa-caret-down" : "fa-caret-right"} text-[9px]`}></i>
                search_index
            </button>
            {expanded && (
                <div className="whitespace-pre-wrap break-words text-[11px] font-mono bg-gray-50 dark:bg-gray-800 rounded-md px-2.5 py-2 mt-1.5 max-h-40 overflow-y-auto text-gray-700 dark:text-gray-300">
                    {value}
                </div>
            )}
        </div>
    );
};

export default SearchIndexToggle;
