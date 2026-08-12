import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Вітаємо{user?.name ? `, ${user.name}` : ''}</h1>
      <button
        type="button"
        onClick={logout}
        className="mt-4 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
      >
        Вийти
      </button>
    </div>
  )
}