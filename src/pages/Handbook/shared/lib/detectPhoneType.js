// Примітивна евристика розпізнавання типу номера — окрема функція (не
// вбудована в компонент), щоб пізніше тюнити правила без зачіпання UI.
// Реальні дані довідника: внутрішні короткі номери "XX-XX" (напр. "23-23"),
// мобільні у форматі "+380XXXXXXXXX", решта — "інший" (міські з кодом,
// закордонні тощо).
export const PHONE_TYPES = {
    INTERNAL: "internal",
    MOBILE: "mobile",
    OTHER: "other",
};

const INTERNAL_PATTERN = /^\d{2}-\d{2}$/;
const MOBILE_PATTERN = /^\+380\d{9}$/;

export const detectPhoneType = (phone) => {
    const trimmed = (phone || "").trim();
    if (INTERNAL_PATTERN.test(trimmed)) return PHONE_TYPES.INTERNAL;
    if (MOBILE_PATTERN.test(trimmed)) return PHONE_TYPES.MOBILE;
    return PHONE_TYPES.OTHER;
};
