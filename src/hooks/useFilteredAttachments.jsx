import { useMemo } from "react";

export function useFilteredAttachments(attachments = []) {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const wordExtensions = [".doc", ".docx", ".xlsx", ".pdf"];

    const isOfType = (fileName, extensions) =>
        extensions.some(ext => fileName.toLowerCase().endsWith(ext));

    const imageAttachments = useMemo(() => {
        return attachments.filter(att => isOfType(att.fileName, imageExtensions));
    }, [attachments]);

    const wordAttachments = useMemo(() => {
        return attachments.filter(att => isOfType(att.fileName, wordExtensions));
    }, [attachments]);

    return { imageAttachments, wordAttachments };
}
