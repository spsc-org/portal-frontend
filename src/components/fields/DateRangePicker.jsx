import {useState} from "react";
import {DayPicker, getDefaultClassNames, UI} from "react-day-picker";
import "react-day-picker/style.css";
import {uk} from "react-day-picker/locale";
import {addMonths, format} from "date-fns";
import { Popover, PopoverContent, PopoverHandler } from "@material-tailwind/react"
import Button from "../Buttons/Button.jsx"
import Input from "./Input.jsx";

const dateKey = (value) => (value ? new Date(value).getTime() : "");

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

    // Синхронізація з пропсами під час рендеру (замість setState в ефекті): лише коли змінились
    // самі дати — порівнюємо за значенням, бо батьки часто передають нові об'єкти Date.
    const propsKey = `${dateKey(from)}|${dateKey(to)}`;
    const [syncedKey, setSyncedKey] = useState(propsKey);
    if (syncedKey !== propsKey) {
        setSyncedKey(propsKey);
        setRange({from: from, to: to});
    }

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
                            className="cursor-pointer !h-9 !px-2.5 !py-0 !placeholder:text-gray-500 dark:!placeholder:text-gray-500"
                        />
                    </div>
                </PopoverHandler>
                <PopoverContent
                    className="p-4 bg-white dark:bg-neutral-800 dark:text-gray-200 border-0 shadow-lg">
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
                            [UI.MonthsDropdown]: `${defaultClassNames.months_dropdown} dark:bg-neutral-800`,
                            [UI.YearsDropdown]: `${defaultClassNames.years_dropdown} dark:bg-neutral-800`
                        }}
                        footer={footer}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DateRangePicker;
