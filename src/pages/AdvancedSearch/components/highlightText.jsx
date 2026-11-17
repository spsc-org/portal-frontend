
const highlightText = (text, query) => {
    const textAsString = String(text || '');
    const trimmedQuery = query.trim();

    if (!trimmedQuery || !textAsString) {
        return textAsString;
    }

    const searchWords = trimmedQuery.split(/\s+/).filter(Boolean);
    if (searchWords.length === 0) {
        return textAsString;
    }

    // Escape special regex characters from each word to use in the main regex
    const escapedWords = searchWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // Create a regex that finds any of the search words, with a capturing group
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');

    const parts = textAsString.split(regex);

    return (
        <>
            {parts.map((part, index) =>
                // The matched parts from the capturing group will be at odd indices
                index % 2 === 1 ? (
                    <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 dark:text-white">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

export default highlightText;
