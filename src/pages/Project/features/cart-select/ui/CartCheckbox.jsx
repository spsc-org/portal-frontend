import { useEffect, useRef } from "react";

// View: чекбокси кошика. Стан і команди — з useCartSelectionViewModel.
const CHECKBOX_CLASS = "h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-300 dark:border-gray-600 dark:bg-neutral-800";

export const CartRowCheckbox = ({ id, checked, onToggle }) => (
    <input type="checkbox" className={CHECKBOX_CLASS} aria-label={`Проєкт #${id} у кошику`} checked={checked} onChange={() => onToggle(id)} />
);

// indeterminate — лише DOM-властивість, атрибутом у JSX її не задати
export const CartPageCheckbox = ({ checked, indeterminate, disabled, onToggle }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <input
            ref={ref}
            type="checkbox"
            className={CHECKBOX_CLASS}
            aria-label="Усі проєкти сторінки в кошику"
            title="Усі проєкти сторінки в кошик"
            checked={checked}
            disabled={disabled}
            onChange={onToggle}
        />
    );
};
