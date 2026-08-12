// Централізований конфіг констант для StaffAttendance
// Використовується для уникнення хардкодингу значень у компонентах

// Ключі для збереження налаштувань користувача в localStorage
export const STORAGE_KEYS = {
    RANGE_TYPE: 'staff-attendance-rangeType',
    FILTERS: 'staff-attendance-filters',
    VIEW_MODE: 'staff-attendance-viewMode',
    CURRENT_DATE: 'staff-attendance-currentDate',
};

// Range type options
export const RANGE_TYPES = ['1m', '2m', '3m', '6m', '1y'];

// Default filters
export const DEFAULT_FILTERS = {
    types: [],
    users: [],
    include_deleted: false,
};

// View modes
export const VIEW_MODES = {
    CALENDAR: 'calendar',
    TABLE: 'table',
};

// Calendar dimensions
export const CALENDAR_DIMENSIONS = {
    CELL_WIDTH: 36,
    EMPLOYEE_NAME_COLUMN_WIDTH: 180,
};

// Absence status colors and labels
export const ABSENCE_STATUS_CONFIG = {
    pending: {
        badge: 'bg-amber-100 text-amber-800',
        darkBadge: 'dark:bg-amber-900/30 dark:text-amber-200',
        label: 'Очікує',
        borderClass: 'border-2 border-dashed border-slate-400',
    },
    approved: {
        badge: 'bg-green-100 text-green-800',
        darkBadge: 'dark:bg-green-900/30 dark:text-green-200',
        label: 'Затверджено',
        borderClass: 'border border-slate-600',
    },
    rejected: {
        badge: 'bg-red-100 text-red-800',
        darkBadge: 'dark:bg-red-900/30 dark:text-red-200',
        label: 'Відхилено',
        borderClass: 'border-2 border-red-500',
    },
};

// API endpoints
export const API_ENDPOINTS = {
    CALENDAR: '/staff/calendar',
    STATISTICS: '/staff/statistics',
    SUMMARY: '/staff/summary',
    OPTIONS: '/staff/options',
    ABSENCE: '/staff',
    USER_ZP: '/staff/users',
    DOCUMENTS: '/staff/documents',
};

// Query keys for React Query
export const QUERY_KEYS = {
    CALENDAR: 'staff-calendar',
    STATISTICS: 'staff-statistics',
    SUMMARY: 'staff-summary',
    OPTIONS: 'staff-options',
    ABSENCE: 'staff-absence',
};

// Tooltip hide delay (ms)
export const TOOLTIP_HIDE_DELAY = 100;

// Form validation messages
export const VALIDATION_MESSAGES = {
    SELECT_EMPLOYEE: 'Виберіть співробітника',
    SELECT_TYPE: 'Виберіть тип відсутності',
    SPECIFY_START_DATE: 'Вкажіть дату початку',
    SPECIFY_END_DATE: 'Вкажіть дату кінця',
    INVALID_DATE_RANGE: 'Дата початку не може бути пізніше дати кінця',
    SPECIFY_DOCUMENT_NUMBER: 'Вкажіть номер документа',
    SPECIFY_DOCUMENT_DATE: 'Вкажіть дату документа',
    SAVE_ABSENCE_FIRST: 'Спочатку збережіть відсутність',
};
