import { forwardRef } from "react"
import { twMerge } from "tailwind-merge"

// Portal UI kit — кругла кнопка закриття модалки:
// close-button-surface (gray-200 / black), hover close-button-surface-hover (gray-300 / neutral-700), radius-full.
const CloseButton = forwardRef(function CloseButton({ onClick, label = "Закрити", className, ...props }, ref) {
  return (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={twMerge(
      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:bg-black dark:text-gray-300 dark:hover:bg-neutral-700",
      className,
    )}
    {...props}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </button>
  )
})

export default CloseButton
