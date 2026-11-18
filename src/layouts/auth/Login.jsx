import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import Button from "../../components/Buttons/Button.jsx"
import { useSession } from '../../stores/storeHooks.js'
import { ApiError } from '../../lib/api.js'
import AuthLayout from './AuthLayout.jsx'
import FormField from './FormField.jsx'
import { StatusAlert } from './FormAlert.jsx'
import { fieldError } from './formErrors.js'

// Еквівалент resources/views/auth/login.blade.php
export default function Login() {
  const { login } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const status = location.state?.status ?? null
  const redirectTo = location.state?.from?.pathname ?? '/'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors(null)

    try {
      await login(email, password, remember)
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
    <AuthLayout title="Вхід до системи" subtitle="Використовуйте робочий обліковий запис.">
      <StatusAlert status={status} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField
          label="Електронна пошта"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldError(errors, 'email')}
          placeholder="name@company.ua"
          required
          autoFocus
          autoComplete="username"
        />

        <FormField
          label="Пароль"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldError(errors, 'password')}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          labelAside={
            <Link to="/forgot-password" className="text-[13px] text-blue-600 no-underline hover:text-blue-700 hover:underline">
              Забули пароль?
            </Link>
          }
        />

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-300"
          />
          Запам'ятати мене на цьому пристрої
        </label>

        <Button type="submit" disabled={submitting} fullWidth size="lg" className="h-11 rounded-lg text-sm">
          {submitting ? 'Вхід…' : 'Увійти'}
        </Button>
      </form>
    </AuthLayout>
  )
}
