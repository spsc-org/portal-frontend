import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Вітаємо{user?.name ? `, ${user.name}` : ''}</h1>
      <button
        type="button"
        onClick={logout}
        className="mt-4 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
      >
        Вийти
      </button>
    </div>
  )
}