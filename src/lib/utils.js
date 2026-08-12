import {format, isToday, isYesterday, startOfWeek} from "date-fns";

export const convertDate = (dateString) => {
    try {
        const date = new Date(dateString);
        const today = new Date();

        // Normalize today's date and calculate previous dates
        const startOfWeekCurrent = startOfWeek(today, {weekStartsOn: 1}); // Week starts on Monday
        const startOfWeekPrevious = startOfWeekCurrent.setDate(startOfWeekCurrent.getDate() - 7);

        // Normalize input date
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Determine the output based on the date
        if (isToday(normalizedDate)) {
            return "Сьогодні";
        } else if (isYesterday(normalizedDate)) {
            return "Вчора";
        } else if (normalizedDate >= startOfWeekCurrent) {
            return "Цього тижня";
        } else if (normalizedDate >= startOfWeekPrevious) {
            return "Тиждень тому";
        }
        // Return formatted date for other cases
        return format(normalizedDate, 'dd.MM.yyyy');
    } catch (error) {
        return "помилка форматування";
    }
};

export const convertToQueryParams = (arr = []) => {
    if (!Array.isArray(arr) || arr.length === 0) return {};
    const item = arr[0];

    const id = item.id;
    const order = item.desc ? 'desc' : 'asc';

    return {[id]: order};
};


export const ANIMALS = [
    "fa-alicorn",
    "fa-badger-honey",
    "fa-bat",
    "fa-bee",
    "fa-bugs",
    "fa-cat",
    "fa-cat-space",
    "fa-cow",
    "fa-deer",
    "fa-deer",
    "fa-deer-rudolph",
    "fa-dinosaur",
    "fa-dog",
    "fa-dog-leashed",
    "fa-dove",
    "fa-duck",
    "fa-elephant",
    "fa-fish-bones",
    "fa-fish-fins",
    "fa-frog",
    "fa-hippo",
    "fa-horse",
    "fa-horse-head",
    "fa-horse-saddle",
    "fa-lobster",
    "fa-monkey",
    "fa-narwhal",
    "fa-otter",
    "fa-paw",
    "fa-paw-claws",
    "fa-paw-simple",
    "fa-pig",
    "fa-rabbit",
    "fa-rabbit-running",
    "fa-ram",
    "fa-sheep",
    "fa-shield-cat",
    "fa-shield-dog",
    "fa-squirrel"
]

export const getRandomAnimal = () => {
    const randomIndex = Math.floor(Math.random() * ANIMALS.length);
    return ANIMALS[randomIndex];
}

export const SANC_DECREE_TYPES = [
    {"value": 1, "label": "Персональні"},
    {"value": 2, "label": "Секторальні"}
];
export const BOOLEANS = [
    {
        value: "1", label: "Так"
    },
    {
        value: "0", label: "Ні"
    }
]

export const mergePermissions = (defaultPermissions, user = {}) => {
    const userPermissions = user?.permissions?.pages;
    const mergedPermissions = {};

    Object.keys(defaultPermissions).forEach(key => {
        mergedPermissions[key] = {};

        Object.keys(defaultPermissions[key]).forEach(permission => {
            const defaultValue = defaultPermissions[key][permission];

            // Якщо userPermissions відсутня, беремо перший елемент з defaultValue
            if (!userPermissions || userPermissions?.[key] === undefined || userPermissions?.[key]?.[permission] === undefined) {
                mergedPermissions[key][permission] =
                    Array.isArray(defaultValue) ? defaultValue[0] : defaultValue;
            } else {
                // Якщо значення у userPermissions існує, беремо його
                mergedPermissions[key][permission] = userPermissions[key][permission];
            }
        });
    });

    return mergedPermissions;
}

export const conventAction = (value = "") => {
    switch (value.toLowerCase()) {
        case "true":
            return Boolean(value);
        case "false":
            return value === true
        case "individual":
            return "individual"
        default:
            return false
    }
}

export const filterPermissions = (permissions, filters = []) => {
    return Object.entries(permissions).reduce((acc, [key, value]) => {
        if (filters.includes(key)) {
            acc[key] = value
        }
        return acc
    }, {})
}

export const serializeParams = (params = {}) => {
    const searchParams = new URLSearchParams();
    for (const key in params) {
        const value = params[key];
        if (Array.isArray(value)) {
            value.forEach((v) => {
                searchParams.append(`${key}[]`, v);
            })
        } else if (value !== '' && value !== undefined) {
            searchParams.append(key, value);
        }
    }
    return searchParams;
}


export const downloadFile = (file = null, fileName = 'example.xlsx') => {
    if (!file) return;

    const url = window.URL.createObjectURL(new Blob([file]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName); // Ім'я файлу для завантаження
    document.body.appendChild(link);
    link.click();
    link.remove();
}


export const RESTRICTIONS = [
    "1",
    "1-1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "6-1",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "24-1",
    "24-2",
    "24-3",
    "24-4",
    "24-5",
    "25",
];


export const MAPPED_RESTRICTIONS = RESTRICTIONS.map((r)=> ({value: r, caption: r}))
