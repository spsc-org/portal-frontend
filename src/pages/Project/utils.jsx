import {createColumnHelper} from "@tanstack/react-table";

const columnHelper = createColumnHelper();

export const IDENTIFIERS_HEADERS  = [
    columnHelper.accessor('identifierCountryId', {
        header: () => 'Країна',
        cell: props => props.getValue(),
    }),
    columnHelper.accessor('identifierId', {
        header: () => 'Тип',
        cell: props => props.getValue(),
    }),
    columnHelper.accessor('identifierValue', {
        header: () => 'Значення',
        cell: props => props.getValue(),
    }),
];

export const ATTRIBUTES_HEADERS  = [
    columnHelper.accessor('type', {
        header: () => 'Тип додаткових відомостей',
        cell: props => props.getValue(),
    }),
    columnHelper.accessor('value', {
        header: () => 'Значення',
        cell: props => props.getValue(),
    }),
]

export const DOCUMENTS_HEADERS  = [
    columnHelper.accessor('typeId', {
        header: () => 'Вид документа',
        cell: props => props.getValue(),
    }),
    columnHelper.accessor('regNum', {
        header: () => 'Реєстр.№',
        cell: props => props.getValue(),
    }),
    columnHelper.accessor('regData', {
        header: () => 'Дата',
        cell: props => props.getValue(),
    }),

    columnHelper.accessor('unitId', {
        header: () => 'Підрозділ',
        cell: props => props.getValue(),
    }),
    columnHelper.accessor('path', {
        header: () => 'Тека з матеріалами',
        cell: props => props.getValue(),
    }),
    columnHelper.accessor('caption', {
        header: () => 'Примітки',
        cell: props => props.getValue(),
    }),
]

export const convertIdentifiesToObject = (identifies) => {
    return identifies.reduce((acc, item, index) => {
        acc[`i-${index}-country`] = item.identifierCountryId;
        acc[`i-${index}-type`] = item.identifierId;
        acc[`i-${index}-value`] = item.identifierValue;
        return acc;
    }, {});
};

export const convertAttributesToObject = (attributes) => {
    return attributes.reduce((acc, item, index) => {
        acc[`a-${index}-type`] = item.type;
        acc[`a-${index}-value`] = item.value;
        return acc;
    }, {});
};
export const convertDocumentsToObject = (documents) => {
    return documents.reduce((acc, doc, index) => {
        acc[`d-${index}-docId`] = doc.id !== undefined ? doc.id : null;
        acc[`d-${index}-type`] = doc.typeId;
        acc[`d-${index}-regnum`] = doc.regNum;
        acc[`d-${index}-regdate`] = doc.regDate || null; // Default to null if regDate is missing
        acc[`d-${index}-unit`] = doc.unitId;
        acc[`d-${index}-path`] = doc.path;
        acc[`d-${index}-caption`] = doc.caption;
        return acc;
    }, {});
};
export const getRestrictionObject = (project) => {
    return {
        r1: project?.r1,
        "r1-1": project?.["r1-1"],
        r2: project?.r2,
        r3: project?.r3,
        r4: project?.r4,
        r5: project?.r5,
        r6: project?.r6,
        "r6-1": project?.["r6-1"],
        r7: project?.r7,
        r8: project?.r8,
        r9: project?.r9,
        r10: project?.r10,
        r11: project?.r11,
        r12: project?.r12,
        r13: project?.r13,
        r14: project?.r14,
        r15: project?.r15,
        r16: project?.r16,
        r17: project?.r17,
        r18: project?.r18,
        r19: project?.r19,
        r20: project?.r20,
        r21: project?.r21,
        r22: project?.r22,
        r23: project?.r23,
        r24: project?.r24,
        "r24-1": project?.["r24-1"],
        "r24-2": project?.["r24-2"],
        "r24-3": project?.["r24-3"],
        "r24-4": project?.["r24-4"],
        "r24-5": project?.["r24-5"],
        r25: project?.r25,
        r6Text: project?.r6Text,
    }
}
