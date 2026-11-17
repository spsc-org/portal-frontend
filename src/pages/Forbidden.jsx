import { Link } from 'react-router'

/** 403 у межах AuthorizedLayout (сайдбар лишається — можна перейти деінде). */
export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-semibold text-red-600 dark:text-red-400">403</p>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Немає доступу</h1>
      <p className="max-w-sm text-sm text-gray-600 dark:text-gray-400">
        У вас немає прав на перегляд цієї сторінки. Зверніться до адміністратора, якщо вважаєте, що це помилка.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        На головну
      </Link>
    </div>
  )
}
