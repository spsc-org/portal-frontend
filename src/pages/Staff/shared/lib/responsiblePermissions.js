// staff-responsible.read / .functionsManage / .assignmentsManage /
// .usersReportRead — ОКРЕМА сторінка прав (не підсекція staff — до
// 2026-08-07 було staff.responsible*, розділено, бо спільний блок з
// Відвідуваністю/Контрактами був неконсистентний з рештою прав проєкту й
// плутав в адмінці). Той самий патерн читання, що DeveloperPost/shared/lib/permissions.js.
// read і assignmentsManage — individual-скоуп (App\Enums\Permission::isIndividualScoped()):
// 'individual' — лише власні записи, true — повний реєстр/повні дії,
// false/відсутнє — немає доступу. functionsManage і usersReportRead — прості
// true/false (функція нікому "не належить", звіт — по всіх людях).
const responsiblePage = (auth) => auth?.user?.permissions?.pages?.["staff-responsible"] ?? {};

const readScope = (auth) => responsiblePage(auth).read ?? false;

const assignmentsManageScope = (auth) => responsiblePage(auth).assignmentsManage ?? false;

export const canViewFullResponsibleRegistry = (auth) => readScope(auth) === true;

// Звіт по користувачах — додатковий гейт ПОВЕРХ повного реєстру, не замість
// нього: без read=true взагалі немає доступу до розділу.
export const canViewUsersReport = (auth) =>
    canViewFullResponsibleRegistry(auth) && responsiblePage(auth).usersReportRead === true;

export const canManageResponsibleFunctions = (auth) => responsiblePage(auth).functionsManage === true;

// Чи може взагалі створити ХОЧ ЯКЕСЬ призначення (кнопка "+ Нове призначення") —
// 'individual' теж може (лише на себе).
export const canCreateAnyResponsibleAssignment = (auth) => assignmentsManageScope(auth) !== false;

// Одне призначення може стосуватись кількох людей одразу — при 'individual'
// керувати ним може лише той, хто сам є учасником групи.
export const canManageResponsibleAssignment = (auth, assignment) => {
    const scope = assignmentsManageScope(auth);
    if (scope === true) return true;
    if (scope === "individual") {
        return (assignment?.users || []).some((u) => Number(u.id) === Number(auth?.user?.id));
    }
    return false;
};

// Чи може взагалі призначити ЦЮ людину (для контролю видимості "+" на чужих
// картках при individual-скоупі — 'individual' може лише самопризначатися).
export const canAssignResponsibleUser = (auth, targetUserId) => {
    const scope = assignmentsManageScope(auth);
    if (scope === true) return true;
    if (scope === "individual") return Number(targetUserId) === Number(auth?.user?.id);
    return false;
};
