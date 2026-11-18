
// Атомарна кнопка напряму сортування — окремо від SortFieldMenu (вибір поля), той самий
// розподіл "2 кнопки", що й у TaskFilters.jsx (Task-модуль).
const SortDirectionButton = ({direction, onToggle}) => (
    <button
        type="button"
        onClick={onToggle}
        title={direction === "asc" ? "За зростанням" : "За спаданням"}
        className="inline-flex items-center justify-center h-[30px] w-[30px] rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-gray-700 dark:bg-neutral-700 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
        <i className={`fa-solid text-[11px] ${direction === "asc" ? "fa-arrow-up-short-wide" : "fa-arrow-down-wide-short"}`}></i>
    </button>
);

export default SortDirectionButton;
