import {identifierLabel} from "../../shared/config/identifiers.js";

// Якірне connection truth-джерела: origin=auto, без matched_criteria, і саме ДРС-дія
// (model_class 20/21/22) — без цього уточнення легасі sanctions:process-drafts
// самостійні профілі (model_class=1, той самий origin/matched_criteria "вигляд")
// хибно виглядали б якірними (той самий бag, що блокував видалення на бекенді).
const TRUTH_SOURCE_MODEL_CLASSES = [20, 21, 22];

export const isAnchor = (connection) =>
    connection?.origin === "auto"
    && (connection?.matched_criteria === null || connection?.matched_criteria === undefined)
    && TRUTH_SOURCE_MODEL_CLASSES.includes(connection?.model_class);

export const originMeta = (origin) =>
    origin === "manual"
        ? {label: "вручну", icon: "fa-solid fa-hand-pointer", classes: "text-violet-600 dark:text-violet-400"}
        : {label: "автоматично", icon: "fa-solid fa-robot", classes: "text-slate-500 dark:text-slate-400"};

const REVIEW_REASON_LABELS = {
    changed: "джерело змінилось",
    deleted: "джерело видалено",
    conflict: "конфлікт джерел",
};

export const reviewReasonLabel = (reviewReason) => REVIEW_REASON_LABELS[reviewReason] ?? "нечіткий збіг";

// Групує зв'язки, що потребують перегляду, за причиною — для агрегованого банера
// профілю (декілька зв'язків можуть мати різні review_reason одночасно).
export const summarizeReviewReasons = (connections) => {
    const counts = new Map();
    connections.forEach((connection) => {
        const label = reviewReasonLabel(connection.review_reason);
        counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    if (counts.size === 1) {
        return [...counts.keys()][0];
    }
    return [...counts.entries()].map(([label, count]) => `${label}: ${count}`).join(", ");
};

export const connectionStatus = (connection) => {
    // Нікчемний — термінальний статус, показуємо його незалежно від needs_review/confirmed_by
    // (звʼязок лишається в реєстрі, але дальші дії з ним модератору не потрібні).
    if (connection?.is_void) {
        return {
            label: "нікчемний",
            icon: "fa-solid fa-ban",
            classes: "text-gray-500 dark:text-gray-400",
        };
    }
    if (connection?.needs_review && connection?.review_reason === "conflict") {
        return {
            label: `конфлікт · ${reviewReasonLabel(connection.review_reason)}`,
            icon: "fa-solid fa-code-compare",
            classes: "text-red-600 dark:text-red-400",
        };
    }
    if (connection?.needs_review) {
        return {
            label: `необхідно підтвердити · ${reviewReasonLabel(connection.review_reason)}`,
            icon: "fa-solid fa-flag",
            classes: "text-orange-600 dark:text-orange-400",
        };
    }
    if (connection?.confirmed_by != null) {
        return {
            label: `confirmed · #${connection.confirmed_by}`,
            icon: "fa-solid fa-circle-check",
            classes: "text-green-600 dark:text-green-400",
        };
    }
    return {label: "непідтверджений модератором", icon: "fa-regular fa-circle", classes: "text-slate-400 dark:text-slate-500"};
};

// Лівий accent-бар картки зв'язку (за макетом).
export const connectionAccentClasses = (connection) => {
    if (connection?.is_void) return "border-l-gray-400 dark:border-l-gray-600";
    if (isAnchor(connection)) return "border-l-violet-600";
    if (connection?.needs_review && connection?.review_reason === "conflict") return "border-l-red-500";
    if (connection?.needs_review) return "border-l-orange-400";
    if (connection?.confirmed_by != null) return "border-l-green-500";
    return "border-l-slate-300 dark:border-l-slate-600";
};

// Звʼязок вважається підтвердженим, коли є confirmed_by і немає needs_review (розходження
// match_hash знову переводить звʼязок у стан "кандидат", навіть якщо колись підтверджували).
export const isConfirmed = (connection) =>
    connection?.confirmed_by != null && !connection?.needs_review;

// Кнопка підтвердження — тумблер (2026-08-05): видима завжди (крім якірних/нікчемних
// звʼязків), напрям дії (confirm/unconfirm) визначає isConfirmed(connection).
export const canToggleConfirm = (connection) =>
    !isAnchor(connection) && !connection?.is_void;

// Позначити нікчемним не можна вже підтверджений звʼязок — спершу unconfirm() (2026-08-05).
export const canVoid = (connection) =>
    !isAnchor(connection) && !connection?.is_void && !isConfirmed(connection);

// Видалити (unlink) може лише творець звʼязку (created_by) — 2026-08-05, для чужих/
// авто-звʼязків лишається лише void(). currentUserId порівнюємо як Number — created_by
// приходить з бекенду integer-ом, auth.user.id теж, але обидва можуть прийти як string
// із різних джерел (URL/localStorage), тож порівнюємо явно приведеними до Number.
export const canDelete = (connection, currentUserId) =>
    connection?.created_by != null
    && currentUserId != null
    && Number(connection.created_by) === Number(currentUserId);

// Чип критерію збігу: точний drsId — зелений, решта — сірі (за макетом).
export const criteriaChipClasses = (key) =>
    key === "drsId" || key === "drs_id"
        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

export const criteriaList = (matchedCriteria) => {
    if (!matchedCriteria) return [];
    if (Array.isArray(matchedCriteria)) return matchedCriteria.map(String);
    return Object.keys(matchedCriteria);
};

const CRITERIA_LABELS = {drs_id: "ДРС", drsId: "ДРС", project_identifier: "Ідентифікатор проєкту"};

// Саме значення (drs_id/tax_id/ідентифікатор тощо), яке збіглося і породило звʼязок —
// кешується в summary_data.matched_value при створенні/оновленні звʼязку
// (LinkProjectsToDossier::ensureConnection(), ImportDossierTruthSource::linkAction()).
// Може бути відсутнім на звʼязках, створених до появи цього поля (2026-07-27) чи на
// ручних звʼязках (там немає "значення, що збіглося" — людина звʼязала напряму).
export const matchedValue = (connection) => connection?.summary_data?.matched_value ?? null;

// Людський підпис критерію збігу — переюзає identifierLabel (tax_id/reg_id/identity_docs
// вже підписані там), drs_id туди не входить (не identity_data, окрема колонка профілю).
export const criteriaLabel = (key) => CRITERIA_LABELS[key] ?? identifierLabel(key);

// Групує зв'язки за самим ДЖЕРЕЛОМ (model_class, model_id) — універсально для будь-якого
// типу джерела (Project, ДРС-дії 20/21/22, майбутні бази): один субʼєкт/проєкт може
// збігтися з тим самим досьє одразу по кількох критеріях (drs_id І tax_id тощо) — кожен
// критерій зберігається окремим рядком sanction_profiles_connections (див. matched_criteria
// докблок LinkProjectsToDossier::ensureConnection), і без групування Реєстр звʼязків
// показує по кілька майже ідентичних рядків на те саме джерело. Порядок джерел і порядок
// звʼязків усередині групи — порядок вхідного масиву (сортування — турбота викликача).
export const groupConnectionsBySource = (connections) => {
    const map = new Map();
    connections.forEach((connection) => {
        const key = `${connection.model_class}:${connection.model_id}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(connection);
    });
    return [...map.values()];
};

// Чинність дії ДРС — рахується на льоту (summary_data.sanctions_end_date — сира дата,
// не кешований прапорець, інакше "протухав" би без окремого перерахунку).
export const isSanctionExpired = (endDate) => Boolean(endDate) && new Date(endDate) < new Date();

// Числовий код profile↔profile звʼязків (дзеркалить App\Models\DossierConnection::MODEL_CLASS_PROFILE).
export const MODEL_CLASS_PROFILE = 2;

export const isProfileRelation = (connection) => connection?.model_class === MODEL_CLASS_PROFILE;
