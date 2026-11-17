// Згорнута/розгорнута панель фільтрів — той самий ключ, що й легасі-перемикач на /project
const STORAGE_KEY = "project_filters_compact";

export const readCompactPreference = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
        return true;
    }
};

export const saveCompactPreference = (compact) => {
    try {
        localStorage.setItem(STORAGE_KEY, compact ? "1" : "0");
    } catch {
        // не критично — просто не запамʼятається
    }
};
