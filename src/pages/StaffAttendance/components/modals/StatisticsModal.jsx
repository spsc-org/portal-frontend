import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogHeader, Typography } from "@material-tailwind/react";
import { format } from 'date-fns';
import { useStaffStatistics } from '../../hooks/index.js';

const StatisticsModal = ({ isOpen, onClose }) => {
    const [statisticsDate, setStatisticsDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { data: statisticsResponse, isFetching: isStatisticsLoading } = useStaffStatistics(statisticsDate, isOpen);

    const statistics = statisticsResponse?.data || {};
    const statisticsDate_obj = statisticsResponse?.date;
    const isToday = statisticsDate_obj === format(new Date(), 'yyyy-MM-dd');

    return (
        <Dialog data-i-doc="modal:staff-attendance-statistics" open={isOpen} handler={onClose} size="xl">
            <DialogHeader className="flex justify-between items-center">
                Стройовка
                <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                    <i className="fa-solid fa-times"></i>
                </button>
            </DialogHeader>
            <div className="p-4">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Дата</label>
                    <input
                        type="date"
                        value={statisticsDate}
                        onChange={(e) => setStatisticsDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                </div>
                {isStatisticsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin">
                            <i className="fa-solid fa-spinner text-2xl text-blue-500"></i>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                            <thead>
                                <tr className="bg-gray-200 dark:bg-gray-800">
                                    <th rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-bold">Дата</th>
                                    <th rowSpan={2} className={`border px-3 py-2 text-center text-sm font-bold ${!isToday ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600' : 'border-gray-300 dark:border-gray-600'}`}>За списком</th>
                                    <th rowSpan={2} className={`border px-3 py-2 text-center text-sm font-bold ${!isToday ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600' : 'border-gray-300 dark:border-gray-600'}`}>Постійна дислокація</th>
                                    <th colSpan={2} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Тимчасова дислокація</th>
                                    <th colSpan={5} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Відсутні</th>
                                </tr>
                                <tr className="bg-gray-100 dark:bg-gray-900">
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">ЗП</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Дистанційна робота</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Відрядження</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Після наряду</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Лікарняний</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Відпустка</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Декретна відпустка</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium">{statisticsDate}</td>
                                    <td className={`border px-3 py-2 text-center ${!isToday ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600' : 'border-gray-300 dark:border-gray-600'}`}>{statistics['list_based'] || 0}</td>
                                    <td className={`border px-3 py-2 text-center ${!isToday ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600' : 'border-gray-300 dark:border-gray-600'}`}>{statistics['permanent_location'] || 0}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{statistics['home_based'] || 0}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{statistics['remote'] || 0}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{statistics['business_trip'] || 0}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{statistics['after_duty'] || 0}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{statistics['sick_leave'] || 0}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{statistics['vacation'] || 0}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{statistics['parental_leave'] || 0}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                            У відпустках: <span className="font-bold text-slate-800 dark:text-slate-200">{statisticsResponse?.vacation_percentage}%</span>
                        </div>
                        <div className="mt-6 border-t border-gray-300 dark:border-gray-600 pt-4">
                            <h3 className="text-sm font-bold mb-2">Деталізація по категоріям:</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                                    <thead>
                                        <tr className="bg-gray-200 dark:bg-gray-800">
                                            <th rowSpan={2} className="border px-3 py-2 text-center text-sm font-bold border-gray-300 dark:border-gray-600">Постійна дислокація</th>
                                            <th colSpan={2} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Тимчасова дислокація</th>
                                            <th colSpan={5} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Відсутні</th>
                                        </tr>
                                        <tr className="bg-gray-100 dark:bg-gray-900">
                                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">ЗП</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Дистанційна робота</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Відрядження</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Після наряду</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Лікарняний</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Відпустка</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-bold">Декретна відпустка</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">
                                                <div className="text-xs whitespace-pre-wrap">
                                                    {(statisticsResponse?.users || [])
                                                        .filter(user => user.absences.length === 0 && !user.zp)
                                                        .map(user => user.name)
                                                        .join('\n') || '-'}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">
                                                <div className="whitespace-pre-wrap">
                                                    {(statisticsResponse?.users || [])
                                                        .filter(user => user.absences.length === 0 && user.zp)
                                                        .map(user => user.name)
                                                        .join('\n') || '-'}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">
                                                <div className="whitespace-pre-wrap">
                                                    {(statisticsResponse?.users || [])
                                                        .filter(user => user.absences.includes('remote'))
                                                        .map(user => user.name)
                                                        .join('\n') || '-'}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">
                                                <div className="whitespace-pre-wrap">
                                                    {(statisticsResponse?.users || [])
                                                        .filter(user => user.absences.includes('business_trip'))
                                                        .map(user => user.name)
                                                        .join('\n') || '-'}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">
                                                <div className="whitespace-pre-wrap">
                                                    {(statisticsResponse?.users || [])
                                                        .filter(user => user.absences.includes('after_duty'))
                                                        .map(user => user.name)
                                                        .join('\n') || '-'}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">
                                                <div className="whitespace-pre-wrap">
                                                    {(statisticsResponse?.users || [])
                                                        .filter(user => user.absences.includes('sick_leave'))
                                                        .map(user => user.name)
                                                        .join('\n') || '-'}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">
                                                <div className="whitespace-pre-wrap">
                                                    {(statisticsResponse?.users || [])
                                                        .filter(user => user.absences.includes('vacation'))
                                                        .map(user => user.name)
                                                        .join('\n') || '-'}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">
                                                <div className="whitespace-pre-wrap">
                                                    {(statisticsResponse?.users || [])
                                                        .filter(user => user.absences.includes('parental_leave'))
                                                        .map(user => user.name)
                                                        .join('\n') || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

StatisticsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default StatisticsModal;
