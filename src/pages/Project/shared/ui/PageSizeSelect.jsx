
// Portal UI kit: поле surface-card + border-input, radius-md, caption-text (12px), focus-ring.
// Висота як у кнопок Pagination (h-7), щоб стояли в одному рядку.
const SELECT = "h-7 rounded-md border border-gray-200 bg-white py-0 pl-2 pr-7 text-xs font-semibold text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-300";

const PageSizeSelect = ({ value, options, onChange, disabled = false }) => (
    <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
        <span>На сторінці:</span>
        <select className={SELECT} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))}>
            {options.map((size) => (
                <option key={size} value={size}>
                    {size}
                </option>
            ))}
        </select>
    </label>
);

export default PageSizeSelect;
