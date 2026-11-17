// Налаштування фільтрів, якими керують ЛЕГАСІ-модалки (localStorage "project-settings"):
// видимість кожного фільтра (Settings) і "Фільтр за поданням" (fProposalExtended).
// settings — getLegacySettings() з entities/project/legacyBridge.js.
export const toLegacyFilterSettings = (settings) => {
    const filters = settings?.filters ?? {};
    const visibility = Object.fromEntries(Object.entries(filters).map(([key, f]) => [key, f?.enabled !== false]));
    const pe = filters.fProposalExtended;
    return {
        visibility,
        proposalExtended: pe ? { enabled: Boolean(pe.enabled), val: Array.isArray(pe.val) ? pe.val : [] } : null,
    };
};

export const sameProposalExtended = (a, b) => JSON.stringify(a) === JSON.stringify(b);
