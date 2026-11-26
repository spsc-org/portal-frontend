// Ширини лейблів для природного вигляду (не однакові прямокутники) —
// той самий підхід, що й SectionSkeleton/StatCardSkeleton (Welcome).
const LABEL_WIDTHS = ['w-20', 'w-24', 'w-16', 'w-28', 'w-20', 'w-24', 'w-16', 'w-24', 'w-20', 'w-28']

/**
 * Плейсхолдер для <nav> у Sidebar.jsx, поки GET /api/me (menu.catalog) ще
 * не відповів — без нього список пунктів меню на мить рендериться порожнім.
 * Розміри — як у пунктів меню (40px / 44px у згорнутому сайдбарі).
 */
export default function SidebarNavSkeleton({ open }) {
  return (
    <div className="flex animate-pulse flex-col gap-px" aria-hidden="true">
      {LABEL_WIDTHS.map((width, index) => (
        <div
          key={index}
          className={open ? 'flex h-7 items-center gap-2 px-2' : 'mx-auto flex h-8 w-8 items-center justify-center'}
        >
          <span className="h-3.5 w-3.5 shrink-0 rounded bg-neutral-700" />
          {open && <span className={`h-3 ${width} rounded-full bg-neutral-700`} />}
        </div>
      ))}
    </div>
  )
}
