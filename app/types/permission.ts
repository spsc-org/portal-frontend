/**
 * Типи прав доступу для FE — похідні від App\Enums\Permission (backend).
 * Значення enum-кейсу `<page>.<key>` тут представлені як `<Entity>:<Action>`.
 *
 * Тримати синхронізовано вручну при зміні app/Enums/Permission.php.
 */

/** Сторінка/модуль (перший сегмент значення enum-кейсу, `Permission::page()`). */
export type Entity =
    | "task"
    | "announcement"
    | "developer-posts"
    | "developer-debug"
    | "document"
    | "sanctions"
    | "dossier"
    | "project"
    | "proposal"
    | "inventory"
    | "dictionary"
    | "handbook-phones"
    | "handbook-birthdays"
    | "admin-groups"
    | "admin-notifications"
    | "admin-users"
    | "develop"
    | "decree"
    | "staff"
    | "staff-responsible"
    | "integrations-datasets"
    | "integrations-export"
    | "integrations-vessel-imo"
    | "report"
    | "statistic"
    | "search";

/** Дія (другий сегмент значення enum-кейсу, `Permission::key()`). */
export type Action =
    | "create"
    | "read"
    | "update"
    | "delete"
    | "restore"
    | "readAudit"
    | "bulkOperations"
    | "revertState"
    | "exportExcel"
    | "exportDossiers"
    | "profileView"
    | "changeLink"
    | "deleteProfile"
    | "createLink"
    | "deleteLink"
    | "verifyDossier"
    | "ticketCreate"
    | "ticketResolve"
    | "ticketDelete"
    | "archive"
    | "import"
    | "manage"
    | "functionsManage"
    | "assignmentsManage"
    | "usersReportRead";

/**
 * Комбінація сутності й дії. Це загальний декартів добуток `Entity` × `Action` —
 * НЕ всі комбінації є реальними правами (напр. `task:manage` не існує в backend-enum).
 * Для точного переліку валідних прав див. {@link PERMISSIONS} нижче.
 */
export type Permission = `${Entity}:${Action}`;

/**
 * Повний перелік реальних прав, 1:1 з кейсами `App\Enums\Permission` (93 шт.).
 * Джерело істини для UI-форм адмінки (dropdown/checkbox матриці прав) —
 * саме цей масив, а не декартів добуток `Entity` × `Action`.
 */
export const PERMISSIONS = [
    "task:create",
    "task:read",
    "task:update",
    "task:delete",
    "task:restore",
    "task:readAudit",

    "announcement:read",
    "announcement:create",

    "developer-posts:read",
    "developer-posts:create",
    "developer-posts:update",

    "developer-debug:read",

    "document:create",
    "document:read",
    "document:update",
    "document:delete",
    "document:restore",

    "sanctions:profileView",
    "sanctions:changeLink",
    "sanctions:deleteProfile",

    "dossier:profileView",
    "dossier:createLink",
    "dossier:changeLink",
    "dossier:deleteLink",
    "dossier:verifyDossier",
    "dossier:deleteProfile",
    "dossier:readAudit",
    "dossier:ticketCreate",
    "dossier:ticketResolve",
    "dossier:ticketDelete",

    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "project:restore",
    "project:bulkOperations",

    "proposal:create",
    "proposal:read",
    "proposal:update",
    "proposal:delete",
    "proposal:revertState",
    "proposal:restore",
    "proposal:exportExcel",
    "proposal:exportDossiers",

    "inventory:create",
    "inventory:read",
    "inventory:update",
    "inventory:delete",
    "inventory:restore",

    "dictionary:create",
    "dictionary:read",
    "dictionary:update",
    "dictionary:delete",
    "dictionary:restore",

    "handbook-phones:read",
    "handbook-phones:update",
    "handbook-phones:delete",
    "handbook-phones:archive",
    "handbook-phones:import",
    "handbook-phones:readAudit",

    "handbook-birthdays:read",
    "handbook-birthdays:manage",
    "handbook-birthdays:import",

    "admin-groups:manage",

    "admin-notifications:manage",

    "admin-users:create",
    "admin-users:read",
    "admin-users:update",
    "admin-users:delete",
    "admin-users:restore",

    "develop:create",
    "develop:read",
    "develop:update",
    "develop:delete",
    "develop:restore",

    "decree:create",
    "decree:read",
    "decree:update",
    "decree:delete",

    "staff:create",
    "staff:read",
    "staff:update",
    "staff:delete",

    "staff-responsible:read",
    "staff-responsible:functionsManage",
    "staff-responsible:assignmentsManage",
    "staff-responsible:usersReportRead",

    "integrations-datasets:read",

    "integrations-export:read",

    "integrations-vessel-imo:read",

    "report:read",
    "statistic:read",
    "search:read",
] as const satisfies readonly Permission[];