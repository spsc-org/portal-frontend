import { useCallback, useEffect, useMemo, useRef } from "react";
import { debounce } from "lodash";

const AdvancedSearchInput = ({
                                size = "sm",
                                value = "",
                                name = "search",
                                label = "",
                                onChange,
                                placeholder = "Пошук",
                                disabled = false,
                                type = "text",
                                error = "",
                                ...rest
                            }) => {

    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current.value !== value) {
            inputRef.current.value = value;
        }
    }, [value]);

    const sendRequest = useCallback((value) => {
        onChange({ target: { value: value, name: name } });
    }, [onChange, name]);

    const debouncedSendRequest = useMemo(() => {
        return debounce(sendRequest, 800);
    }, [sendRequest]);

    const sendChange = (e) => {
        const value = e.target.value;
        debouncedSendRequest(value);
    };

    const handleClear = () => {
        if (inputRef.current) {
            inputRef.current.value = "";
        }
        onChange({ target: { value: "", name: name } });
        debouncedSendRequest.cancel();
    };

    useEffect(() => {
        return () => {
            debouncedSendRequest.cancel();
        };
    }, [debouncedSendRequest]);

    const baseClasses = `w-full bg-white disabled:bg-gray-200 dark:disabled:bg-neutral-800 placeholder:text-gray-500 leading-5 text-gray-700 text-${size} border rounded-sm px-3 py-2 transition duration-150 ease-in-out focus:outline-none pr-10 dark:bg-neutral-900 dark:text-gray-300`;

    const stateClasses = error
        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
        : 'border-gray-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:hover:border-neutral-500 dark:focus:border-blue-500';


    return (
        <div className="relative w-full">
            {label && <label htmlFor={name}
                     className={`block text-${size} text-gray-600 dark:text-gray-300`}>{label}
            </label>}
            <div className="relative">
                <input ref={inputRef} onInput={sendChange} disabled={disabled} type={type} defaultValue={value}
                       placeholder={placeholder}
                       name={name} {...rest}
                       className={`${baseClasses} ${stateClasses}`}/>
                {value && (
                    <div
                        className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-600 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-150 ease-in-out"
                        onClick={handleClear}
                        style={{cursor: 'pointer'}}
                        aria-label="Очистити пошук"
                    >
                        <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="fill-current">
                            <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path>
                        </svg>
                    </div>
                )}
            </div>
            {error && <span className="text-sm font-medium text-red-500">{error}</span>}
        </div>
    );
};

export default AdvancedSearchInput;
