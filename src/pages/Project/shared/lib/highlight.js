// Підсвітка слів пошуку (meta.highlightedWords з /api/project/v2/list) у тексті.
// Та сама нормалізація, що й myApp.highlightWordsInHtml() (core.js): кириличні/грецькі
// "двійники" латиниці, NFKC, нижній регістр — щоб "Крейн" знаходився і в "KPEЙH".
// Повертає частини тексту: [{text, match: boolean}].
const CONFUSABLE = {
    "А": "A", "В": "B", "С": "C", "Е": "E", "Н": "H", "І": "I",
    "К": "K", "М": "M", "О": "O", "Р": "P", "Т": "T", "У": "Y",
    "Х": "X", "а": "a", "в": "b", "с": "c", "е": "e", "н": "h",
    "і": "i", "к": "k", "м": "m", "о": "o", "р": "p", "т": "t",
    "у": "y", "х": "x",
    "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H", "Ι": "I",
    "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O", "Ρ": "P", "Τ": "T",
    "Υ": "Y", "Χ": "X", "α": "a", "β": "b", "ε": "e", "ι": "i",
    "κ": "k", "ο": "o", "ρ": "p", "τ": "t", "υ": "y", "χ": "x",
};

const normalizeChar = (ch) => (CONFUSABLE[ch] ?? ch).normalize("NFKC").toLowerCase();

export const normalizeWords = (words) =>
    (words ?? [])
        .map((w) => Array.from(String(w ?? "").trim()).map(normalizeChar).join(""))
        .filter(Boolean);

// normalizedWords — результат normalizeWords() (рахується один раз на сторінку)
export const splitHighlight = (text, normalizedWords) => {
    const source = String(text ?? "");
    if (source === "" || normalizedWords.length === 0) return [{ text: source, match: false }];

    // Нормалізований рядок + мапа позиція → індекс символу оригіналу
    // (NFKC може змінити довжину символу — тому не порівнюємо індекси напряму)
    const chars = Array.from(source);
    let normalized = "";
    const owner = [];
    chars.forEach((ch, index) => {
        const n = normalizeChar(ch);
        normalized += n;
        for (let i = 0; i < n.length; i++) owner.push(index);
    });

    const ranges = [];
    for (const word of normalizedWords) {
        let from = 0;
        while (from < normalized.length) {
            const at = normalized.indexOf(word, from);
            if (at === -1) break;
            ranges.push([owner[at], owner[at + word.length - 1] + 1]);
            from = at + word.length;
        }
    }
    if (ranges.length === 0) return [{ text: source, match: false }];

    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const range of ranges) {
        const last = merged[merged.length - 1];
        if (!last || range[0] > last[1]) merged.push([...range]);
        else if (range[1] > last[1]) last[1] = range[1];
    }

    const parts = [];
    let cursor = 0;
    for (const [start, end] of merged) {
        if (cursor < start) parts.push({ text: chars.slice(cursor, start).join(""), match: false });
        parts.push({ text: chars.slice(start, end).join(""), match: true });
        cursor = end;
    }
    if (cursor < chars.length) parts.push({ text: chars.slice(cursor).join(""), match: false });

    return parts;
};
