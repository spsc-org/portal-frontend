import { forwardRef } from "react"
import { twMerge } from "tailwind-merge"
import { buttonClassName } from "./buttonStyles.js"

// Portal UI kit — квадратна кнопка-іконка (radius-lg). Кольори/варіанти — як у Button;
// без color — нейтральна (secondary), як і MT IconButton за замовчуванням.
// Обов'язково передавай title/aria-label: тексту в кнопці немає.
// forwardRef обов'язковий (React 18): MT Menu/Popover/Tooltip прив'язуються до DOM кнопки через ref.
const SQUARE = { xs: "h-7 w-7", sm: "h-8 w-8", md: "h-9 w-9", lg: "h-10 w-10" }

const IconButton = forwardRef(function IconButton(
  { children, color = "secondary", variant = "filled", size = "md", className, ripple: _ripple, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClassName({
        color,
        variant,
        size,
        className: twMerge("rounded-lg px-0", SQUARE[size] ?? SQUARE.md, className),
      })}
      aria-label={props["aria-label"] ?? props.title}
      {...props}
    >
      {children}
    </button>
  )
})

export default IconButton
