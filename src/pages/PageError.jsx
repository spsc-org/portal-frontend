import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

/**
 * Помилка рендера/завантаження сторінки всередині AuthorizedLayout:
 * сайдбар лишається, падає лише контент сторінки.
 */
export default function PageError() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : null
  const message = error instanceof Error ? error.message : null

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-semibold text-red-600 dark:text-red-400">{status ?? 'Помилка'}</p>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Не вдалося показати сторінку</h1>
      <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
        Спробуйте оновити сторінку. Якщо помилка повторюється — повідомте про неї через «Залишити відгук» (Alt+B).
      </p>
      {import.meta.env.DEV && message && (
        <pre className="max-w-2xl overflow-auto rounded-md bg-gray-100 p-3 text-left text-xs text-red-700 dark:bg-neutral-700 dark:text-red-300">
          {message}
        </pre>
      )}
      <Link
        to="/"
        className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        На головну
      </Link>
    </div>
  )
}
