import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {debounce} from "lodash";

/**
 * Стандартний пошуковий інпут проєкту: дебаунсений onChange (800мс),
 * опційна іконка зліва (icon — клас font-awesome) та хрестик очищення
 * справа, коли поле не порожнє (клік — миттєве очищення без очікування
 * дебаунсу, без релоаду сторінки).
 */
const SearchInput = ({
                         size = "sm",
                         value = "",
                         name = "search",
                         label = "",
                         onChange,
                         placeholder = "Пошук",
                         disabled = false,
                         type = "text",
                         error = "",
                         icon = "",
                         ...rest
                     }) => {

    const inputRef = useRef(null);
    const [hasValue, setHasValue] = useState(Boolean(value));

    useEffect(()=> {
        if (inputRef.current.value && value === "") {
            inputRef.current.value = "";
            setHasValue(false);
        }
    },[value]);
    const sendRequest = useCallback((value) => {
        onChange({target: {value: value, name: name}});
    }, []);

    const debouncedSendRequest = useMemo(() => {
        return debounce(sendRequest, 800);
    }, [sendRequest]);

    const sendChange = (e) => {
        const value = e.target.value;
        setHasValue(Boolean(value));
        debouncedSendRequest(value);
    };

    useEffect(() => {
        return () => {
            debouncedSendRequest.cancel();
        };
    }, [debouncedSendRequest]);

    const handleClear = () => {
        debouncedSendRequest.cancel();
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
        }
        setHasValue(false);
        sendRequest("");
    };

    return (
        <div className="relative w-full">
            {Boolean(label) &&
                <label htmlFor={name}
                       className={`block text-${size} text-gray-600 dark:text-gray-300`}>{label}
                </label>
            }
            <div className="relative">
                {Boolean(icon) &&
                    <i className={`${icon} pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 dark:text-gray-500`}></i>
                }
                <input ref={inputRef} onInput={sendChange} disabled={disabled} type={type} defaultValue={value} placeholder={placeholder}
                       name={name} {...rest}
                       className={`w-full rounded-md border bg-white py-2 leading-5 text-${size} text-gray-800 placeholder:text-gray-500 shadow-sm transition duration-300 ease focus:outline-none focus:ring-1 disabled:bg-gray-200 dark:disabled:bg-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:placeholder:text-gray-400 ${icon ? 'pl-8' : 'pl-3'} ${hasValue ? 'pr-8' : 'pr-3'} ${Boolean(error) ? 'border-red-500 focus:border-red-600 focus:ring-red-300 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-300 dark:focus:border-blue-300'}`}/>
                {hasValue && !disabled &&
                    <button type="button"
                            onClick={handleClear}
                            title="Очистити"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                        <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                }
            </div>
            <span className="text-sm font-medium text-red-500 dark:text-red-400">{error}</span>

        </div>
    );
};

export default SearchInput;
