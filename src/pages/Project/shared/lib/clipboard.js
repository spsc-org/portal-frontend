// Копіювання в буфер обміну. navigator.clipboard доступний лише в secure context
// (https/localhost) — Portal відкривають і по http за IP, тож є fallback через execCommand
// (той самий підхід, що TableManager.#copyToClipboard()).
export const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // далі — fallback
        }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
        return document.execCommand("copy");
    } catch {
        return false;
    } finally {
        textarea.remove();
    }
};
