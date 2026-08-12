// Підписи ключів identity_data (App\Models\DossierIdentifiers) — набір ключів
// залежить від типу суб'єкта (subject_type_id), тож рендеримо лише те, що реально прийшло.
export const IDENTIFIER_LABELS = {
    birthdate: "Дата народження",
    citizenship: "Громадянство",
    identity_docs: "Документи",
    tax_id: "Податковий номер",
    reg_id: "Реєстраційний номер",
    imo: "IMO",
    mmsi: "MMSI",
};

export const identifierLabel = (key) => IDENTIFIER_LABELS[key] ?? key;

// Мітки джерел identity_data.<key>.sources (App\Models\DossierIdentifiers::SOURCE_*).
export const SOURCE_LABELS = {
    drs: "ДРС",
    project: "проєкт",
};

export const sourceLabel = (source) => SOURCE_LABELS[source] ?? source;
