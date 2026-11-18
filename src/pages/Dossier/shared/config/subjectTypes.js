// subject_type_id (sancItemType): 1 = особа, 2 = юр. особа, 5 = судно.
// Вигляд — за макетом "Дедуплікація - широкий екран".
export const SUBJECT_TYPES = {
    1: {title: "Особа", icon: "fa-solid fa-user", avatarClasses: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"},
    2: {title: "Юр. особа", icon: "fa-solid fa-industry", avatarClasses: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"},
    5: {title: "Судно", icon: "fa-solid fa-ship", avatarClasses: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300"},
};

export const subjectType = (subjectTypeId) =>
    SUBJECT_TYPES[subjectTypeId] ?? {
        title: "Невідомий тип",
        icon: "fa-solid fa-circle-question",
        avatarClasses: "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-400",
    };

export const TYPE_FILTERS = [
    {value: 0, label: "Усі", icon: "fa-solid fa-layer-group"},
    {value: 1, label: "Особи", icon: "fa-solid fa-user"},
    {value: 2, label: "Юр.", icon: "fa-solid fa-industry"},
    {value: 5, label: "Судна", icon: "fa-solid fa-ship"},
];