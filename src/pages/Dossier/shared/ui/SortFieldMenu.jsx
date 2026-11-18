import {Menu, MenuHandler, MenuList, MenuItem} from "@material-tailwind/react";

// Атомарний вибір поля сортування — той самий візуальний патерн, що й TaskFilters.jsx
// (Task-модуль), напрям сортування — окрема кнопка (SortDirectionButton), не тут.
const SortFieldMenu = ({options, value, onChange}) => {
    const active = options.find((option) => option.id === value);

    return (
        <Menu placement="bottom-end">
            <MenuHandler>
                <button
                    type="button"
                    title="Сортування"
                    className="inline-flex items-center gap-1.5 h-[30px] px-[11px] rounded-full border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-700 dark:bg-neutral-700 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <i className="fa-regular fa-arrow-down-arrow-up text-[10px]"></i>
                    {active?.caption ?? "Сортування"}
                    <i className="fa-solid fa-chevron-down text-[8px] opacity-50"></i>
                </button>
            </MenuHandler>
            <MenuList className="min-w-[10rem] p-1 dark:border-neutral-700 dark:bg-neutral-700">
                {options.map((option) => (
                    <MenuItem
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={`text-xs dark:text-gray-300 dark:hover:bg-neutral-600 dark:hover:text-gray-100 dark:focus:bg-neutral-600 ${
                            value === option.id ? "bg-blue-50 dark:bg-blue-900/30" : ""
                        }`}
                    >
                        {option.caption}
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
};

export default SortFieldMenu;
