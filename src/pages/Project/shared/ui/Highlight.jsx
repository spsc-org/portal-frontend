import React, { createContext, useContext, useMemo } from "react";
import { normalizeWords, splitHighlight } from "../lib/highlight.js";

const HighlightContext = createContext([]);

// words — meta.highlightedWords поточної сторінки; нормалізуються один раз
export const HighlightProvider = ({ words, children }) => {
    const normalized = useMemo(() => normalizeWords(words), [words]);
    return <HighlightContext.Provider value={normalized}>{children}</HighlightContext.Provider>;
};

// Текст з підсвіченими словами пошуку (клас .highlight — той самий, що в легасі, resources/css/app.css)
const Highlight = ({ text }) => {
    const words = useContext(HighlightContext);
    if (text === null || text === undefined || text === "") return null;

    return splitHighlight(text, words).map((part, i) =>
        part.match ? (
            <span key={i} className="highlight dark:bg-yellow-700/60">
                {part.text}
            </span>
        ) : (
            <React.Fragment key={i}>{part.text}</React.Fragment>
        )
    );
};

export default Highlight;
