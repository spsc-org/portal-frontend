import { FIELD_LABEL_CLASS } from "./fieldStyles.js";
import { useDebouncedInputViewModel } from "../viewModel/useDebouncedInputViewModel.js";

// View текстового фільтра; вся поведінка (debounce, Enter, очистка) — у useDebouncedInputViewModel.
// Спільний контрол сам привʼязує свій ViewModel (binding), без доступу до Model.
const TextFilter = ({ id, label, value, onChange, delay, placeholder = "" }) => {
    const vm = useDebouncedInputViewModel({ value, onChange, delay });

    return (
        <div className="min-w-0">
            <label htmlFor={id} className={FIELD_LABEL_CLASS}>
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type="text"
                    value={vm.draft}
                    placeholder={placeholder}
                    onChange={(event) => vm.onInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && vm.onSubmit()}
                    className="h-9 w-full rounded-md border border-gray-200 bg-white py-1 pl-2 pr-7 text-xs text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-300"
                />
                {vm.canClear && (
                    <button
                        type="button"
                        title="Очистити"
                        aria-label={`Очистити: ${label}`}
                        onClick={vm.onClear}
                        className="absolute inset-y-0 right-0 flex w-7 items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <i className="fa-solid fa-xmark text-xs" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TextFilter;
