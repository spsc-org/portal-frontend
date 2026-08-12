import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Typography } from '@material-tailwind/react'
import { apiFetch, ApiError } from '../../lib/api.js'
import AuthLayout from './AuthLayout.jsx'
import FormField from './FormField.jsx'
import { StatusAlert } from './FormAlert.jsx'
import { fieldError } from './formErrors.js'

// Еквівалент resources/views/auth/forgot-password.blade.php
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState(null)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors(null)
    setStatus(null)

    try {
      const payload = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })

      setStatus(payload?.message ?? 'Посилання для скидання пароля надіслано на вашу пошту.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.payload?.errors ?? null)
      } else {
        setErrors({ email: ['Не вдалося надіслати посилання'] })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Відновлення паролю">
      <Typography variant="small" color="gray" className="mb-4">
        Забули пароль? Не проблема. Просто повідомте нам свою адресу електронної пошти, і ми
        надішлемо вам посилання для скидання пароля, яке дозволить вам вибрати новий.
      </Typography>

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
        />

        <div className="flex items-center justify-end gap-4">
          <Link to="/login" className="text-sm text-gray-600 hover:underline">
            Назад
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Надсилання…' : 'Скинути пароль'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}