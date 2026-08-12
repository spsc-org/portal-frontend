import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '@material-tailwind/react'
import { apiFetch, ApiError } from '../../lib/api.js'
import AuthLayout from './AuthLayout.jsx'
import FormField from './FormField.jsx'
import { fieldError } from './formErrors.js'

// Еквівалент resources/views/auth/reset-password.blade.php
export default function ResetPassword() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors(null)

    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: {
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        },
      })

      navigate('/login', { replace: true, state: { status: 'Пароль успішно змінено.' } })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.payload?.errors ?? null)
      } else {
        setErrors({ email: ['Не вдалося скинути пароль'] })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Новий пароль">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldError(errors, 'email')}
          required
          autoFocus
        />

        <FormField
          label="Пароль"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldError(errors, 'password')}
          required
          autoComplete="new-password"
        />

        <FormField
          label="Підтвердження паролю"
          type="password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          error={fieldError(errors, 'password_confirmation')}
          required
          autoComplete="new-password"
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Збереження…' : 'Скинути пароль'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}