// Телефони й Дні народження — незалежні сторінки/права (handbook-phones,
// handbook-birthdays); "Довідники" в сайдбарі — суто інтерфейсна група.
export const canReadPhones = (auth) => Boolean(auth?.user?.permissions?.pages?.["handbook-phones"]?.read);

export const canReadBirthdays = (auth) => Boolean(auth?.user?.permissions?.pages?.["handbook-birthdays"]?.read);

export const canManageDefaultBirthdays = (auth) => Boolean(auth?.user?.permissions?.pages?.["handbook-birthdays"]?.manage);

// Масовий Excel-імпорт — окреме право (BirthdayEntryPolicy/PhoneEntryPolicy::import()):
// дає завантажити шаблон і закомітити перевірений імпорт.
export const canImportBirthdays = (auth) => Boolean(auth?.user?.permissions?.pages?.["handbook-birthdays"]?.import);

export const canImportPhones = (auth) => Boolean(auth?.user?.permissions?.pages?.["handbook-phones"]?.import);

// Історія аудиту Телефонів — окреме право, той самий принцип, що й task.readAudit.
// Аудитуються зміни УСІХ записів (немає особистих списків).
export const canReadPhoneAudit = (auth) => Boolean(auth?.user?.permissions?.pages?.["handbook-phones"]?.readAudit);

// owner_id=null (дефолтний список) — гейтиться manageBirthdays;
// заповнено — строго власник, той самий принцип, що й на бекенді
// (BirthdayEntryPolicy::update/delete), без винятків.
export const canManageBirthdayEntry = (auth, entry) =>
    entry?.owner_id === null
        ? canManageDefaultBirthdays(auth)
        : Number(entry?.owner_id) === Number(auth?.user?.id);

// Розшарування (Дні народження) — СТРОГО власник особистого запису, ніколи
// для дефолтного і ніколи для тримача manageBirthdays без власності
// (BirthdayEntryPolicy::share).
export const canShareBirthdayEntry = (auth, entry) =>
    entry?.owner_id !== null && Number(entry?.owner_id) === Number(auth?.user?.id);

// Телефони — немає особистих/спільних списків, усі записи видимі всім з
// handbook-phones.read. update/delete/archive гейтяться ОКРЕМИМИ правами
// (true/false/'individual'), той самий патерн, що й Task/utils.js
// (canUpdateRow/canDeleteRow): 'individual' — лише власник запису.
const canOnPhoneEntry = (auth, entry, key) => {
    const permission = auth?.user?.permissions?.pages?.["handbook-phones"]?.[key];
    if (permission === true) return true;
    if (permission === "individual") {
        return Number(entry?.owner_id) === Number(auth?.user?.id);
    }
    return false;
};

export const canUpdatePhoneEntry = (auth, entry) => canOnPhoneEntry(auth, entry, "update");

export const canDeletePhoneEntry = (auth, entry) => canOnPhoneEntry(auth, entry, "delete");

export const canArchivePhoneEntry = (auth, entry) => canOnPhoneEntry(auth, entry, "archive");

// Коментар до телефонного запису — редагувати/видаляти може ЛИШЕ автор,
// незалежно від прав на сам запис (PhoneEntryCommentPolicy).
export const canManagePhoneComment = (auth, comment) =>
    Number(comment?.user_id) === Number(auth?.user?.id);

// Керування групами користувачів (створення/перейменування/склад/видалення) —
// глобальне право, однакове для БУДЬ-якої групи (UserGroupPolicy::manage).
// Системну "Всім" (is_virtual) не можна змінювати навіть із цим правом.
export const canManageGroups = (auth) => Boolean(auth?.user?.permissions?.pages?.["admin-groups"]?.manage);
