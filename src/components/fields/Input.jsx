import React, {useState} from "react";

const Input = ({
                   ref,
                   tag = 'input',
                   value = '',
                   isProtected = false,
                   label = '',
                   type = 'text',
                   placeholder = '',
                   name,
                   onChange,
                   error = '',
                   size = 'sm',
                   isRequired = false,
                   info = "",
                   shrink,  // виключаємо з ...rest — не є DOM-атрибутом
                   showToggle = true,
                   ...rest
               }) => {
    const [isWide, setIsWide] = useState(false);
    const [disabled, setDisabled] = useState(isProtected);

    const toggle = (e) => {
        e.preventDefault();
        setIsWide(!isWide);
    }

    const handleChange = (event) => {
        if (type === 'number' && rest?.min !== undefined) {
            if (event.target.value.includes('-')) {
                return;
            }
            if (event.target.value !== '' && Number(event.target.value) < rest?.min) {
                return;
            }
        }
        onChange(event);
    }

    const toggleDisabled = ({target}) => setDisabled(target.checked);

    return (
        <div className="relative w-full">
            <label htmlFor={name}
                   className={`block text-${size} text-gray-600 dark:text-gray-300`}>{label}
                {
                    tag === 'textarea' && showToggle &&
                    <button onClick={toggle}
                            className="ml-1 px-1 py-0.5 rounded hover:bg-slate-200 hover:dark:bg-blue-900 transition">
                        <i className="fa-regular fa-arrows-up-down-left-right"></i>
                    </button>
                }
                {
                    isRequired &&
                    <i title="Обов'язкове поле" className="ml-1 fa-solid fa-asterisk text-red-600 text-xs"></i>
                }
            </label>
            {tag === "input" ? <>
                <input ref={ref} required={isRequired} onChange={handleChange} disabled={disabled} type={type}
                       value={value}
                       placeholder={placeholder}
                       name={name}
                       {...rest}
                       className={`${Boolean(rest?.className) ? rest?.className  : ''} w-full rounded-md border px-3 py-2 text-${size} text-gray-800 placeholder:text-gray-500 shadow-sm transition duration-300 ease focus:outline-none focus:ring-1 disabled:bg-gray-200 dark:disabled:bg-gray-950 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:placeholder:text-gray-400 ${Boolean(error) ? 'border-red-500 focus:border-red-600 focus:ring-red-300 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-300 dark:focus:border-blue-300'}`}/>
                {
                    Boolean(info) &&
                    <p className=" font-normal text-xs text-slate-500 dark:text-slate-400">
                        <i className="fa-solid fa-circle-info"></i>
                        <span className="ml-1">{info}</span>
                    </p>
                }
                {isProtected &&
                    <div>
                        <label className="cursor-pointer text-slate-500 dark:text-slate-400">
                            <input
                                type="checkbox"
                                className="cursor-pointer ring-1 form-checkbox h-3 w-3 text-blue-600 dark:text-blue-400 "
                                checked={disabled}
                                onChange={toggleDisabled}
                                {...rest}
                            />{' '}
                            Зняти блокування
                        </label>
                    </div>
                }
                {
                    Boolean(error) &&
                    <span className="text-sm font-medium text-red-500">
                <span className="mr-1">Помилка:</span>{error}</span>
                }
            </> : <>
                <textarea
                    className={`mt-0.5 block w-full rounded-md border box-border px-5 py-1 text-xs text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-1 disabled:bg-gray-200 dark:disabled:bg-gray-950 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:placeholder:text-gray-400 ${Boolean(error) ? 'border-red-500 focus:border-red-600 focus:ring-red-300 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-300 dark:focus:border-blue-300'} `}
                    onChange={onChange}
                    name={name}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    rows={isWide ? 20 : 3}
                    {...rest}
                />
                {isProtected &&
                    <div>
                        <label className="cursor-pointer text-slate-500 dark:text-slate-400">
                            <input
                                type="checkbox"
                                className="cursor-pointer ring-1 form-checkbox h-3 w-3 text-blue-600 dark:text-blue-400 "
                                checked={disabled}
                                onChange={toggleDisabled}
                            />{' '}
                            Зняти блокування
                        </label>
                    </div>
                }
                {
                    Boolean(error) &&
                    <span className="text-sm font-medium text-red-500">
                <span className="mr-1">Помилка:</span>{error}</span>
                }
            </>}
        </div>);
};

export default Input;
