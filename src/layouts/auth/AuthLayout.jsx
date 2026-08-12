import { Link } from 'react-router'
import AuthLogo from './AuthLogo.jsx'

// Візуальний еквівалент бекендового x-guest-layout: лого + центрована картка форми.
export default function AuthLayout({ title, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 py-10">
      <Link to="/" aria-label="Portal">
        <AuthLogo className="h-16 w-16 fill-current text-gray-400 transition-colors hover:text-gray-500" />
      </Link>

      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {title && <h1 className="mb-4 text-lg font-semibold text-gray-900">{title}</h1>}
        {children}
      </div>
    </div>
  )
}