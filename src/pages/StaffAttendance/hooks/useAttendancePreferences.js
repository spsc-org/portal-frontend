import { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { STORAGE_KEYS, DEFAULT_FILTERS, VIEW_MODES } from '../constants/attendanceConfig.js';

// Хук для керування локальними налаштуваннями сторінки (фільтри, вид, діапазон)
// Автоматично синхронізує зміни з localStorage
export const useAttendancePreferences = () => {
    const [rangeType, setRangeType] = useState(() =>
        localStorage.getItem(STORAGE_KEYS.RANGE_TYPE) || '1m'
    );

    const [filters, setFilters] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.FILTERS);
            return stored ? JSON.parse(stored) : DEFAULT_FILTERS;
        } catch {
            return DEFAULT_FILTERS;
        }
    });

    const [viewMode, setViewMode] = useState(() =>
        localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || VIEW_MODES.CALENDAR
    );

    // Базова дата періоду: без персистенції після перезавантаження діапазон
    // «стрибав» на поточний місяць, хоча rangeType відновлювався
    const [currentDate, setCurrentDate] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_DATE);
        if (stored) {
            const parsed = parseISO(stored);
            if (isValid(parsed)) {
                return parsed;
            }
        }
        return new Date();
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
        localStorage.setItem(STORAGE_KEYS.RANGE_TYPE, rangeType);
        localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
        localStorage.setItem(STORAGE_KEYS.CURRENT_DATE, format(currentDate, 'yyyy-MM-dd'));
    }, [filters, rangeType, viewMode, currentDate]);

    return {
        rangeType,
        setRangeType,
        filters,
        setFilters,
        viewMode,
        setViewMode,
        currentDate,
        setCurrentDate,
    };
};
