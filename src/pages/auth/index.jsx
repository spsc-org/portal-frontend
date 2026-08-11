import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@material-tailwind/react'
import { useAuth } from '../../context/AuthContext.jsx'
import { ApiError } from '../../lib/api.js'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname ?? '/'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors(null)

    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.payload?.errors ?? { email: [error.message] })
      } else {
        setErrors({ email: ['Не вдалося виконати вхід'] })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-gray-900">Вхід</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {errors?.email && <p className="text-sm text-red-600">{[].concat(errors.email).join(', ')}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {errors?.password && <p className="text-sm text-red-600">{[].concat(errors.password).join(', ')}</p>}
        </div>

        <Button type="submit" disabled={submitting} fullWidth>
          {submitting ? 'Вхід…' : 'Увійти'}
        </Button>
      </form>
    </div>
  )
}