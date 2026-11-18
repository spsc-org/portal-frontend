import { createContext, useContext } from "react"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react"
import { twMerge } from "tailwind-merge"
import CloseButton from "../Buttons/CloseButton.jsx"

// Portal UI kit — Modal: фіксований header / тіло, що скролиться / фіксований footer.
//   поверхня surface-card (white / neutral-800), межі border-default (gray-200 / neutral-700),
//   radius-xl, відступ від країв вікна space-3, кругла кнопка закриття в header.
// fullHeight — для панелей налаштувань/редагування: висота = вікно мінус 2×space-3, не стискається
// під короткий вміст (позиція footer стабільна між панелями).
// `handler` прийнято як синонім `onClose` (сумісність з викликами MT Dialog).

const ModalContext = createContext({ onClose: undefined })

export function Modal({ open, onClose, handler, size = "md", fullHeight = false, className, children, ...props }) {
  const close = onClose ?? handler
  return (
    <Dialog
      open={Boolean(open)}
      handler={close ?? (() => {})}
      size={size}
      className={twMerge(
        "m-3 flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white font-sans text-sm font-normal text-gray-700 shadow-sm antialiased dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300",
        fullHeight && "h-[calc(100vh-1.5rem)]",
        className,
      )}
      {...props}
    >
      <ModalContext.Provider value={{ onClose: close }}>{children}</ModalContext.Provider>
    </Dialog>
  )
}

/** Заголовок: `title` (heading-modal: 16px bold uppercase, ink-strong) або власний вміст + кнопка закриття. */
export function ModalHeader({ title, children, hideClose = false, className, ...props }) {
  const { onClose } = useContext(ModalContext)
  return (
    <DialogHeader
      className={twMerge(
        "flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 text-base font-bold text-gray-800 dark:border-neutral-700 dark:text-gray-300",
        className,
      )}
      {...props}
    >
      {title != null ? <h3 className="min-w-0 truncate text-base font-bold uppercase">{title}</h3> : null}
      {children}
      {!hideClose && onClose ? <CloseButton onClick={onClose} className="ml-auto" /> : null}
    </DialogHeader>
  )
}

export function ModalBody({ className, children, ...props }) {
  return (
    <DialogBody
      className={twMerge(
        "min-h-0 flex-1 overflow-y-auto px-4 py-3 font-sans text-sm font-normal text-gray-700 dark:text-gray-300",
        className,
      )}
      {...props}
    >
      {children}
    </DialogBody>
  )
}

export function ModalFooter({ className, children, ...props }) {
  return (
    <DialogFooter
      className={twMerge(
        "flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-neutral-700",
        className,
      )}
      {...props}
    >
      {children}
    </DialogFooter>
  )
}

/** Підзаголовок блоку всередині тіла (section-label: 14px bold). */
export function ModalSectionLabel({ className, children }) {
  return <p className={twMerge("mb-2 text-sm font-bold text-gray-700 dark:text-gray-300", className)}>{children}</p>
}

export default Modal
