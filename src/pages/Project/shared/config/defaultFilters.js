// Типові фільтри списку проєктів (ключі, підписи, словники) — копія FilterManager.getDefaultFilters()
// легасі /project: та сама структура зберігається в localStorage "project-settings" (видимість фільтрів).
export const getDefaultFilters = () => ({
    "fText": {
        "type": "text",
        "width": "w-[200px]",
        "caption": "Глобальний пошук",
        "vocName": null,
        "val": "",
        "enabled": true
    },
    "fId": {
        "type": "text",
        "width": "w-[100px]",
        "caption": "id",
        "vocName": null,
        "val": "",
        "enabled": true
    },
    "fDocument": {
        "type": "text",
        "width": "w-[150px]",
        "caption": "Документ",
        "vocName": null,
        "val": "",
        "enabled": true
    },
    "fAction": {
        "type": "select",
        "width": "w-[100px]",
        "caption": "Тип дії",
        "vocName": "action",
        "val": [],
        "enabled": true
    },
    "fType": {
        "type": "select",
        "width": "w-[100px]",
        "caption": "Тип особи",
        "vocName": "subjectType",
        "val": [],
        "enabled": true
    },
    "fState": {
        "type": "select",
        "width": "w-[100px]",
        "caption": "Стан",
        "vocName": "state",
        "val": [],
        "enabled": true
    },
    "fCategory1": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Основна д-ть",
        "vocName": "category1",
        "val": [],
        "enabled": true
    },
    "fCategory2": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Протиправ. д-ть",
        "vocName": "category2",
        "val": [],
        "enabled": true
    },
    "fCategory3": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Інш. категорії",
        "vocName": "category3",
        "val": [],
        "enabled": true
    },
    "fSpecial": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Спеціальний",
        "vocName": "specialFilter",
        "val": [],
        "enabled": true
    },
    "fAttribute": {
        "type": "attribute",
        "width": "w-[150px]",
        "caption": "Атрибути",
        "vocName": "attributeType",
        "val": [],
        "enabled": true
    },
    "fProposal": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Подання",
        "vocName": "proposal",
        "val": [],
        "enabled": true
    },
    "fProposalState": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Стан подання",
        "vocName": "proposalState",
        "val": [],
        "enabled": true
    },
    "fDecree": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Указ",
        "vocName": "decree",
        "val": [],
        "enabled": true
    },
    "fCountry": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Країна",
        "vocName": "country",
        "val": [],
        "enabled": true
    },
    "fPerformer": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Виконавець",
        "vocName": "user",
        "val": [],
        "enabled": true
    },
    "fValidator": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Валідатор",
        "vocName": "user",
        "val": [],
        "enabled": true
    },
    "fInitiator": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Ініціатор",
        "vocName": "initiator",
        "val": [],
        "enabled": true
    },
    "fCreatedUser": {
        "type": "select",
        "width": "w-[150px]",
        "caption": "Додав",
        "vocName": "user",
        "val": [],
        "enabled": true
    },
    "fProposalExtended": {
        "type": "specific",
        "caption": null,
        "vocName": null,
        "val": [],
        "settings": {
            "state": [],
            "issuer": [],
        },
        "enabled": false
    }
})
