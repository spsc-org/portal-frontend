import { Typography } from '@material-tailwind/react'

// Ширини лейблів для природного вигляду (не однакові прямокутники) —
// той самий підхід, що й SectionSkeleton/StatCardSkeleton (Welcome).
const LABEL_WIDTHS = ['w-20', 'w-24', 'w-16', 'w-28', 'w-20', 'w-24', 'w-16', 'w-24', 'w-20', 'w-28']

/**
 * Плейсхолдер для <nav> у Sidebar.jsx, поки GET /api/me (menu.catalog) ще
 * не відповів — без нього список пунктів меню на мить рендериться порожнім.
 */
export default function SidebarNavSkeleton({ open }) {
  return (
    <div className="animate-pulse" aria-hidden="true">
      {LABEL_WIDTHS.map((width, index) => (
        <div key={index} className="my-1 flex items-center gap-1">
          <div className="flex-1 rounded-md border border-transparent px-2 py-1">
            <span className="flex min-w-0 items-center">
              <Typography as="div" variant="small" className="h-3 w-3 shrink-0 rounded-full bg-gray-300 dark:bg-slate-700">
                &nbsp;
              </Typography>
              {open && (
                <Typography as="div" variant="small" className={`mx-2 h-3 ${width} rounded-full bg-gray-300 dark:bg-slate-700`}>
                  &nbsp;
                </Typography>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}