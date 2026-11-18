/* eslint-disable react-refresh/only-export-components -- спільні хелпери форматування + дрібні компоненти журналу */
import { Chip, Tooltip } from "@material-tailwind/react";

export const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    if (seconds < 60) return `${seconds} сек`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0 && remainingSeconds > 0) return `${minutes} хв ${remainingSeconds} сек`;
    if (minutes > 0) return `${minutes} хв`;
    return `${seconds} сек`;
};

export const getImportTypeIcon = (type) => {
    const iconMap = {
        xls:  { icon: 'fa-file-excel', color: 'text-green-500' },
        xlsx: { icon: 'fa-file-excel', color: 'text-green-500' },
        csv:  { icon: 'fa-file-csv',   color: 'text-blue-500' },
        raw:  { icon: 'fa-file-lines', color: 'text-gray-600 dark:text-gray-400' },
        xml:  { icon: 'fa-file-code',  color: 'text-purple-500' },
        json: { icon: 'fa-file-code',  color: 'text-orange-500' },
    };
    const { icon, color } = iconMap[type?.toLowerCase()] ?? { icon: 'fa-file', color: 'text-blue-gray-500 dark:text-gray-400' };
    return <i className={`fa-solid ${icon} text-lg ${color} w-5 text-center`} />;
};

export const StatusChip = ({ status, status_label, has_warnings, warnings_count, error_message, onClick }) => {
    const colorMap = {
        success: 'green',
        failed:  'red',
        partial: 'amber',
        pending: 'blue-gray',
    };

    return (
        <div className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
            <Chip
                size="sm"
                variant="ghost"
                value={status_label || status}
                color={colorMap[status] ?? 'gray'}
                className="cursor-pointer hover:bg-opacity-20 transition-colors dark:text-gray-200"
            />
            {has_warnings && (
                <Tooltip content={`Кількість попереджень: ${warnings_count}`}>
                    <i className="fa-solid fa-triangle-exclamation text-amber-500 cursor-help" />
                </Tooltip>
            )}
            {status === 'failed' && error_message && (
                <Tooltip content={error_message}>
                    <i className="fa-solid fa-circle-info text-red-500 cursor-help" />
                </Tooltip>
            )}
        </div>
    );
};

export const PaginationFooter = ({ pagination, page, onPageChange }) => {
    if (!pagination || pagination.total === 0) return null;

    return (
        <div className="flex items-center justify-between border-t border-blue-gray-50 dark:border-neutral-700 pt-4 mt-4">
            <span className="text-sm text-blue-gray-600 dark:text-gray-400">
                Сторінка {pagination.current_page} з {pagination.last_page} (Всього: {pagination.total})
            </span>
            <div className="flex gap-2">
                <button
                    className="text-sm px-3 py-1 border border-blue-gray-300 dark:border-gray-600 rounded disabled:opacity-40 dark:text-gray-300 dark:hover:bg-neutral-600"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                >
                    Попередня
                </button>
                <button
                    className="text-sm px-3 py-1 border border-blue-gray-300 dark:border-gray-600 rounded disabled:opacity-40 dark:text-gray-300 dark:hover:bg-neutral-600"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === pagination.last_page}
                >
                    Наступна
                </button>
            </div>
        </div>
    );
};
