import React from "react";

const numberInputClasses = "w-14 h-[30px] px-2 border border-gray-300 rounded-md text-[12px] text-center dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 focus:border-blue-500";

// Пара полів "від/до" для числового діапазону (напр. кількість звʼязків) — винесено
// з ProfilesMasterList, де два майже ідентичні <input type="number"> повторювались поруч.
const NumberRangeFilter = ({icon, label, min = "0", valueMin, valueMax, onChangeMin, onChangeMax}) => (
    <div className="flex-none flex items-center gap-1">
        {Boolean(icon) && <i className={`${icon} text-[10px] text-gray-400`}></i>}
        {Boolean(label) && (
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {label}
            </span>
        )}
        <input
            type="number"
            min={min}
            value={valueMin}
            onChange={(e) => onChangeMin(e.target.value)}
            placeholder="від"
            title={`Мінімум${label ? `: ${label}` : ""}`}
            className={numberInputClasses}
        />
        <span className="text-[10px] text-gray-400">—</span>
        <input
            type="number"
            min={min}
            value={valueMax}
            onChange={(e) => onChangeMax(e.target.value)}
            placeholder="до"
            title={`Максимум${label ? `: ${label}` : ""}`}
            className={numberInputClasses}
        />
    </div>
);

export default NumberRangeFilter;
