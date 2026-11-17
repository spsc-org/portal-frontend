// Пункти контекстного меню рядка ("Копіювати …") — порт TableManager.#buildContextMenuItems().
// Типи пунктів:
//   {type: "item",  key, icon, caption, value, disabled, disabledTitle}  — копіює value
//   {type: "group", key, icon, caption, children: item[], count, disabledTitle} — підменю (перший пункт — "ВСІ")
//   {type: "separator", key}

const str = (v) => (v === null || v === undefined ? "" : String(v).trim());

// 'YYYY-MM-DD[ HH:MM:SS]' → 'DD.MM.YYYY'; інші формати — як є
export const formatDate = (value) => {
    if (!value) return "";
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}.${match[2]}.${match[1]}` : String(value);
};

const item = (key, icon, caption, value, disabledTitle = "") => ({
    type: "item",
    key,
    icon,
    caption,
    value,
    disabled: value === "",
    disabledTitle,
});

// Група з підменю: кожен елемент окремо + "ВСІ" (усі через delimiter)
const group = (key, icon, caption, list, toText, disabledTitle, delimiter) => {
    const texts = (Array.isArray(list) ? list : []).map(toText).filter((text) => text !== "");
    const children = texts.map((text, i) => item(`${key}-${i}`, "fa-copy", text, text));
    if (children.length > 0) children.unshift(item(`${key}-all`, "fa-list", "ВСІ", texts.join(delimiter)));
    return { type: "group", key, icon, caption, children, count: texts.length, disabledTitle };
};

const separator = (key) => ({ type: "separator", key });

export const buildContextMenuItems = (row, pd) => {
    const decreeCode = str(pd?.decree?.code ?? row.decreeCode);
    // dateLocal — дата указу за київським часом; date з precomputedData серіалізована в UTC (на день раніше)
    const decreeDate = formatDate(pd?.decree?.dateLocal ?? pd?.decree?.date);
    const decree = decreeCode && decreeDate ? `${decreeCode} від ${decreeDate}` : decreeCode;

    return [
        item("id", "fa-hashtag", "Копіювати ID", str(row.id)),
        item("drs", "fa-solar-system", "Копіювати ДРС код", str(row.drsId), "Відсутній ДРС код"),
        item("decree", "fa-file-certificate", "Копіювати Указ", decree, "Відсутній указ"),
        separator("s1"),
        item("nameUk", "fa-input-text", "Копіювати назву українською", str(row.nameUk), "Відсутня назва українською"),
        item("nameRu", "fa-input-text", "Копіювати назву російською", str(row.nameRu), "Відсутня назва російською"),
        item("nameEn", "fa-input-text", "Копіювати назву мовою оригіналу", str(row.nameEn), "Відсутня назва мовою оригіналу"),
        separator("s2"),
        // Як у комірці: «назва значення [країна]»
        group(
            "identifiers",
            "fa-passport",
            "Ідентифікаційні дані",
            pd?.identifiers,
            ({ caption, value, country }) =>
                str(value) ? [str(caption), str(value), country ? `[${country}]` : ""].filter(Boolean).join(" ") : "",
            "Немає ідентифікаторів",
            "; "
        ),
        group(
            "documents",
            "fa-file-lines",
            "Документи",
            pd?.documents,
            ({ regNum, regDate, listItem, unitCaption }) =>
                [str(regNum) + (listItem ? ` [${listItem}]` : ""), regDate ? `від ${formatDate(regDate)}` : "", str(unitCaption)]
                    .filter(Boolean)
                    .join(" "),
            "Немає документів",
            "; "
        ),
        group("proposals", "fa-briefcase", "Подання", pd?.proposals, ({ caption }) => str(caption), "Немає подань", "; "),
    ];
};
