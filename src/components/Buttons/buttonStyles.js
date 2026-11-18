import { twMerge } from "tailwind-merge"

// Portal UI kit — Button.
//   primary   — єдина підтверджувальна дія (bg primary blue-600, hover primary-hover blue-700, обидві теми)
//   secondary — сусідня не-деструктивна дія: обведена, surface-card + border-input, текст ink-strong
//   warning   — "незбережені/локальні зміни": border warning (amber-400), текст warning-text, hover warning-surface-hover
//   success / error — заповнені сигнальні кольори (лише там, де дія справді про успіх/видалення)
//   white     — нейтральна кнопка без акценту (як secondary)
// variant: "filled" (за замовчуванням) | "outlined" | "text".
// Для сумісності з викликами, перенесеними з @material-tailwind, приймаються також
// MT-кольори (blue, red, green, amber, gray, blue-gray, …) і variant="gradient" (= filled).

const COLOR_ALIASES = {
  blue: "primary",
  "light-blue": "primary",
  indigo: "primary",
  red: "error",
  pink: "error",
  // Legacy MT-конвенція "зелена = зберегти": у kit підтверджувальна дія — primary
  green: "primary",
  teal: "success",
  yellow: "warning",
  amber: "warning",
  orange: "warning",
  "deep-orange": "warning",
  gray: "secondary",
  "blue-gray": "secondary",
  black: "secondary",
}

const normalizeColor = (color) => COLOR_ALIASES[color] ?? color

const FILLED = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-300",
  secondary:
    "border border-gray-200 bg-white text-gray-800 hover:bg-gray-100 focus-visible:ring-blue-300 dark:border-gray-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700",
  white:
    "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 focus-visible:ring-blue-300 dark:border-gray-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700",
  warning:
    "border border-amber-400 bg-white text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-300 dark:bg-neutral-800 dark:text-amber-400 dark:hover:bg-amber-900/40",
  success: "bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-300",
  error: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
}

const OUTLINED = {
  primary:
    "border border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-300 dark:text-blue-300 dark:hover:bg-blue-800/20",
  secondary: FILLED.secondary,
  white: FILLED.white,
  warning: FILLED.warning,
  success:
    "border border-green-700 bg-transparent text-green-700 hover:bg-green-50 focus-visible:ring-green-300 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20",
  error:
    "border border-red-500 bg-transparent text-red-600 hover:bg-red-50 focus-visible:ring-red-300 dark:text-red-400 dark:hover:bg-red-900/20",
}

const TEXT = {
  primary: "bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-300 dark:text-blue-300 dark:hover:bg-blue-800/20",
  secondary:
    "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-blue-300 dark:text-gray-300 dark:hover:bg-neutral-700",
  white:
    "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-blue-300 dark:text-gray-300 dark:hover:bg-neutral-700",
  warning:
    "bg-transparent text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-300 dark:text-amber-400 dark:hover:bg-amber-900/40",
  success:
    "bg-transparent text-green-700 hover:bg-green-50 focus-visible:ring-green-300 dark:text-green-400 dark:hover:bg-green-900/20",
  error: "bg-transparent text-red-600 hover:bg-red-50 focus-visible:ring-red-300 dark:text-red-400 dark:hover:bg-red-900/20",
}

const VARIANTS = { filled: FILLED, gradient: FILLED, outlined: OUTLINED, text: TEXT }

const SIZES = {
  xs: "h-7 gap-1 px-2 text-xs",
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-10 gap-2 px-5 text-base",
}

const BASE =
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"

export const buttonClassName = ({ color = "primary", variant = "filled", size = "md", fullWidth = false, className } = {}) => {
  const palette = VARIANTS[variant] ?? FILLED
  const tone = palette[normalizeColor(color)] ?? palette.primary
  return twMerge(BASE, SIZES[size] ?? SIZES.md, tone, fullWidth && "w-full", className)
}
