import PropTypes from 'prop-types';
import { Card, Typography, IconButton, Popover, PopoverHandler, PopoverContent, Button } from "@material-tailwind/react";
import { format, addMonths, subMonths } from 'date-fns';
import { uk } from 'date-fns/locale';
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import AdvancedSelectWithDefaults from "../../../components/fields/AdvancedSelectWithDefaults.jsx";
import { RANGE_TYPES } from '../constants/attendanceConfig.js';

const AttendanceFilters = ({ dateInterval, rangeType, setRangeType, filters, setFilters, setCurrentDate, currentDate, options }) => {
    
    const handlePrev = () => {
        const months = rangeType === '1m' ? 1 : rangeType === '2m' ? 2 : rangeType === '3m' ? 3 : rangeType === '6m' ? 6 : 12;
        setCurrentDate(subMonths(currentDate, months));
    };

    const handleNext = () => {
        const months = rangeType === '1m' ? 1 : rangeType === '2m' ? 2 : rangeType === '3m' ? 3 : rangeType === '6m' ? 6 : 12;
        setCurrentDate(addMonths(currentDate, months));
    };

    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                <Card className="lg:col-span-4 p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-none rounded-xl flex flex-row items-center gap-2">
                    <IconButton variant="text" size="sm" onClick={handlePrev} className="dark:text-white"><i className="fa-solid fa-chevron-left text-xs"></i></IconButton>
                    <Popover placement="bottom">
                        <PopoverHandler>
                            <div className="flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg py-1 transition-colors text-center">
                                <Typography variant="h6" className="capitalize dark:text-white text-[13px] font-bold">
                                    {format(dateInterval.start, 'd MMMM', { locale: uk })} - {format(dateInterval.end, 'd MMMM yyyy', { locale: uk })}
                                </Typography>
                            </div>
                        </PopoverHandler>
                        <PopoverContent className="z-[9999] p-0 border-none shadow-xl">
                            <DayPicker mode="single" locale={uk} onSelect={(date) => date && setCurrentDate(date)} className="m-0" />
                        </PopoverContent>
                    </Popover>
                    <IconButton variant="text" size="sm" onClick={handleNext} className="dark:text-white"><i className="fa-solid fa-chevron-right text-xs"></i></IconButton>
                </Card>
                <Card className="lg:col-span-3 p-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-none rounded-xl flex flex-row items-center justify-around">
                    {RANGE_TYPES.map(r => (
                        <Button key={r} variant={rangeType === r ? 'filled' : 'text'} color={rangeType === r ? 'blue' : 'blue-gray'} size="sm" className="py-1.5 px-2 rounded-lg font-bold text-[10px]" onClick={() => setRangeType(r)}>{r}</Button>
                    ))}
                </Card>
                <div className="lg:col-span-2">
                    <AdvancedSelectWithDefaults size="xs" isMulti options={options.absence_types} label="Види відсутності" id="filter_types" selectedOptions={filters.types} onChange={(val) => setFilters(prev => ({...prev, types: val || []}))} />
                </div>
                <div className="lg:col-span-2">
                    <AdvancedSelectWithDefaults size="xs" isMulti options={options.users} label="Співробітники" id="filter_users" selectedOptions={filters.users} onChange={(val) => setFilters(prev => ({...prev, users: val || []}))} />
                </div>
                <div className="lg:col-span-1 flex items-center">
                    <label htmlFor="includeDeleted" data-filter-active={filters.include_deleted ? 'true' : 'false'} className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200">
                        <div className="inline-flex items-center">
                            <div className="relative inline-block w-8 h-4 cursor-pointer rounded-full">
                                <input
                                    id="includeDeleted"
                                    name="includeDeleted"
                                    type="checkbox"
                                    className="peer appearance-none w-8 h-4 absolute bg-blue-gray-100 rounded-full cursor-pointer transition-colors duration-300 checked:bg-green-500 peer-checked:border-green-500 peer-checked:before:bg-green-500"
                                    checked={filters.include_deleted || false}
                                    onChange={(e) => setFilters(prev => ({...prev, include_deleted: e.target.checked}))}
                                />
                                <label htmlFor="includeDeleted" className="bg-white w-5 h-5 border border-blue-gray-100 rounded-full shadow-md absolute top-2/4 -left-1 -translate-y-2/4 peer-checked:translate-x-full transition-all duration-300 cursor-pointer before:content-[''] before:block before:bg-blue-gray-500 before:w-10 before:h-10 before:rounded-full before:absolute before:top-2/4 before:left-2/4 before:-translate-y-2/4 before:-translate-x-2/4 before:transition-opacity before:opacity-0 hover:before:opacity-10 peer-checked:border-green-500 peer-checked:before:bg-green-500"></label>
                            </div>
                        </div>
                        <span>Показати видалених</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

AttendanceFilters.propTypes = {
    dateInterval: PropTypes.shape({
        start: PropTypes.instanceOf(Date),
        end: PropTypes.instanceOf(Date),
    }).isRequired,
    rangeType: PropTypes.string.isRequired,
    setRangeType: PropTypes.func.isRequired,
    filters: PropTypes.shape({
        types: PropTypes.array,
        users: PropTypes.array,
        include_deleted: PropTypes.bool,
    }).isRequired,
    setFilters: PropTypes.func.isRequired,
    currentDate: PropTypes.instanceOf(Date).isRequired,
    setCurrentDate: PropTypes.func.isRequired,
    options: PropTypes.shape({
        absence_types: PropTypes.array,
        users: PropTypes.array,
    }).isRequired,
};

export default AttendanceFilters;
