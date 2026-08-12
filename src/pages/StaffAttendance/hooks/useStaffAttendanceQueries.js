import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { API_ENDPOINTS, QUERY_KEYS } from '../constants/attendanceConfig.js';

// useStaffOptions живе в спільному шарі простору /staff (за домовленістю з
// користувачем — один options на весь розділ, не по підсторінці), тут лише
// реекспорт заради зворотної сумісності імпортів (`./hooks/index.js` -> `Index.jsx`).
export {useStaffOptions} from '../../Staff/shared/lib/queries.js';

/**
 * @typedef {Object} AbsenceDocument
 * @property {number} id
 * @property {number} absence_id
 * @property {string} document_number
 * @property {string} document_date
 * @property {string|null} description
 * @property {string} added_by
 * @property {string} added_at
 */

/**
 * @typedef {Object} Absence
 * @property {number} id
 * @property {number} user_id
 * @property {string} type_slug
 * @property {string} status_slug
 * @property {string} start_date
 * @property {string|null} end_date
 * @property {string|null} reason
 * @property {number} net_days
 * @property {number} travel_days
 * @property {AbsenceDocument[]} documents
 */

/**
 * @typedef {Object} StaffCalendarRow
 * @property {number} employee_id
 * @property {string} full_name
 * @property {boolean} zp
 * @property {Absence[]} absences
 */

// Хуки для читання даних зі сервера
// Кожен хук має чіткі залежності для оновлення кешу при змінах параметрів

/**
 * Fetch staff attendance calendar data.
 * @param {Object} dateInterval
 * @param {Date} dateInterval.start
 * @param {Date} dateInterval.end
 * @param {Object} filters
 * @param {string} rangeType
 * @param {Object} optionsResponse
 * @returns {import('@tanstack/react-query').UseQueryResult<{success: boolean, data: StaffCalendarRow[], holidays: Object[]}>}
 */
export const useStaffCalendar = (dateInterval, filters, rangeType, optionsResponse) => {
    return useQuery({
        queryKey: [
            QUERY_KEYS.CALENDAR,
            format(dateInterval.start, 'yyyy-MM-dd'),
            format(dateInterval.end, 'yyyy-MM-dd'),
            filters,
            rangeType
        ],
        queryFn: async () => {
            const params = new URLSearchParams({
                start_date: format(dateInterval.start, 'yyyy-MM-dd'),
                end_date: format(dateInterval.end, 'yyyy-MM-dd')
            });
            filters.types.forEach(t => params.append('types[]', t.value));
            filters.users.forEach(u => params.append('users[]', u.id || u.value));
            if (filters.include_deleted) {
                params.append('include_deleted', 'true');
            }
            const response = await axios.get(`${API_ENDPOINTS.CALENDAR}?${params.toString()}`);
            return response.data;
        },
        enabled: !!optionsResponse,
        staleTime: 60000,
    });
};

/**
 * Fetch statistics for the "Стройовка" report.
 * @param {string} statisticsDate
 * @param {boolean} isEnabled
 * @returns {import('@tanstack/react-query').UseQueryResult<{success: boolean, data: Object, users: Object[], vacation_percentage: number}>}
 */
export const useStaffStatistics = (statisticsDate, isEnabled) => {
    return useQuery({
        queryKey: [QUERY_KEYS.STATISTICS, statisticsDate],
        queryFn: async () => {
            const response = await axios.get(`${API_ENDPOINTS.STATISTICS}?date=${statisticsDate}`);
            return response.data;
        },
        enabled: isEnabled,
        staleTime: 0,
    });
};

/**
 * Fetch summary table data.
 * @param {Object} filters
 * @param {boolean} isEnabled
 * @returns {import('@tanstack/react-query').UseQueryResult<{success: boolean, data: Object}>}
 */
export const useStaffSummary = (filters, isEnabled) => {
    return useQuery({
        queryKey: [QUERY_KEYS.SUMMARY, filters],
        queryFn: async () => {
            const params = new URLSearchParams({
                start_date: filters.startDate,
                end_date: filters.endDate,
            });
            filters.types.forEach(t => params.append('types[]', t));
            filters.users.forEach(u => params.append('users[]', u));
            filters.statuses.forEach(s => params.append('statuses[]', s));
            const response = await axios.get(`${API_ENDPOINTS.SUMMARY}?${params.toString()}`);
            return response.data;
        },
        enabled: isEnabled && !!filters.startDate && !!filters.endDate,
        staleTime: 0,
    });
};

/**
 * Fetch details for a specific absence.
 * @param {number|string} absenceId
 * @param {boolean} isEnabled
 * @returns {import('@tanstack/react-query').UseQueryResult<{success: boolean, data: Absence}>}
 */
export const useAbsenceDetails = (absenceId, isEnabled) => {
    return useQuery({
        queryKey: [QUERY_KEYS.ABSENCE, absenceId],
        queryFn: async () => {
            const res = await axios.get(`${API_ENDPOINTS.ABSENCE}/${absenceId}`);
            return res.data;
        },
        enabled: isEnabled && !!absenceId,
        staleTime: 60000,
    });
};
