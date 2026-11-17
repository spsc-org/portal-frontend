import { observer } from 'mobx-react-lite';
import { useViewModel } from '../../../../shared/mvvm/useViewModel.js';
import { SummaryViewModel } from '../../viewmodel/AttendanceModalViewModels.js';
import PropTypes from 'prop-types';
import { Dialog, DialogHeader, Button } from '@material-tailwind/react';
import AdvancedSelectWithDefaults from '../../../../components/fields/AdvancedSelectWithDefaults.jsx';

const SummaryModalInner = observer(({ isOpen, onClose, initialFilters }) => {
    const vm = useViewModel((deps) => new SummaryViewModel({ ...deps, initialFilters }));
    const localFilters = vm.filters;
    const isSummaryLoading = vm.isLoading;
    const users = vm.users;
    const allAbsenceTypes = vm.allAbsenceTypes;
    const summaryData = vm.summary;
    const optionsResponse = vm.optionsQuery.data;
    const handleDateChange = vm.setDate;
    const handleUsersChange = vm.setUsers;
    const handleTypesChange = vm.setTypes;
    const handleStatusesChange = vm.setStatuses;
    const handlePrint = vm.print;

    const rows = summaryData.rows || [];
    const columns = summaryData.columns || [];
    const totals = summaryData.totals || {};

    return (
        <Dialog data-i-doc="modal:staff-attendance-summary" open={isOpen} handler={onClose} size="xl">
            <DialogHeader className="flex justify-between items-center">
                <span>Зведена таблиця днів відсутності</span>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outlined"
                        className="flex items-center gap-2"
                        onClick={handlePrint}
                    >
                        <i className="fa-solid fa-print text-sm"></i>
                        <span className="text-xs">Друкувати</span>
                    </Button>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
            </DialogHeader>
            <div className="p-4">
                {/* Фільтри */}
                <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                    <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold mb-1.5 text-gray-600 dark:text-gray-400 uppercase">Від</label>
                        <input
                            type="date"
                            value={localFilters.startDate}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold mb-1.5 text-gray-600 dark:text-gray-400 uppercase">До</label>
                        <input
                            type="date"
                            value={localFilters.endDate}
                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <AdvancedSelectWithDefaults
                            size="xs"
                            isMulti
                            options={optionsResponse?.data?.statuses || []}
                            label="Статуси"
                            id="summary_statuses"
                            selectedOptions={(optionsResponse?.data?.statuses || []).filter(s => localFilters.statuses.includes(s.value))}
                            onChange={handleStatusesChange}
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <AdvancedSelectWithDefaults
                            size="xs"
                            isMulti
                            options={allAbsenceTypes}
                            label="Види"
                            id="summary_types"
                            selectedOptions={allAbsenceTypes.filter(t => localFilters.types.includes(t.value))}
                            onChange={handleTypesChange}
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <AdvancedSelectWithDefaults
                            size="xs"
                            isMulti
                            options={users}
                            label="Співробітники"
                            id="summary_users"
                            selectedOptions={users.filter(u => localFilters.users.includes(u.id))}
                            onChange={handleUsersChange}
                        />
                    </div>
                </div>

                {/* Таблиця */}
                {isSummaryLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin">
                            <i className="fa-solid fa-spinner text-2xl text-blue-500"></i>
                        </div>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Немає даних для обраного періоду
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                            <thead>
                                <tr className="bg-gray-200 dark:bg-gray-800">
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-bold min-w-[200px]">
                                        Співробітник
                                    </th>
                                    {columns.map((type) => {
                                        const typeConfig = allAbsenceTypes.find(t => t.value === type);
                                        return (
                                            <th
                                                key={type}
                                                className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold min-w-[80px]"
                                                style={{ borderTopColor: typeConfig?.color, borderTopWidth: '3px' }}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <span
                                                        className="w-3 h-3 rounded-sm"
                                                        style={{ backgroundColor: typeConfig?.color }}
                                                    ></span>
                                                    <span className="text-xs">{typeConfig?.caption || type}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium">
                                            {row.user_name}
                                        </td>
                                        {columns.map((type) => {
                                            const typeConfig = allAbsenceTypes.find(t => t.value === type);
                                            const days = row.counts[type];
                                            return (
                                                <td
                                                    key={`${row.user_id}-${type}`}
                                                    className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-medium transition-colors"
                                                    style={{
                                                        backgroundColor: days > 0 ? `${typeConfig?.color}20` : 'transparent',
                                                    }}
                                                >
                                                    {days > 0 ? (
                                                        <span style={{ color: typeConfig?.color }}>
                                                            {days}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                <tr className="bg-gray-200 dark:bg-gray-800 font-bold">
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">
                                        Разом
                                    </td>
                                    {columns.map((type) => {
                                        const typeConfig = allAbsenceTypes.find(t => t.value === type);
                                        const total = totals[type];
                                        return (
                                            <td
                                                key={`total-${type}`}
                                                className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center"
                                                style={{
                                                    backgroundColor: total > 0 ? `${typeConfig?.color}30` : 'transparent',
                                                }}
                                            >
                                                {total > 0 ? (
                                                    <span style={{ color: typeConfig?.color }}>
                                                        {total}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Dialog>
    );
});

/** Монтується лише відкритою: локальні фільтри стартують з фільтрів сторінки. */
const SummaryModal = (props) => (props.isOpen ? <SummaryModalInner {...props} /> : null);

SummaryModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    initialFilters: PropTypes.shape({
        startDate: PropTypes.string,
        endDate: PropTypes.string,
        users: PropTypes.arrayOf(PropTypes.number),
        types: PropTypes.arrayOf(PropTypes.string),
    }),
    absenceTypes: PropTypes.array,
};

export default SummaryModal;
