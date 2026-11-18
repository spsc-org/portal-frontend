import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Checkbox } from "@material-tailwind/react"
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
    <AuthLayout title="Вхід">
      <StatusAlert status={status} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldError(errors, 'email')}
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
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <Checkbox
            label="Запам'ятати мене"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            containerProps={{ className: 'p-0' }}
          />

          <Link to="/forgot-password" className="text-sm text-gray-600 hover:underline">
            Забули пароль?
          </Link>
        </div>

        <Button type="submit" disabled={submitting} fullWidth>
          {submitting ? 'Вхід…' : 'Увійти'}
        </Button>
      </form>
    </AuthLayout>
  )
}