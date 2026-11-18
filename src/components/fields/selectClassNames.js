// Portal UI kit — спільний вигляд react-select (еталон: фільтри /project, MultiSelectFilter).
// Використовувати лише разом з `unstyled`: базові стилі react-select (emotion) не лежать
// у CSS-шарі й тому перебивають Tailwind v4 (@layer utilities) — через це в темній
// темі контрол лишався білим, хоч і мав dark:bg-neutral-800.
//   поле:  surface-field (white / neutral-900), border-input (gray-200 / neutral-600), radius-md,
//          фокус — primary border + focus-ring; вимкнене — gray-100 / neutral-800 (колір картки)
//   surface: "form" — поле у формі/модалці (як FIELD форми проєкту): white / neutral-900, межа gray-300 / neutral-600
//   меню:  surface-card, border-default, radius-lg; обрана опція — primary-tint / primary-on-tint

const SIZES = {
  xs: { control: "min-h-[2.25rem] text-xs", text: "text-xs" },
  // sm = h-9, як INPUT форми проєкту, TextFilter і SearchInput xs
  sm: { control: "min-h-[2.25rem] text-sm", text: "text-sm" },
  md: { control: "min-h-[2.5rem] text-sm", text: "text-sm" },
  lg: { control: "min-h-[2.75rem] text-base", text: "text-base" },
}

const join = (...parts) => parts.filter(Boolean).join(" ")

/**
 * @param {{ size?: 'xs'|'sm'|'md'|'lg', invalid?: boolean, multiValueMaxWidth?: string, surface?: 'card'|'form' }} [options]
 */
const SURFACES = {
  // Єдине поле kit (як FIELD форми проєкту, modal-project-v2 $inp): white / neutral-900, межа gray-200 / neutral-600.
  card: { bg: "bg-white dark:bg-neutral-900", border: "border-gray-200 hover:border-gray-400 dark:border-neutral-600" },
  form: { bg: "bg-white dark:bg-neutral-900", border: "border-gray-200 hover:border-gray-400 dark:border-neutral-600" },
}

export function kitSelectClassNames({ size = "sm", invalid = false, multiValueMaxWidth = "", surface = "card" } = {}) {
  const s = SIZES[size] ?? SIZES.sm
  const tone = SURFACES[surface] ?? SURFACES.card
  return {
    container: () => s.text,
    control: (state) =>
      join(
        "rounded-md border px-1.5 transition-colors",
        s.control,
        state.isDisabled
          ? "cursor-default bg-gray-100 dark:bg-neutral-800"
          : `cursor-pointer ${tone.bg}`,
        invalid
          ? "border-red-500 dark:border-red-500"
          : state.isFocused
            ? "border-blue-500 ring-1 ring-blue-300 dark:border-blue-300"
            : tone.border,
      ),
    valueContainer: () => "gap-1 py-0.5",
    placeholder: () => "text-gray-500 dark:text-gray-400",
    input: () => "text-gray-800 dark:text-gray-300",
    singleValue: (state) => (state.isDisabled ? "text-gray-600 dark:text-gray-400" : "text-gray-800 dark:text-gray-300"),
    multiValue: () => join("items-center gap-0.5 rounded bg-gray-100 pl-1 dark:bg-neutral-600", multiValueMaxWidth),
    multiValueLabel: () => "truncate text-[11px] text-gray-700 dark:text-gray-200",
    multiValueRemove: () =>
      "rounded px-0.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-neutral-500 dark:hover:text-white",
    indicatorsContainer: (state) => join("gap-0.5 text-gray-500", state.isDisabled && "opacity-0"),
    clearIndicator: () => "cursor-pointer p-0.5 hover:text-gray-700 dark:hover:text-gray-200",
    dropdownIndicator: () => "cursor-pointer p-0.5 hover:text-gray-700 dark:hover:text-gray-200",
    indicatorSeparator: () => "w-px self-stretch bg-gray-200 dark:bg-neutral-600",
    menu: () =>
      join(
        "mt-1 w-max min-w-full max-w-[26rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800",
        s.text,
      ),
    menuList: () => "max-h-72 py-1",
    option: (state) =>
      join(
        "px-2 py-1.5",
        state.isDisabled ? "cursor-default opacity-50" : "cursor-pointer",
        state.isSelected
          ? "bg-blue-50 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300"
          : state.isFocused
            ? "bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-200"
            : "text-gray-700 dark:text-gray-300",
      ),
    noOptionsMessage: () => "px-2 py-1.5 text-gray-600 dark:text-gray-400",
    loadingMessage: () => "px-2 py-1.5 text-gray-600 dark:text-gray-400",
    groupHeading: () => "px-2 pb-1 pt-2 text-[11px] font-semibold uppercase text-gray-600 dark:text-gray-400",
  }
}
