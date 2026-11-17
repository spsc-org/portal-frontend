import { useCallback, useEffect, useRef, useState } from "react";

// ViewModel текстового поля з відкладеним застосуванням: локальна чернетка + debounce,
// Enter — застосувати одразу, зовнішнє value (скидання фільтрів) синхронізує чернетку.
// Затримка 2000 мс — як у легасі /project (FilterManager.debounceFilterInput): з 600 мс
// список оновлювався посеред слова за звичайного темпу набору.
export const useDebouncedInputViewModel = ({ value, onChange, delay = 2000 }) => {
    const [draft, setDraft] = useState(value);
    const timer = useRef(null);
    const latest = useRef({ value, onChange });
    useEffect(() => {
        latest.current = { value, onChange };
    });

    // Зовнішнє value змінилось (скидання фільтрів) — чернетку синхронізуємо під час рендера, без ефекту
    const [syncedValue, setSyncedValue] = useState(value);
    if (value !== syncedValue) {
        setSyncedValue(value);
        setDraft(value);
    }

    useEffect(() => () => clearTimeout(timer.current), []);

    const commit = useCallback((next) => {
        clearTimeout(timer.current);
        if (next !== latest.current.value) latest.current.onChange(next);
    }, []);

    const onInput = useCallback(
        (next) => {
            setDraft(next);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => commit(next), delay);
        },
        [commit, delay]
    );

    const onSubmit = useCallback(() => commit(draft), [commit, draft]);

    const onClear = useCallback(() => {
        setDraft("");
        commit("");
    }, [commit]);

    return { draft, canClear: draft !== "", onInput, onSubmit, onClear };
};
