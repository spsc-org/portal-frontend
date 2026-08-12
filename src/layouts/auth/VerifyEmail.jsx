import { useState } from 'react'
import { Button, Typography } from '@material-tailwind/react'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiFetch, ApiError } from '../../lib/api.js'
import AuthLayout from './AuthLayout.jsx'
import { StatusAlert } from './FormAlert.jsx'

// Еквівалент resources/views/auth/verify-email.blade.php
export default function VerifyEmail() {
  const { logout } = useAuth()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleResend() {
    setSubmitting(true)
    setError(null)
    setSent(false)

    try {
      await apiFetch('/api/auth/email/verification-notification', { method: 'POST' })
      setSent(true)
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Не вдалося надіслати лист')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Підтвердження email">
      <Typography variant="small" color="gray" className="mb-4">
        Дякуємо за реєстрацію! Перш ніж почати, підтвердьте, будь ласка, свою електронну адресу,
        перейшовши за посиланням, яке ми щойно надіслали. Якщо лист не прийшов, ми з радістю
        надішлемо ще один.
      </Typography>

      <StatusAlert status={sent ? 'Нове посилання для підтвердження надіслано на вашу пошту.' : null} />
      {error && (
        <Typography variant="small" color="red" className="mb-4">
          {error}
        </Typography>
      )}

      <div className="flex items-center justify-between">
        <Button onClick={handleResend} disabled={submitting}>
          {submitting ? 'Надсилання…' : 'Надіслати ще раз'}
        </Button>

        <button
          type="button"
          onClick={logout}
          className="text-sm text-gray-600 underline hover:text-gray-900"
        >
          Вийти
        </button>
      </div>
    </AuthLayout>
  )
}