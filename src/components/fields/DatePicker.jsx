import React, {useEffect, useRef, useState} from "react";
import {DayPicker, getDefaultClassNames, UI} from "react-day-picker";
import "react-day-picker/style.css";
import {uk} from "react-day-picker/locale";
import {addMonths, format} from "date-fns";
import {Button, Popover, PopoverContent, PopoverHandler} from "@material-tailwind/react";

const DatePicker = ({
                        label = '',
                        value = undefined,
                        placeholder = 'Оберіть дату',
                        disabled = false,
                        onChange,
                        error = '',
                        size = 'sm',
                    }) => {

    const inputRef = useRef(null);
    const [date, setDate] = useState(undefined);
    const defaultClassNames = getDefaultClassNames();
    const today = new Date();
    const nextMonth = addMonths(today, 0);
    const [month, setMonth] = useState(nextMonth);

    useEffect(() => {
        if (inputRef.current && value) {
            inputRef.current.value = format(value, "dd.MM.yyyy")
        }
    }, [value, inputRef])

    const handleReset = () => {
        onChange(undefined);
        setDate(undefined);
        inputRef.current.value = ""
    }

    const handleSelect = (date) => {
        setDate(date)
        onChange(date);
        // inputRef.current.value = format(value, "dd.MM.yyyy")
    }

    const footer = (
        <div className="flex gap-x-2">
            <Button size={"sm"} variant="outlined" onClick={() => setMonth(today)}>
                Поточний місяць
            </Button>
            <Button size={"sm"} onClick={handleReset}>
                Очистити
            </Button>

        </div>
    );


    return (
        <div className="relative w-full">
            <Popover placement="bottom-start">
                <PopoverHandler>
                    <div className="w-full">
                        <label htmlFor="data-picker"
                               className={`block text-${size} text-gray-600 dark:text-gray-300`}>{label}
                        </label>
                        <input autoComplete="one-time-code" ref={inputRef} name="data-picker" disabled={disabled}
                               defaultValue={Boolean(date) ? format(date, "dd.MM.yyyy") : ""}
                               placeholder={placeholder}
                               className={`${!disabled ? 'cursor-pointer' : ''} w-full rounded-md border px-3 py-2 text-${size} text-gray-800 placeholder:text-gray-500 shadow-sm transition duration-300 ease focus:outline-none focus:ring-1 disabled:bg-gray-200 dark:disabled:bg-gray-950 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:placeholder:text-gray-400 ${Boolean(error) ? 'border-red-500 focus:border-red-600 focus:ring-red-300 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-300 dark:focus:border-blue-300'}`}/>
                        <span className="text-sm font-medium text-red-500">{error}</span>
                    </div>
                </PopoverHandler>
                <PopoverContent
                    className="p-4 bg-white dark:bg-gray-900 dark:text-slate-200 border-0 shadow-lg z-[9999]">
                    <DayPicker
                        mode="single"
                        month={month}
                        onMonthChange={setMonth}
                        captionLayout="dropdown"
                        firstWeekContainsDate={1}
                        timeZone="Europe/Kyiv"
                        weekStartsOn={1}
                        numberOfMonths={1}
                        startMonth={new Date(1970, 0)}
                        locale={uk}
                        onSelect={handleSelect}
                        selected={date || undefined}
                        classNames={{
                            [UI.MonthsDropdown]: `${defaultClassNames.months_dropdown} dark:bg-gray-900`,
                            [UI.YearsDropdown]: `${defaultClassNames.years_dropdown} dark:bg-gray-900`
                        }}
                        footer={footer}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DatePicker;
