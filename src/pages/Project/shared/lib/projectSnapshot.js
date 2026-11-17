/**
 * Канонічний ProjectSnapshot для threeWayMerge() (порт origin lib/projects/projectSnapshot.js
 * без DOM-адаптерів snapshotFromForm/applySnapshotToForm — у SPA стан форми вже живе у VM
 * саме в цій формі). Шейп — той самий JSON, що повертає GET /api/project/{id}
 * (legacy: country/category1/2/3/proposal, r1..r25 плоско, identifiers з
 * identifierId/identifierCountryId/identifierValue, attributes з attributeId/attributeValue).
 */

/** Поля-масиви об'єктів зі стабільним `id` — мерджаться поелементно. */
export const PROJECT_ITEM_ARRAY_PATHS = ['identifiers', 'attributes', 'documents'];

/**
 * Внутрішні/обчислювані/легасі поля сирого рядка `project` (їх повертає
 * `GET /api/project/{id}` разом з усіма іншими стовпцями) — форма їх ніколи
 * не редагує і не кладе в snapshotFromForm(), тож без цього списку вони
 * зʼявлялись як хибні конфлікти "моє = undefined" проти "їхнє = реальне
 * значення з БД" при кожному злитті. Також свідомо ігноруються decreeId/
 * issuerId/reasonId/subjectId — за рішенням продукту не варті переривання
 * користувача конфліктом.
 */
export const PROJECT_IGNORED_FIELDS = [
    'sourceInfo', 'raw', 'calcSearchContent', 'reasonId', 'insertingWarnings',
    'issuerId', 'precomputedData', 'originalId', 'expiredAt', 'excludedById',
    'fixedById', 'subjectId', 'decreeId',
    // Службові поля аудиту — не редагуються формою, тож завжди "мій бік
    // видалив" проти "їхній реальний": показувати їх як конфлікт нема сенсу.
    'updatedAt', 'updatedUserId',
];

export const PROJECT_MERGE_OPTIONS = {
    itemArrayPaths: PROJECT_ITEM_ARRAY_PATHS,
    ignoreKeys: PROJECT_IGNORED_FIELDS,
};

export const RESTRICTION_KEYS = [
    'r1', 'r1-1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r6-1',
    'r7', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14',
    'r15', 'r16', 'r17', 'r18', 'r19', 'r20', 'r21', 'r22',
    'r23', 'r24', 'r24-1', 'r24-2', 'r24-3', 'r24-4', 'r24-5',
];

/**
 * Нормалізує r-поля з "живого" знімка (сервер: 1/null, форма: true/false) до
 * булевих значень, щоб мердж не бачив хибних конфліктів через різне
 * представлення того самого стану.
 */
export function normalizeSnapshot(raw) {
    const snap = { ...raw };
    for (const key of RESTRICTION_KEYS) {
        snap[key] = Boolean(raw[key]);
    }
    snap.r25 = raw.r25 || null;
    snap.r6Text = raw.r6Text || null;

    const sortIds = (arr) => (Array.isArray(arr) ? [...arr].map(Number).sort((a, b) => a - b) : []);
    // `country` — «Задіяні країни» (мультиселект): getProject() віддає projectToCountry
    // плюс країни з ідентифікаторів. `citizen` — відмічені чекбокси громадянства, тобто
    // рівно те, що лежить у projectToCountry. Це різні множини — не можна виводити
    // одну з іншої, інакше мердж бачить хибну зміну і відмічає зайві чекбокси.
    snap.country = sortIds(raw.country);
    snap.citizen = sortIds(raw.citizen);
    snap.category1 = sortIds(raw.category1);
    snap.category2 = sortIds(raw.category2);
    snap.category3 = sortIds(raw.category3);
    snap.proposal = sortIds(raw.proposal);
    snap.reasons = sortIds(raw.reasons);

    snap.identifiers = (raw.identifiers || []).map((i) => ({
        id: i.id ?? null,
        identifierId: i.identifierId ?? null,
        identifierCountryId: i.identifierCountryId ?? null,
        identifierValue: i.identifierValue ?? '',
    }));
    snap.attributes = (raw.attributes || []).map((a) => ({
        id: a.id ?? null,
        attributeId: a.attributeId ?? null,
        attributeValue: a.attributeValue ?? '',
    }));
    snap.documents = (raw.documents || []).map((d) => ({
        id: d.id ?? null,
        typeId: d.typeId ?? null,
        unitId: d.unitId ?? null,
        regNum: d.regNum ?? null,
        regDate: d.regDate ?? null,
        listItem: d.listItem ?? null,
        caption: d.caption ?? null,
        path: d.path ?? null,
    }));

    return snap;
}

/** Людські підписи полів для панелі конфліктів. */
export const PROJECT_FIELD_LABELS = {
    nameUk: 'Назва (укр.)',
    nameRu: 'Назва (рос.)',
    nameEn: 'Назва (англ.)',
    adrUk: 'Адреса (укр.)',
    adrRu: 'Адреса (рос.)',
    adrEn: 'Адреса (англ.)',
    birthDate: 'Дата народження',
    reasoning: 'Обґрунтування',
    notes: 'Примітки',
    stateId: 'Стан',
    decreeId: 'Указ',
    drsId: 'DRS ID',
    termId: 'Термін',
    issuerId: 'Видавник',
    performerId: 'Виконавець',
    validatorId: 'Валідатор',
    fix_action_id: 'Номер справи (фікс.)',
    fix_decree: 'Указ (фікс.)',
    fix_annex: 'Додаток (фікс.)',
    fix_index: 'Індекс (фікс.)',
    country: 'Задіяні країни',
    citizen: 'Громадянство / Країна реєстрації',
    category1: 'Категорія 1',
    category2: 'Категорія 2',
    category3: 'Категорія 3',
    proposal: 'Пропозиції',
    reasons: 'Підстави',
    r25: 'Обмеження — інше (r25)',
    r6Text: 'Обмеження r6 — текст',
};

/**
 * Застосовує вибір користувача ("theirs" чи "mine") для одного конфлікту з
 * threeWayMerge() до робочого знімка. Знає про item-array поля (identifiers/
 * attributes/documents), де шлях — це `arrayName.itemId` (конфлікт видалення
 * проти зміни цілого елемента) або `arrayName.itemId.field` (конфлікт одного
 * поля елемента); решта шляхів — прості скалярні dot-paths.
 */
export function applyConflictChoice(snapshot, conflict, choice) {
    const value = choice === 'theirs' ? conflict.theirs : conflict.mine;
    const parts = conflict.path.split('.');
    const arrayName = parts[0];

    if (PROJECT_ITEM_ARRAY_PATHS.includes(arrayName) && parts.length >= 2) {
        const itemKey = parts[1];
        const arr = [...(snapshot[arrayName] || [])];
        const idx = arr.findIndex((it) => String(it?.id ?? '') === itemKey);

        if (parts.length === 2) {
            // Конфлікт цілого елемента: видалення проти зміни.
            if (value == null) {
                if (idx !== -1) arr.splice(idx, 1);
            } else if (idx !== -1) {
                arr[idx] = value;
            } else {
                arr.push(value);
            }
        } else {
            const field = parts.slice(2).join('.');
            if (idx !== -1) arr[idx] = { ...arr[idx], [field]: value };
        }

        snapshot[arrayName] = arr;
        return snapshot;
    }

    let cur = snapshot;
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
        cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
    return snapshot;
}

export function fieldLabelForPath(path) {
    if (PROJECT_FIELD_LABELS[path]) return PROJECT_FIELD_LABELS[path];
    if (path.startsWith('identifiers.')) return 'Ідентифікатор';
    if (path.startsWith('attributes.')) return 'Атрибут';
    if (path.startsWith('documents.')) return 'Документ';
    if (/^r[0-9]/.test(path)) return `Обмеження ${path}`;
    return path;
}
