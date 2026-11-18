import PropTypes from 'prop-types';
import { Card, Typography } from "@material-tailwind/react"
import Button from "../../../../components/Buttons/Button.jsx"
import { format, parseISO, differenceInDays } from 'date-fns';
import { ABSENCE_STATUS_CONFIG } from '../../constants/attendanceConfig.js';

const TableView = ({ calendarData, isLoading, onEdit, onDelete, onManageDocuments, absenceTypes }) => {
    if (isLoading) {
        return (
            <Card className="p-12 text-center">
                <Typography>Завантаження...</Typography>
            </Card>
        );
    }

    const allAbsences = calendarData
        .flatMap(row =>
            row.absences.map(abs => ({
                ...abs,
                employee_id: row.employee_id,
                full_name: row.full_name,
            }))
        )
        .sort((a, b) => {
            if (a.full_name !== b.full_name) {
                return a.full_name.localeCompare(b.full_name);
            }
            return new Date(b.start_date) - new Date(a.start_date);
        });

    const getStatusBadgeColor = (status) => {
        return ABSENCE_STATUS_CONFIG[status]?.badge || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status) => {
        return ABSENCE_STATUS_CONFIG[status]?.label || status;
    };

    const getTypeName = (typeSlug) => {
        return absenceTypes.find(t => t.value === typeSlug)?.caption || typeSlug;
    };

    return (
        <Card data-i-doc="view:staff-attendance-table-view" className="overflow-hidden border border-gray-200 dark:border-neutral-700 dark:bg-neutral-900 shadow-none rounded-2xl mt-2">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-neutral-800/50 border-b border-gray-200 dark:border-neutral-700">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Співробітник</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Тип</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Початок</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Кінець</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Днів</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">На дорогу</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Статус</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Примітка</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allAbsences.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-600">
                                    Немає записів
                                </td>
                            </tr>
                        ) : (
                            allAbsences.map(abs => {
                                const startDate = parseISO(abs.start_date);
                                const endDate = abs.end_date ? parseISO(abs.end_date) : startDate;
                                const duration = differenceInDays(endDate, startDate) + 1;

                                return (
                                    <tr key={abs.id} className="border-b border-gray-200 dark:border-neutral-700 hover:bg-blue-50 dark:hover:bg-blue-900/25 transition-colors cursor-pointer" onDoubleClick={() => onEdit(abs)}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{abs.full_name}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-sm"
                                                    style={{ backgroundColor: absenceTypes.find(t => t.value === abs.type_slug)?.color || '#ccc' }}
                                                />
                                                <span className="text-gray-900 dark:text-gray-100">{getTypeName(abs.type_slug)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {format(startDate, 'dd.MM.yyyy')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {abs.end_date ? format(endDate, 'dd.MM.yyyy') : <span className="italic">без дати</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100 font-medium">
                                            {duration}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            {abs.travel_days > 0 ? (
                                                <span className="text-gray-900 dark:text-gray-100 font-medium">+{abs.travel_days}</span>
                                            ) : (
                                                <span className="text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(abs.status_slug)}`}>
                                                {getStatusLabel(abs.status_slug)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                            {abs.reason || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="text"
                                                    color="blue"
                                                    size="sm"
                                                    className="px-2"
                                                    onClick={() => onEdit(abs)}
                                                    title="Редагувати">
                                                    <i className="fa-solid fa-pen text-xs"></i>
                                                </Button>
                                                <Button
                                                    variant="text"
                                                    color="gray"
                                                    size="sm"
                                                    className="px-2"
                                                    onClick={() => onManageDocuments(abs)}
                                                    title="Документи">
                                                    <i className="fa-solid fa-paperclip text-xs"></i>
                                                </Button>
                                                <Button
                                                    variant="text"
                                                    color="red"
                                                    size="sm"
                                                    className="px-2"
                                                    onClick={() => onDelete(abs)}
                                                    title="Видалити">
                                                    <i className="fa-solid fa-trash text-xs"></i>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

TableView.propTypes = {
    calendarData: PropTypes.arrayOf(PropTypes.shape({
        employee_id: PropTypes.number,
        full_name: PropTypes.string,
        absences: PropTypes.array,
    })).isRequired,
    isLoading: PropTypes.bool.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onManageDocuments: PropTypes.func.isRequired,
    absenceTypes: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string,
        caption: PropTypes.string,
        color: PropTypes.string,
    })).isRequired,
};

export default TableView;
