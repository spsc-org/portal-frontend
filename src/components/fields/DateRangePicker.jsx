import React, {useEffect, useState} from "react";
import {DayPicker, getDefaultClassNames, UI} from "react-day-picker";
import "react-day-picker/style.css";
import {uk} from "react-day-picker/locale";
import {addMonths, format} from "date-fns";
import {Button, Popover, PopoverContent, PopoverHandler} from "@material-tailwind/react";
import Input from "@/Components/fields/Input.jsx";


const DateRangePicker = ({
                             label = '',
                             from = undefined,
                             to = undefined,
                             placeholder = 'Оберіть дату',
                             size = 'sm',
                             onChange
                         }) => {
    const defaultClassNames = getDefaultClassNames();
    const [range, setRange] = useState({from: from, to: to});
    const today = new Date();
    const nextMonth = addMonths(today, 0);
    const [month, setMonth] = useState(nextMonth);

    useEffect(() => {
        if ((from === undefined || to === undefined) && (range.from !== undefined || range.to !== undefined)) {
            setRange({from: from, to: to});
        }
        if ((from || to) && (range.from === undefined || range.to === undefined)) {
            setRange({from: from, to: to});
        }
    }, [from, to, range.from, range.to]);

    const formatRange = (from, to) => {
        if (!from) return "";
        if (!to) return format(from, "dd.MM.yyyy");
        return `${format(from, "dd.MM.yyyy")} - ${format(to, "dd.MM.yyyy")}`;
    };

    const handleRange = (range) => {
        if (range) {
            onChange(range)
            setRange(range)
        } else {
            onChange(undefined);
            setRange({from: undefined, to: undefined});
        }
    }

    const handleReset = () => {
        onChange(undefined);
        setRange({from: undefined, to: undefined});
    }

    const footer = (
        <div className="flex gap-x-2">
            <Button size="sm" variant="outlined" onClick={() => setMonth(today)}>
                Поточний місяць
            </Button>
            <Button size="sm" disabled={!range?.from && !range?.to} onClick={handleReset}>
                Очистити
            </Button>
        </div>
    );

    return (
        <div className="relative w-full">
            <Popover placement="bottom-start">
                <PopoverHandler>
                    <div className="w-full">
                        <Input
                            label={label}
                            size={size}
                            placeholder={placeholder}
                            onChange={() => null}
                            value={formatRange(range.from, range.to)}
                            className="cursor-pointer !p-2.5 !placeholder:text-gray-500 dark:!placeholder:text-gray-400"
                        />
                    </div>
                </PopoverHandler>
                <PopoverContent
                    className="p-4 bg-white dark:bg-gray-900 dark:text-slate-200 border-0 shadow-lg z-[999]">
                    <DayPicker
                        mode="range"
                        month={month}
                        onMonthChange={setMonth}
                        captionLayout="dropdown"
                        firstWeekContainsDate={1}
                        timeZone="Europe/Kyiv"
                        weekStartsOn={1}
                        numberOfMonths={1}
                        startMonth={new Date(1970, 0)}
                        locale={uk}
                        selected={range.from ? range : undefined}
                        onSelect={handleRange}
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

export default DateRangePicker;
