import { getDefaultFilters } from "../../../shared/config/defaultFilters.js";

// Джерело ключів/підписів/словників — той самий FilterManager.getDefaultFilters(),
// що й у легасі /project (і в Settings-модалці видимості фільтрів), без дублювання.
const LEGACY_DEFAULTS = getDefaultFilters();

// Порядок і поділ compact/розширені — як у project.blade.php ($inputs)
const COMPACT_KEYS = ["fText", "fDocument", "fAction", "fType", "fState", "fProposal"];
const EXTENDED_KEYS = [
    "fCategory1", "fCategory2", "fCategory3", "fSpecial", "fAttribute", "fValidator", "fInitiator",
    "fPerformer", "fCreatedUser", "fId", "fProposalState", "fDecree", "fCountry",
];

// У Blade підпис fProposal — "Пакет" (у getDefaultFilters — "Подання")
const CAPTION_OVERRIDES = { fProposal: "Пакет" };

const toConfig = (key, compact) => ({
    key,
    type: LEGACY_DEFAULTS[key].type, // text | select | attribute
    caption: CAPTION_OVERRIDES[key] ?? LEGACY_DEFAULTS[key].caption,
    vocName: LEGACY_DEFAULTS[key].vocName,
    compact,
});

export const FILTERS = [
    ...COMPACT_KEYS.map((key) => toConfig(key, true)),
    ...EXTENDED_KEYS.map((key) => toConfig(key, false)),
];

export const EXTENDED_FILTER_KEYS = EXTENDED_KEYS;

export const emptyFilterValues = () =>
    Object.fromEntries(FILTERS.map(({ key, type }) => [key, type === "text" ? "" : []]));
