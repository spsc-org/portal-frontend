import { Link, isRouteErrorResponse, useRouteError } from 'react-router'

export default function NotFound() {
  const error = useRouteError()
  // Без error — це catch-all маршрут '*' (сторінки немає), а не збій рендера.
  const isNotFound = !error || (isRouteErrorResponse(error) && error.status === 404)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center dark:bg-neutral-900">
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {isNotFound ? 'Такої сторінки не існує' : 'Сталася непередбачена помилка'}
      </h1>
      <p className="max-w-sm text-sm text-gray-600 dark:text-gray-400">
        {isNotFound
          ? 'Перевірте адресу або поверніться на головну сторінку.'
          : 'Спробуйте оновити сторінку або повернутися на головну.'}
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
