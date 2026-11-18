export function SegmentedControl({ value, options, onChange }) {
    return (
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-600 dark:bg-neutral-700/80">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                        value === option.value
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-neutral-600'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export function TypeChip({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                active
                    ? 'bg-gray-800 text-white dark:bg-neutral-50 dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
            }`}
        >
            {children}
        </button>
    );
}
