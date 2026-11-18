import { Link } from 'react-router'
import PortalLogo from '../../components/PortalLogo.jsx'

// Макет «Portal — Login»: ліворуч темна панель продукту (ілюстрація + слоган),
// праворуч картка форми. Спільний для всіх сторінок авторизації.
const FEATURES = [
  { label: 'Проєкти', dot: 'bg-blue-400' },
  { label: 'Редагування', dot: 'bg-neutral-400' },
  { label: 'Експорт у подання', dot: 'bg-red-500' },
]

function BrandPanel() {
  return (
    <section
      aria-label="Про продукт"
      className="relative flex min-h-[560px] flex-[4.4_1_560px] flex-col justify-between overflow-hidden bg-neutral-900 px-12 py-10"
    >
      {/* ілюстрація з анімацією в самому SVG (prefers-reduced-motion враховано) */}
      <img src="/auth-illustration.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />

      <Link to="/" className="relative flex w-fit items-center gap-2.5 text-white" aria-label="Портал — на головну">
        <PortalLogo className="h-8 w-8 text-blue-400" />
        <span className="text-xl font-bold tracking-wide">Портал</span>
      </Link>

          </section>
  )
}

/**
 * title — заголовок картки (kit heading-modal: 16px bold uppercase), subtitle — пояснення під ним,
 * note — дрібний текст під карткою.
 */
export default function AuthLayout({
  title,
  subtitle,
  note = 'Доступ лише для авторизованих користувачів. Дії в системі журналюються.',
  children,
}) {
  return (
    <div className="flex min-h-screen flex-wrap bg-gray-200 font-sans text-gray-700">
      <BrandPanel />

      <main className="flex min-w-0 flex-[1_1_420px] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[400px] flex-col gap-4">
          <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white px-6 py-8">
            {(title || subtitle) && (
              <div className="flex flex-col gap-1">
                {title && <h2 className="m-0 text-base font-bold uppercase text-gray-800">{title}</h2>}
                {subtitle && <p className="m-0 text-sm text-gray-600">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
          {note && <p className="m-0 text-center text-xs text-gray-600">{note}</p>}
        </div>
      </main>
    </div>
  )
}
