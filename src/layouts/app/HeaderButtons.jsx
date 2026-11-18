import { Link } from 'react-router'

// Кнопки для <PageHeader actions> (Portal UI kit: h-8, radius-lg, primary — blue-600)
const BASE =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50'
const TONES = {
  primary: 'bg-blue-600 px-3 font-medium text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
  default:
    'border border-gray-200 bg-white px-3 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:bg-neutral-700 dark:hover:text-blue-300',
}
const ICON =
  'border border-gray-200 bg-white w-8 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:bg-neutral-700 dark:hover:text-blue-300'

/** Кнопка з текстом: "Додати" (tone="primary") та інші дії сторінки. `to` — посилання замість кнопки. */
export function HeaderButton({ children, icon, onClick, to, tone = 'primary', title, disabled, testId, type = 'button' }) {
  const className = `${BASE} ${TONES[tone] ?? TONES.primary}`
  const content = (
    <>
      {icon && <i className={`${icon} pointer-events-none text-xs`} />}
      {children}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={className} title={title} data-testid={testId}>
        {content}
      </Link>
    )
  }
  return (
    <button type={type} className={className} onClick={onClick} title={title} disabled={disabled} data-testid={testId}>
      {content}
    </button>
  )
}

/** Квадратна кнопка-іконка (налаштування, експорт, кошик…); `badge` — лічильник у кутку. */
export function HeaderIconButton({ icon, title, onClick, to, disabled, testId, badge, badgeTestId }) {
  const className = `${BASE} ${ICON}`
  const inner = <i className={`${icon} pointer-events-none text-sm`} />
  const button = to ? (
    <Link to={to} className={className} title={title} aria-label={title} data-testid={testId}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={className} title={title} aria-label={title} onClick={onClick} disabled={disabled} data-testid={testId}>
      {inner}
    </button>
  )
  if (badge == null) return button
  return (
    <span className="relative inline-flex">
      {button}
      <span
        data-testid={badgeTestId}
        className="pointer-events-none absolute -right-1.5 -top-1.5 flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-green-500 px-1 text-[0.65rem] text-white"
      >
        {badge}
      </span>
    </span>
  )
}
