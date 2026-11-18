import { forwardRef } from "react"
import { buttonClassName } from "./buttonStyles.js"

// Portal UI kit — Button. Кольори/розміри/варіанти: ./buttonStyles.js
// forwardRef обов'язковий (React 18): MT PopoverHandler/MenuHandler/Tooltip прив'язуються до DOM кнопки через ref.
const Button = forwardRef(function Button(
  {
    children,
    iconBefore,
    color = "primary",
    variant = "filled",
    size = "md",
    fullWidth = false,
    // type не задаємо: як і MT Button, кнопка у <form> лишається submit
    className,
    // MT-only пропси, які не мають сенсу для звичайної кнопки
    ripple: _ripple,
    ...props
  },
  ref,
) {
  return (
    <button ref={ref} className={buttonClassName({ color, variant, size, fullWidth, className })} {...props}>
      {iconBefore}
      {children}
    </button>
  )
})

export default Button
