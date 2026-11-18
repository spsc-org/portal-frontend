import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Typography } from "@material-tailwind/react"
import Button from "../../components/Buttons/Button.jsx"
import { apiFetch, ApiError } from '../../lib/api.js'
import AuthLayout from './AuthLayout.jsx'
import FormField from './FormField.jsx'
import { fieldError } from './formErrors.js'

// Еквівалент resources/views/auth/confirm-password.blade.php
export default function ConfirmPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname ?? '/'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors(null)

    try {
      await apiFetch('/api/auth/confirm-password', { method: 'POST', body: { password } })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.payload?.errors ?? null)
      } else {
        setErrors({ password: ['Не вдалося підтвердити пароль'] })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Підтвердження паролю">
      <Typography variant="small" color="gray" className="mb-4">
        Це захищена ділянка застосунку. Будь ласка, підтвердіть свій пароль, перш ніж продовжити.
      </Typography>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField
          label="Пароль"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldError(errors, 'password')}
          required
          autoFocus
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Перевірка…' : 'Підтвердити'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}